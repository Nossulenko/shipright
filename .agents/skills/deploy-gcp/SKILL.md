---
name: deploy-gcp
description: User-invoked only. Deploy an app from apps/ to Google Cloud Run, with a budget alert, Secret Manager, optional Cloud SQL for PostgreSQL, and a GitHub Actions pipeline authenticated by Workload Identity Federation (no service-account keys). Writes the runbook to docs/deploy/gcp.md.
argument-hint: "[app name under apps/]"
disable-model-invocation: true
---

# /deploy-gcp — Cloud Run, the simplest path to a URL

> **Role:** devops-engineer · **Input:** `apps/<name>/` with a Dockerfile, Project Profile · **Output:** a public `https://…run.app` URL, `.github/workflows/deploy-gcp.yml`, `docs/deploy/gcp.md` · **Next:** `/next`

## What this does

Cloud Run runs your container and gives it an HTTPS URL. It scales down to zero when nobody is using the app, so a small project costs little or nothing. This skill deploys once by hand (so you see every piece), then sets up GitHub Actions so every merge to `main` deploys automatically — using **Workload Identity Federation (WIF)**: GitHub proves who it is with a short-lived token instead of a stored password.

## Before you start

- Run `/deploy` first — it does the shared preflight (verify, Dockerfile, local container, health check).
- If `docs/deploy/gcp.md` exists, this is a redeploy: follow its "Redeploy" section instead.
- **Golden rule:** before every command marked 💰 (costs money) or 🗑️ (deletes), show the exact command, the project and region, and wait for a clear "yes". One yes = one command.

Set these once per terminal session (ask the human for values; suggest defaults):

```bash
export APP=web                                 # folder under apps/
export SERVICE=<product>-web                    # Cloud Run service name, lowercase + dashes
export PROJECT_ID=<your-project-id>
export REGION=<closest-region-to-users>         # e.g. europe-west1, us-central1
export AR_REPO=<product>                        # Artifact Registry repository name
```

## Steps

### Step 0 — Preflight: CLI, login, project, region

```bash
gcloud --version                     # missing? https://cloud.google.com/sdk/docs/install
gcloud auth login                    # opens a browser
gcloud config list                   # shows the active account and project
gcloud billing accounts list         # you need an OPEN billing account
```

- No project yet? Ask, then: `gcloud projects create $PROJECT_ID` and 💰 `gcloud billing projects link $PROJECT_ID --billing-account=<ACCOUNT_ID>`.
- Set defaults: `gcloud config set project $PROJECT_ID` and `gcloud config set run/region $REGION`.
- **Show the human** the account, project, billing account and region, and ask: *"Deploy into this project and region?"* Do not continue without a yes.
- Enable the APIs (free to enable; using them may cost):
  ```bash
  gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
    secretmanager.googleapis.com iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
    billingbudgets.googleapis.com
  ```

> **Cost note:** Cloud Run has a monthly free tier and bills per request/CPU-second above it. Cloud Build, Artifact Registry storage and Cloud SQL are billed separately. Check https://cloud.google.com/run/pricing.

### Step 1 — Container runs locally

Confirm `/deploy` preflight passed for `apps/$APP`. Cloud Run sends traffic to the port in the `PORT` environment variable (8080 by default) — the ShipRight Dockerfiles already listen on `$PORT`.

### Step 2 — 💰 Budget alert (before anything paid)

A budget **does not stop spending**; it emails billing admins when spend crosses each threshold. Suggest a small amount (e.g. 20 in the billing currency):

```bash
gcloud billing budgets create --billing-account=<ACCOUNT_ID> \
  --display-name="$SERVICE monthly budget" --budget-amount=20USD \
  --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0
```

### Step 3 — 💰 First deploy, by hand

1. Create a dedicated **runtime service account** — the identity your app runs as (least privilege: it only gets what the app needs):
   ```bash
   gcloud iam service-accounts create $SERVICE-runtime --display-name="$SERVICE runtime"
   export RUNTIME_SA=$SERVICE-runtime@$PROJECT_ID.iam.gserviceaccount.com
   ```
2. Deploy from source. Cloud Build builds your Dockerfile (or uses buildpacks if there is none), stores the image in Artifact Registry, and starts the service:
   ```bash
   gcloud run deploy $SERVICE --source apps/$APP --region $REGION \
     --service-account $RUNTIME_SA --allow-unauthenticated \
     --min-instances 0 --max-instances 3
   ```
   - First time, it offers to create an Artifact Registry repo named `cloud-run-source-deploy` — answer **Y**.
   - `--allow-unauthenticated` makes the URL public. Leave it off for internal tools. Some company accounts block public services with an org policy — if so, ask your cloud admin.
   - `--max-instances 3` caps how far it scales (and how much it can cost).
   - Build fails with a permission error? Grant the build identity the builder role, then retry:
     ```bash
     PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
     gcloud projects add-iam-policy-binding $PROJECT_ID \
       --member=serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com --role=roles/run.builder
     ```
3. Get the URL and check it:
   ```bash
   export URL=$(gcloud run services describe $SERVICE --region $REGION --format='value(status.url)')
   curl -fsS $URL/health      # or $URL/api/health for Next.js
   ```

### Step 4 — Config and secrets

- **Plain config** (not secret):
  ```bash
  gcloud run services update $SERVICE --region $REGION --update-env-vars NODE_ENV=production,LOG_LEVEL=info
  ```
- **Secrets** go in **Secret Manager** (an encrypted store; the app reads values at start-up). Read the value without it landing in your shell history:
  ```bash
  read -rs SECRET_VALUE && printf '%s' "$SECRET_VALUE" | gcloud secrets create database-url --data-file=- ; unset SECRET_VALUE
  gcloud secrets add-iam-policy-binding database-url \
    --member=serviceAccount:$RUNTIME_SA --role=roles/secretmanager.secretAccessor
  gcloud run services update $SERVICE --region $REGION --update-secrets=DATABASE_URL=database-url:latest
  ```
  Name secrets in kebab-case; map them to the env var names in `.env.example`. To rotate: `gcloud secrets versions add database-url --data-file=-`, then redeploy.

### Step 5 — 💰 Database (optional): Cloud SQL for PostgreSQL

Skip if the app has no database. Cloud SQL **does not scale to zero** — the smallest instance is billed every hour it exists. Tell the human before creating it.

```bash
gcloud services enable sqladmin.googleapis.com
gcloud sql instances create $SERVICE-db --database-version=POSTGRES_17 --edition=ENTERPRISE \
  --tier=db-f1-micro --region=$REGION --storage-size=10GB --storage-auto-increase
gcloud sql databases create app --instance=$SERVICE-db
read -rs DB_PASSWORD && gcloud sql users create app --instance=$SERVICE-db --password="$DB_PASSWORD"
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$RUNTIME_SA --role=roles/cloudsql.client
gcloud run services update $SERVICE --region $REGION --add-cloudsql-instances=$PROJECT_ID:$REGION:$SERVICE-db
```

Cloud Run reaches the database over a Unix socket. Store this as the `database-url` secret (Step 4):
`postgresql://app:<DB_PASSWORD>@localhost/app?host=/cloudsql/<PROJECT_ID>:<REGION>:<SERVICE>-db`

Run migrations from your laptop through the **Cloud SQL Auth Proxy** (`cloud-sql-proxy <PROJECT_ID>:<REGION>:<SERVICE>-db --port 5433`, then point the migrate command at `localhost:5433`), or as a Cloud Run job using the same image. Never use a "push schema" command against production — always migrations.

### Step 6 — CI/CD with Workload Identity Federation

1. Create the image repository GitHub Actions will push to:
   ```bash
   gcloud artifacts repositories create $AR_REPO --repository-format=docker --location=$REGION
   ```
2. Run the setup script. It prints everything it will create and asks y/N first:
   ```bash
   bash .agents/skills/deploy-gcp/references/setup-wif.sh
   ```
   It creates a **deployer** service account, a workload identity pool + GitHub provider restricted to *this repository*, and grants only: deploy to Cloud Run, push to Artifact Registry, act as the runtime service account.
3. Store the identifiers as GitHub **variables** (they are not secrets) — the script prints these commands:
   `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WIF_PROVIDER`, `GCP_DEPLOYER_SA`, `GCP_RUNTIME_SA`, `GCP_AR_REPO`, `CLOUD_RUN_SERVICE`, `APP_DIR`, `HEALTH_PATH`.
4. Copy [`references/github-actions-cloud-run.yml`](references/github-actions-cloud-run.yml) to `.github/workflows/deploy-gcp.yml`. The guard hook asks before writing CI files — that is expected. Commit it on a branch and open a PR with `/ship`; the deploy runs when it merges to `main`.

### Step 7 — Verify

```bash
curl -fsS $URL/health
gcloud run services logs read $SERVICE --region $REGION --limit 50
```

If the app has `@smoke` scenarios, run them against the live URL (from `apps/$APP`): `BASE_URL=$URL npx playwright test --grep @smoke`.

### Step 8 — Write the runbook

Copy [`references/runbook-template.md`](references/runbook-template.md) to `docs/deploy/gcp.md` and fill in every `<…>`: project, region, service, URL, runtime/deployer service accounts, secrets (names only), database instance, workflow file, and the exact redeploy, rollback, logs and teardown commands. Commit it with the workflow.

Rollback (put this in the runbook): list revisions with `gcloud run revisions list --service $SERVICE --region $REGION`, then send all traffic to the last good one with `gcloud run services update-traffic $SERVICE --region $REGION --to-revisions <REVISION>=100`.

## Static frontends (optional)

A static SPA (React + Vite) deploys the same way: the stack profile's nginx Dockerfile serves the built files on Cloud Run. **Firebase Hosting** is an alternative for static sites (`npm i -g firebase-tools`, `firebase login`, `firebase init hosting`, `firebase deploy --only hosting`). Its usual GitHub Action asks for a service-account key — ShipRight avoids keys, so in CI authenticate with `google-github-actions/auth` (WIF) first and then run `npx firebase-tools deploy --only hosting`; grant the deployer `roles/firebasehosting.admin`.

## 🗑️ Teardown

Only when the human asks, and only after they type the service name to confirm. List what will be deleted first.

```bash
gcloud run services delete $SERVICE --region $REGION
gcloud sql instances delete $SERVICE-db                   # deletes all data — backups go too
gcloud secrets delete database-url
gcloud artifacts repositories delete $AR_REPO --location $REGION
gcloud artifacts repositories delete cloud-run-source-deploy --location $REGION
```

Deleting the whole project (`gcloud projects delete $PROJECT_ID`) removes everything and stops all billing; it can be undone within 30 days. Remove the workflow file or disable it, and delete the budget if no longer needed.

## Gate — before moving on

- [ ] Budget alert exists
- [ ] `curl $URL/health` returns 200
- [ ] Secrets are in Secret Manager, none in the repo or workflow
- [ ] The deploy workflow uses WIF (no `credentials_json`, no key files)
- [ ] `docs/deploy/gcp.md` is filled in and committed

## Tell the human

- The live URL, what was created (with a cost note for each), and where the runbook is.
- In Teaching mode: **What I did** — packaged the app as a container, ran it on Cloud Run, and connected GitHub with short-lived tokens. **Why** — no passwords to leak, and every merge deploys the same way. **What to check** — open the URL, then the Cloud Run page in the console to see revisions and logs.
- Next: `/next`.
