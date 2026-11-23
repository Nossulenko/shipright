# Deploy runbooks

This folder holds one **runbook** per cloud you deploy to — `aws.md`, `azure.md` or `gcp.md`. The deploy skills write them; you keep them true.

A runbook answers the questions you will have at 2 a.m.: *What is running, where, and what does it cost? How do I redeploy, roll back, read the logs, rotate a secret, or tear it all down?* It lists resource **names** and secret **names** — never secret values.

## How a runbook gets here

1. Run `/deploy` — it checks the app is ready (gates green, container builds, `/health` answers) and picks the cloud from the Project Profile in `AGENTS.md`.
2. It hands over to the cloud skill, which deploys by hand once, sets up GitHub Actions with OIDC, and at the end copies its runbook template here and fills it in.
3. Commit the runbook in the same PR as the deploy workflow. Any later infrastructure change updates the runbook in the same PR.

If a runbook already exists, the deploy skills treat the next run as a **redeploy** and follow the runbook instead of creating resources again.

## Clouds and default services

| | Google Cloud | Azure | AWS |
| --- | --- | --- | --- |
| Skill | [`/deploy-gcp`](../../.agents/skills/deploy-gcp/SKILL.md) | [`/deploy-azure`](../../.agents/skills/deploy-azure/SKILL.md) | [`/deploy-aws`](../../.agents/skills/deploy-aws/SKILL.md) |
| Runs your container | Cloud Run | Azure Container Apps | Amazon ECS Express Mode |
| Scales to zero | Yes | Yes (Consumption plan) | No — one task + load balancer always on |
| Container registry | Artifact Registry | Azure Container Registry | Amazon ECR |
| Secrets | Secret Manager | Key Vault | Secrets Manager |
| PostgreSQL (optional) | Cloud SQL | Database for PostgreSQL Flexible Server | RDS for PostgreSQL |
| CI authentication | Workload Identity Federation | OIDC federated credential on a managed identity | IAM role trusted via GitHub OIDC |
| Static frontend option | Firebase Hosting | Static Web Apps | Amplify Hosting |
| Runbook | `gcp.md` | `azure.md` | `aws.md` |

> AWS App Runner stopped accepting new customers on 30 April 2026. Shipright uses ECS Express Mode, which AWS recommends instead.

## Rules every deploy follows

- **Budget alert first**, before any paid resource.
- **Ask before spending or deleting** — every billable or destructive command is shown with its target account and region, and needs an explicit yes.
- **No long-lived keys.** GitHub Actions authenticates with OIDC; the IDs it needs are stored as GitHub *variables*, not secrets.
- **Secrets live in the cloud's secret manager**, injected as environment variables at runtime.
- **Every deploy is verified** with `curl <url>/health` and, where they exist, the `@smoke` scenarios against the live URL.
- **Teardown is documented** and always asks for confirmation by name.
