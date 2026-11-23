# Runbook — Google Cloud Run

> Written by `/deploy-gcp`. Keep it true: update it in the same PR as any infrastructure change.
> Never put secret **values** here — names only.

| | |
| --- | --- |
| Live URL | `<https://SERVICE-HASH-REGION.a.run.app>` |
| Custom domain | `<none / app.example.com>` |
| Project | `<PROJECT_ID>` (number `<PROJECT_NUMBER>`) |
| Billing account / budget | `<ACCOUNT_ID>` — budget `<SERVICE monthly budget>` at `<20 USD>` |
| Region | `<REGION>` |
| App folder | `apps/<APP>` |
| Health path | `</health>` |
| Last updated | `<YYYY-MM-DD>` by `<name>` |

## Resources

| Resource | Name | Notes / cost |
| --- | --- | --- |
| Cloud Run service | `<SERVICE>` | min 0 / max `<3>` instances — scales to zero |
| Runtime service account | `<SERVICE>-runtime@<PROJECT_ID>.iam.gserviceaccount.com` | what the app runs as |
| Deployer service account | `<SERVICE>-deployer@<PROJECT_ID>.iam.gserviceaccount.com` | used only by GitHub Actions via WIF |
| Workload identity pool / provider | `github` / `<PROVIDER>` | trusts only `<owner/repo>` on `main` |
| Artifact Registry | `<AR_REPO>` (+ `cloud-run-source-deploy`) | image storage — billed per GB |
| Secret Manager | `<database-url>`, `<…>` | mounted as env vars |
| Cloud SQL (optional) | `<SERVICE>-db` (`db-f1-micro`, PostgreSQL 17) | billed hourly, does **not** scale to zero |

## Configuration

| Env var | Source | Example / secret name |
| --- | --- | --- |
| `NODE_ENV` | plain env var | `production` |
| `DATABASE_URL` | Secret Manager | `database-url:latest` |
| `<…>` | | |

## Redeploy

- **Normal path:** merge to `main` → `.github/workflows/deploy-gcp.yml` builds, pushes and deploys.
- **By hand (emergency):**
  ```bash
  gcloud run deploy <SERVICE> --source apps/<APP> --region <REGION> --service-account <RUNTIME_SA>
  ```

## Rollback

```bash
gcloud run revisions list --service <SERVICE> --region <REGION>
gcloud run services update-traffic <SERVICE> --region <REGION> --to-revisions <GOOD_REVISION>=100
```

Then revert the bad commit on `main` so the next deploy does not bring it back.

## Logs and health

```bash
curl -fsS <URL></health>
gcloud run services logs read <SERVICE> --region <REGION> --limit 100
```

Console: Cloud Run → `<SERVICE>` → Logs / Metrics / Revisions.

## Secrets rotation

```bash
read -rs V && printf '%s' "$V" | gcloud secrets versions add <secret-name> --data-file=- ; unset V
gcloud run services update <SERVICE> --region <REGION>   # new revision picks up :latest
```

## Database

- Connection: Unix socket `/cloudsql/<PROJECT_ID>:<REGION>:<SERVICE>-db`
- Migrations: `<command>` via `cloud-sql-proxy <PROJECT_ID>:<REGION>:<SERVICE>-db --port 5433`
- Backups: `gcloud sql backups list --instance <SERVICE>-db`

## Teardown (destructive — confirm first)

```bash
gcloud run services delete <SERVICE> --region <REGION>
gcloud sql instances delete <SERVICE>-db
gcloud secrets delete <secret-name>
gcloud artifacts repositories delete <AR_REPO> --location <REGION>
gcloud iam service-accounts delete <SERVICE>-deployer@<PROJECT_ID>.iam.gserviceaccount.com
gcloud iam service-accounts delete <SERVICE>-runtime@<PROJECT_ID>.iam.gserviceaccount.com
```

Or delete the whole project: `gcloud projects delete <PROJECT_ID>` (recoverable for 30 days). Disable `.github/workflows/deploy-gcp.yml` afterwards.
