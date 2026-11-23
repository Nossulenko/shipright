---
name: deploy-azure
description: User-invoked only. Deploy an app from apps/ to Azure Container Apps, with a budget alert, Azure Container Registry, Key Vault secrets, optional Azure Database for PostgreSQL Flexible Server, and a GitHub Actions pipeline authenticated by OIDC federated credentials (no client secrets). Writes the runbook to docs/deploy/azure.md.
argument-hint: "[app name under apps/]"
disable-model-invocation: true
---

# /deploy-azure — Azure Container Apps

> **Role:** devops-engineer · **Input:** `apps/<name>/` with a Dockerfile, Project Profile · **Output:** a public `https://…azurecontainerapps.io` URL, `.github/workflows/deploy-azure.yml`, `docs/deploy/azure.md` · **Next:** `/next`

## What this does

Azure Container Apps runs your container behind HTTPS and can scale to zero on the Consumption plan. Everything for this product goes into **one resource group** (a folder for Azure resources), so it is easy to see, cost and delete. You deploy once by hand, then GitHub Actions deploys every merge to `main` using **OIDC federated credentials**: Azure trusts GitHub's short-lived token for this one repository, so no password or client secret is stored anywhere.

## Before you start

- Run `/deploy` first — it does the shared preflight (verify, Dockerfile, local container, health check).
- If `docs/deploy/azure.md` exists, this is a redeploy: follow its "Redeploy" section instead.
- **Golden rule:** before every command marked 💰 (costs money) or 🗑️ (deletes), show the exact command, the subscription and region, and wait for a clear "yes". One yes = one command.

Set these once per terminal session (ask for values; suggest defaults):

```bash
export APP=web                          # folder under apps/
export NAME=<product>-web               # container app name: lowercase, dashes
export RG=rg-<product>                  # one resource group per product
export LOCATION=<closest-region>        # e.g. westeurope, eastus — `az account list-locations -o table`
export ENVIRONMENT=cae-<product>        # Container Apps environment
export ACR=acr<product>                 # registry: 5-50 letters/digits, globally unique, no dashes
export KV=kv-<product>                  # Key Vault: 3-24 chars, globally unique
```

## Steps

### Step 0 — Preflight: CLI, login, subscription, region

```bash
az version                             # missing? https://learn.microsoft.com/cli/azure/install-azure-cli
az login                               # opens a browser
az account show --query "{subscription:name, id:id, tenant:tenantId, user:user.name}" -o table
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.KeyVault
```

- More than one subscription? `az account list -o table`, then `az account set --subscription <id>`.
- **Show the human** the subscription, tenant, user and region, and ask: *"Deploy into this subscription and region?"* Do not continue without a yes.

> **Cost note:** the Container Apps Consumption plan has a monthly free grant and bills per vCPU-second, GiB-second and request above it. The registry (Basic tier) and Log Analytics are billed separately; PostgreSQL is billed hourly. Check https://azure.microsoft.com/pricing/details/container-apps/.

### Step 1 — Container runs locally

Confirm `/deploy` preflight passed for `apps/$APP`. The Shipright Dockerfiles listen on `$PORT` (default 8080) and declare `EXPOSE 8080`.

### Step 2 — 💰 Budget alert (before anything paid)

A budget **does not stop spending**; it emails you when spend crosses a threshold. Easiest path for email alerts: Azure portal → **Cost Management + Billing → Budgets → Add**, scope = the subscription, amount e.g. 20, alerts at 50 %, 90 % and 100 % to your email.

CLI alternative (creates the budget; add the email alerts in the portal afterwards — the `consumption` command group is in preview):

```bash
az consumption budget create --budget-name "$NAME-monthly" --category cost --amount 20 \
  --time-grain monthly --start-date "$(date +%Y-%m-01)" --end-date <YYYY-MM-DD one year from now>
```

### Step 3 — 💰 First deploy, by hand

```bash
az group create --name $RG --location $LOCATION
az acr create --name $ACR --resource-group $RG --sku Basic
az containerapp up --name $NAME --resource-group $RG --location $LOCATION \
  --environment $ENVIRONMENT --registry-server $ACR.azurecr.io \
  --source apps/$APP --ingress external --target-port 8080
```

`containerapp up` builds the image from your Dockerfile, pushes it to the registry, creates the Container Apps environment (with a Log Analytics workspace for logs) and starts the app. Then cap scaling and fetch the URL:

```bash
az containerapp update --name $NAME --resource-group $RG --min-replicas 0 --max-replicas 3
export URL=https://$(az containerapp show -n $NAME -g $RG --query properties.configuration.ingress.fqdn -o tsv)
curl -fsS $URL/health          # or $URL/api/health for Next.js
```

`--min-replicas 0` lets it scale to zero (the first request after idle is slower — a "cold start"). `--max-replicas 3` caps cost.

### Step 4 — Config and secrets

- **Plain config** (not secret):
  ```bash
  az containerapp update -n $NAME -g $RG --set-env-vars NODE_ENV=production LOG_LEVEL=info
  ```
- **Secrets** go in **Key Vault** (an encrypted store). The app gets a **managed identity** — an Azure-managed identity for the app itself, so it can read the vault without any password.
  ```bash
  az keyvault create --name $KV --resource-group $RG --location $LOCATION --enable-rbac-authorization true
  KV_ID=$(az keyvault show --name $KV --query id -o tsv)
  # You need permission to write secrets into the vault:
  az role assignment create --role "Key Vault Secrets Officer" \
    --assignee "$(az ad signed-in-user show --query id -o tsv)" --scope "$KV_ID"
  read -rs SECRET_VALUE && az keyvault secret set --vault-name $KV --name database-url --value "$SECRET_VALUE" -o none; unset SECRET_VALUE

  # Give the app an identity and let it read secrets:
  APP_PRINCIPAL=$(az containerapp identity assign -n $NAME -g $RG --system-assigned --query principalId -o tsv)
  az role assignment create --role "Key Vault Secrets User" --assignee-object-id "$APP_PRINCIPAL" \
    --assignee-principal-type ServicePrincipal --scope "$KV_ID"

  # Reference the vault secret from the app, then expose it as an env var:
  az containerapp secret set -n $NAME -g $RG \
    --secrets "database-url=keyvaultref:https://$KV.vault.azure.net/secrets/database-url,identityref:system"
  az containerapp update -n $NAME -g $RG --set-env-vars "DATABASE_URL=secretref:database-url"
  ```
  Role assignments can take a minute or two to apply — if the secret reference fails, wait and retry. Without a version in the URI, the app picks up new secret versions automatically within about 30 minutes.

### Step 5 — 💰 Database (optional): Azure Database for PostgreSQL Flexible Server

Skip if the app has no database. The server is billed **every hour it runs** (you can stop it for up to 7 days with `az postgres flexible-server stop`). Tell the human before creating it; new Azure accounts may have a free-hours offer for the smallest Burstable size.

```bash
read -rs DB_PASSWORD
az postgres flexible-server create --name $NAME-db --resource-group $RG --location $LOCATION \
  --tier Burstable --sku-name Standard_B1ms --storage-size 32 --version 17 \
  --admin-user appadmin --admin-password "$DB_PASSWORD" --public-access 0.0.0.0
az postgres flexible-server db create --resource-group $RG --server-name $NAME-db --database-name app
```

`--public-access 0.0.0.0` lets Azure services (your container app) connect over TLS; it does **not** open it to your laptop. For migrations from your machine, add your IP temporarily:
`az postgres flexible-server firewall-rule create -g $RG --name $NAME-db --rule-name my-laptop --start-ip-address <YOUR_IP> --end-ip-address <YOUR_IP>` — delete the rule afterwards.

Store this as the `database-url` secret (Step 4):
`postgresql://appadmin:<DB_PASSWORD>@<NAME>-db.postgres.database.azure.com:5432/app?sslmode=require`

Always use migrations against this database, never a "push schema" command.

### Step 6 — CI/CD with OIDC federated credentials

1. Run the setup script. It prints everything it will create and asks y/N first:
   ```bash
   bash .agents/skills/deploy-azure/references/setup-oidc.sh
   ```
   It creates a **user-assigned managed identity** for GitHub, adds a **federated credential** that trusts only this repository's `production` environment, and grants it `Contributor` on this one resource group plus `AcrPush` on the registry.
2. Store the identifiers as GitHub **variables** (they are IDs, not secrets) — the script prints the `gh variable set` commands:
   `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, `AZURE_CONTAINER_APP`, `AZURE_ACR_NAME`, `APP_DIR`, `HEALTH_PATH`.
3. Copy [`references/github-actions-container-apps.yml`](references/github-actions-container-apps.yml) to `.github/workflows/deploy-azure.yml` (the guard hook asks before writing CI files — expected). Open a PR with `/ship`; the deploy runs when it merges to `main`.

### Step 7 — Verify

```bash
curl -fsS $URL/health
az containerapp logs show -n $NAME -g $RG --tail 50
az containerapp revision list -n $NAME -g $RG -o table
```

If the app has `@smoke` scenarios, run them against the live URL (from `apps/$APP`): `BASE_URL=$URL npx playwright test --grep @smoke`.

### Step 8 — Write the runbook

Copy [`references/runbook-template.md`](references/runbook-template.md) to `docs/deploy/azure.md` and fill in every `<…>`: subscription, resource group, region, app, environment, registry, vault (secret names only), database, identity, workflow, and the redeploy, rollback, logs and teardown commands. Commit it with the workflow.

Rollback (put this in the runbook): images are tagged with the commit SHA, so redeploy the last good one:
`az containerapp update -n $NAME -g $RG --image $ACR.azurecr.io/$NAME:<GOOD_SHA>`

## Static frontends (optional)

The Shipright default for a static SPA is the same Container App flow with the stack profile's nginx Dockerfile — OIDC end to end. **Azure Static Web Apps** (free tier available) is an alternative: `az staticwebapp create --name $NAME-static --resource-group $RG --location <region> --sku Free`. Its GitHub deploy action authenticates with a **deployment token**, which is a long-lived secret: if you choose it, store the token as a GitHub *environment* secret, never in the repo, and rotate it with `az staticwebapp secrets reset-api-key`.

## 🗑️ Teardown

Only when the human asks, and only after they type the resource group name to confirm. Show what is in it first: `az resource list -g $RG -o table`.

```bash
az group delete --name $RG          # deletes EVERYTHING in the group, including the database and its data
```

Key Vault is soft-deleted and its name stays reserved for the retention period; `az keyvault purge --name $KV` frees it (irreversible). Delete the budget (`az consumption budget delete --budget-name "$NAME-monthly"`) and disable `.github/workflows/deploy-azure.yml`.

## Gate — before moving on

- [ ] Budget with email alerts exists
- [ ] `curl $URL/health` returns 200
- [ ] Secrets are Key Vault references, none in the repo or workflow
- [ ] The deploy workflow uses `azure/login` with OIDC (no `creds`, no client secret)
- [ ] `docs/deploy/azure.md` is filled in and committed

## Tell the human

- The live URL, what was created (with a cost note for each), and where the runbook is.
- In Teaching mode: **What I did** — put everything in one resource group, ran the container on Container Apps, stored secrets in Key Vault, and connected GitHub with OIDC. **Why** — one place to see and delete, and no passwords to leak. **What to check** — open the URL, then the resource group in the Azure portal.
- Next: `/next`.
