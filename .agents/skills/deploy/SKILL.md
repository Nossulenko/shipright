---
name: deploy
description: User-invoked only. Deploy the app to the cloud named in the Project Profile (AWS, Azure or Google Cloud). Runs the shared preflight (Dockerfile, local run, health check, npm run verify), helps pick a cloud if none is set, then routes to deploy-aws, deploy-azure or deploy-gcp.
argument-hint: "[aws|azure|gcp] [app name under apps/]"
disable-model-invocation: true
---

# /deploy — get the app running at a real URL

> **Role:** devops-engineer · **Input:** Project Profile, `apps/<name>/`, stack profile · **Output:** a running URL + `docs/deploy/<cloud>.md` · **Next:** share the URL, then `/next`

## What this does

This is the front door for deploying. It checks your app is ready to leave your laptop (it builds, runs in a container, answers `/health`, and passes `npm run verify`), helps you choose a cloud if you have not yet, and then hands over to the cloud-specific skill that does the actual deploy.

Nothing here spends money. The cloud skills ask before every paid step.

## Before you start

- The Project Profile in `AGENTS.md` must have **Frontend** and/or **Backend** set. If not, run `/start` first.
- At least one app must exist under `apps/`. If not, run `/scaffold` first.
- You need Docker (or Podman) installed: `docker --version`. If missing, install Docker Desktop (macOS/Windows) or Docker Engine (Linux).
- Commit or stash your work. Deploys should come from a clean, pushed commit so you know exactly what is running.

## Steps

### Step 1 — Pick the app and the cloud

1. List the apps: `ls apps/`. If there is more than one, ask which one to deploy (usually `web` for a full-stack Next.js app, or deploy `api` then `web`). If the human passed an app name, use it.
2. Read **Cloud** in the Project Profile.
   - If it is `aws`, `azure` or `gcp` (or the human passed one as an argument), go to Step 2.
   - If it is `not set`, explain the options with the table below, recommend one, and ask. When they choose, update the **Cloud** row in `AGENTS.md`.

| | **Google Cloud** (`gcp`) | **Azure** (`azure`) | **AWS** (`aws`) |
| --- | --- | --- | --- |
| Default service | Cloud Run | Azure Container Apps | Amazon ECS Express Mode |
| First deploy | One command from source: `gcloud run deploy --source .` | One command from source: `az containerapp up --source .` | Build image → push to ECR → create service (3 steps) |
| Scales to zero (no traffic = ~no compute bill) | Yes | Yes (Consumption plan) | No — at least one task plus a load balancer run 24/7 |
| Free usage each month | Yes, a monthly free tier for requests and CPU/memory | Yes, a monthly free grant for the Consumption plan | No always-free tier for Fargate or load balancers; new accounts get time-limited credits |
| Good when… | You want the simplest first deploy | Your company or school already uses Microsoft / Entra ID | Your company already runs on AWS |
| You need | A Google account + billing account, `gcloud` CLI | An Azure subscription, `az` CLI | An AWS account, AWS CLI v2 (latest) |

**Recommendation for a first product:** Google Cloud Run (simplest, scales to zero). Pick Azure or AWS if your team or employer already uses it — matching what your team knows beats a small cost difference. Always check the current pricing pages; free tiers change.

> **Heads-up for AWS:** AWS App Runner stopped accepting new customers on 30 April 2026. Older tutorials still show it — ignore them and use ECS Express Mode, which `/deploy-aws` uses.

### Step 2 — Shared preflight (all clouds)

Run each check and show the result. Stop at the first failure, explain it in plain words, and fix it (or ask) before continuing.

1. **Gates are green**
   ```bash
   npm run verify
   ```
2. **A Dockerfile exists** at `apps/<name>/Dockerfile`. If not, create it from the "Container" section of the matching stack profile in [`docs/stacks/`](../../../docs/stacks/README.md). Every Shipright Dockerfile is multi-stage, runs as a non-root user and listens on the `PORT` environment variable. Also make sure `apps/<name>/.dockerignore` exists and excludes `node_modules`, `.env*`, `.git`, build output and test reports.
3. **The image builds**
   ```bash
   docker build -t <name>:local apps/<name>
   ```
   On Apple Silicon Macs, cloud servers usually run `linux/amd64`. Cloud Run and Azure build images in the cloud so this does not matter there; for AWS the skill builds with `--platform linux/amd64` (or uses ARM64 deliberately).
4. **The container runs and is healthy**
   ```bash
   docker run --rm -d --name <name>-smoke -p 8080:8080 -e PORT=8080 <name>:local
   curl -fsS http://localhost:8080/health   # or /api/health for Next.js
   docker logs <name>-smoke | tail -20
   docker stop <name>-smoke
   ```
   Expect HTTP 200 and a small JSON body such as `{"status":"ok"}`. If the app needs a database or secrets to boot, pass them with `--env-file apps/<name>/.env` for this local check only — never bake them into the image.
5. **Config is documented.** Every environment variable the app reads is listed (with no real values) in `apps/<name>/.env.example`. Split them into *plain config* (e.g. `NODE_ENV`, `LOG_LEVEL`) and *secrets* (e.g. `DATABASE_URL`, API keys) — the cloud skill stores secrets in a secret manager.
6. **Know your health path.** Record it (`/health` or `/api/health`) — the cloud skill needs it.

### Step 3 — Hand over to the cloud skill

Tell the human which skill runs next and why, then follow it from its Step 0:

| Cloud | Skill |
| --- | --- |
| `gcp` | [`/deploy-gcp`](../deploy-gcp/SKILL.md) |
| `azure` | [`/deploy-azure`](../deploy-azure/SKILL.md) |
| `aws` | [`/deploy-aws`](../deploy-aws/SKILL.md) |

If `docs/deploy/<cloud>.md` already exists, this is a **redeploy**: read the runbook first and follow its "Redeploy" section instead of creating resources again.

## Gate — before moving on

- [ ] `npm run verify` is green
- [ ] The container builds and answers the health path locally
- [ ] `.env.example` lists every variable, split into config vs secrets
- [ ] The cloud is chosen and recorded in the Project Profile
- [ ] The human knows the next skill asks before any paid step

## Tell the human

- Which checks passed (one line each), and the cloud + skill that runs next.
- In Teaching mode: **What I did** — checked the app works inside a container, the same box the cloud will run. **Why** — if it fails here it fails in the cloud too, only slower and for money. **What to check** — open `http://localhost:8080/health` yourself while the container runs.
- Next command: `/deploy-<cloud>`.
