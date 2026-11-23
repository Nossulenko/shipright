# Runbook — Azure Container Apps

> Written by `/deploy-azure`. Keep it true: update it in the same PR as any infrastructure change.
> Never put secret **values** here — names only.

| | |
| --- | --- |
| Live URL | `<https://NAME.HASH.REGION.azurecontainerapps.io>` |
| Custom domain | `<none / app.example.com>` |
| Subscription | `<SUBSCRIPTION_NAME>` (`<SUBSCRIPTION_ID>`), tenant `<TENANT_ID>` |
| Budget | `<NAME-monthly>` at `<20>` with alerts at 50 / 90 / 100 % |
| Resource group | `<RG>` — **everything for this product lives here** |
| Region | `<LOCATION>` |
| App folder | `apps/<APP>` |
| Health path | `</health>` |
| Last updated | `<YYYY-MM-DD>` by `<name>` |

## Resources

| Resource | Name | Notes / cost |
| --- | --- | --- |
| Container App | `<NAME>` | min 0 / max `<3>` replicas — scales to zero |
| Container Apps environment | `<ENVIRONMENT>` | + Log Analytics workspace (billed per GB ingested) |
| Container Registry | `<ACR>.azurecr.io` (Basic) | billed daily |
| Key Vault | `<KV>` | secrets: `<database-url>`, `<…>` |
| GitHub identity | `id-<NAME>-github` | federated credential `github-production`; Contributor on `<RG>`, AcrPush on `<ACR>` |
| PostgreSQL Flexible Server (optional) | `<NAME>-db` (Burstable B1ms, PostgreSQL 17) | billed hourly; can be stopped up to 7 days |

## Configuration

| Env var | Source | Example / secret name |
| --- | --- | --- |
| `NODE_ENV` | plain env var | `production` |
| `DATABASE_URL` | Key Vault reference | `secretref:database-url` |
| `<…>` | | |

## Redeploy

- **Normal path:** merge to `main` → `.github/workflows/deploy-azure.yml` builds, pushes and deploys.
- **By hand (emergency):**
  ```bash
  az containerapp up --name <NAME> --resource-group <RG> --source apps/<APP>
  ```

## Rollback

```bash
az acr repository show-tags --name <ACR> --repository <NAME> --orderby time_desc -o table
az containerapp update -n <NAME> -g <RG> --image <ACR>.azurecr.io/<NAME>:<GOOD_SHA>
```

Then revert the bad commit on `main` so the next deploy does not bring it back.

## Logs and health

```bash
curl -fsS <URL></health>
az containerapp logs show -n <NAME> -g <RG> --tail 100
az containerapp logs show -n <NAME> -g <RG> --type system --tail 50   # platform events: pulls, crashes, scaling
az containerapp revision list -n <NAME> -g <RG> -o table
```

## Secrets rotation

```bash
read -rs V && az keyvault secret set --vault-name <KV> --name <secret-name> --value "$V" -o none; unset V
# Picked up automatically within ~30 minutes; to apply now:
az containerapp revision restart -n <NAME> -g <RG> --revision <ACTIVE_REVISION>
```

## Database

- Host: `<NAME>-db.postgres.database.azure.com`, database `app`, TLS required
- Migrations from a laptop: add a temporary firewall rule for your IP, run `<command>`, delete the rule
- Stop/start to save money: `az postgres flexible-server stop|start -g <RG> -n <NAME>-db`

## Teardown (destructive — confirm first)

```bash
az resource list -g <RG> -o table      # see what will go
az group delete --name <RG>            # deletes everything in the group, including data
az keyvault purge --name <KV>          # optional, irreversible: frees the vault name
az consumption budget delete --budget-name "<NAME-monthly>"
```

Disable `.github/workflows/deploy-azure.yml` afterwards.
