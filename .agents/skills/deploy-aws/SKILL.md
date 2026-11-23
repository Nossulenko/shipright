---
name: deploy-aws
description: User-invoked only. Deploy an app from apps/ to AWS with Amazon ECS Express Mode (ECR image → managed Fargate service with HTTPS load balancer), a budget alert, Secrets Manager, optional RDS for PostgreSQL, and a GitHub Actions pipeline authenticated by an IAM OIDC role (no access keys). Amplify Hosting is offered for Next.js frontends. Writes the runbook to docs/deploy/aws.md.
argument-hint: "[app name under apps/]"
disable-model-invocation: true
---

# /deploy-aws — Amazon ECS Express Mode

> **Role:** devops-engineer · **Input:** `apps/<name>/` with a Dockerfile, Project Profile · **Output:** a public `https://…ecs.<region>.on.aws` URL, `deploy/aws/primary-container.json`, `.github/workflows/deploy-aws.yml`, `docs/deploy/aws.md` · **Next:** `/next`

## What this does

**ECS Express Mode** takes a container image and creates everything around it for you: a Fargate service (servers you never manage), an HTTPS load balancer, security groups, auto scaling and logs. You push your image to **ECR** (Amazon's container registry — a private store for images), create the service once by hand, then GitHub Actions redeploys every merge to `main` using an **IAM role trusted through OIDC**, so no AWS access key is ever stored.

> ⚠️ **Do not follow AWS App Runner tutorials.** App Runner stopped accepting new customers on 30 April 2026; AWS recommends ECS Express Mode instead. Many blog posts and older LLM answers still suggest App Runner.

## Before you start

- Run `/deploy` first — it does the shared preflight (verify, Dockerfile, local container, health check).
- If `docs/deploy/aws.md` exists, this is a redeploy: follow its "Redeploy" section instead.
- **Golden rule:** before every command marked 💰 (costs money) or 🗑️ (deletes), show the exact command, the account and region, and wait for a clear "yes". One yes = one command.
- **Cost reality check:** unlike Cloud Run or Container Apps, an Express service does **not** scale to zero — at least one task and a load balancer are billed every hour, even with no visitors. Tell the human this before Step 3. Pricing: https://aws.amazon.com/fargate/pricing/ and https://aws.amazon.com/elasticloadbalancing/pricing/.

Set these once per terminal session (ask for values; suggest defaults):

```bash
export APP=web                                   # folder under apps/
export SERVICE=<product>-web                      # letters, digits, dashes
export AWS_REGION=<closest-region>                # e.g. eu-west-1, us-east-1
export ECR_REPO=<product>-web
export HEALTH_PATH=/health                        # /api/health for Next.js
```

## Steps

### Step 0 — Preflight: CLI, login, account, region

```bash
aws --version                                    # need the LATEST AWS CLI v2: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
aws ecs create-express-gateway-service help >/dev/null && echo "Express Mode commands available"
aws configure sso                                 # first time: sign in through IAM Identity Center (recommended)
aws sso login --profile <profile> && export AWS_PROFILE=<profile>
aws sts get-caller-identity                       # shows account ID and who you are
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION
```

- If the `help` check fails, the CLI is too old — update it.
- Express Mode uses the **default VPC** (your account's default private network) and its public subnets. If the last command prints `None`, create one with `aws ec2 create-default-vpc --region $AWS_REGION` (free) or ask your cloud admin.
- Never create access keys for your own user to do this. If your company gives you keys, use them only locally and never commit them.
- **Show the human** the account ID, identity ARN and region, and ask: *"Deploy into this account and region?"* Do not continue without a yes.

### Step 1 — Container runs locally, for the right CPU

Confirm `/deploy` preflight passed. Fargate defaults to `X86_64`, so build for `linux/amd64` (important on Apple Silicon Macs):

```bash
docker build --platform linux/amd64 -t $SERVICE:local apps/$APP
```

### Step 2 — 💰 Budget alert (before anything paid)

A budget **does not stop spending**; it emails you at each threshold. Replace the email:

```bash
aws budgets create-budget --account-id $ACCOUNT_ID \
  --budget '{"BudgetName":"'$SERVICE'-monthly","BudgetLimit":{"Amount":"20","Unit":"USD"},"TimeUnit":"MONTHLY","BudgetType":"COST"}' \
  --notifications-with-subscribers '[
    {"Notification":{"NotificationType":"ACTUAL","ComparisonOperator":"GREATER_THAN","Threshold":50,"ThresholdType":"PERCENTAGE"},"Subscribers":[{"SubscriptionType":"EMAIL","Address":"<you@example.com>"}]},
    {"Notification":{"NotificationType":"ACTUAL","ComparisonOperator":"GREATER_THAN","Threshold":90,"ThresholdType":"PERCENTAGE"},"Subscribers":[{"SubscriptionType":"EMAIL","Address":"<you@example.com>"}]},
    {"Notification":{"NotificationType":"FORECASTED","ComparisonOperator":"GREATER_THAN","Threshold":100,"ThresholdType":"PERCENTAGE"},"Subscribers":[{"SubscriptionType":"EMAIL","Address":"<you@example.com>"}]}]'
```

### Step 3 — 💰 First deploy, by hand

1. **Registry + push** the image:
   ```bash
   aws ecr create-repository --repository-name $ECR_REPO --image-scanning-configuration scanOnPush=true --region $AWS_REGION
   export REGISTRY=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
   aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REGISTRY
   docker tag $SERVICE:local $REGISTRY/$ECR_REPO:v1 && docker push $REGISTRY/$ECR_REPO:v1
   ```
2. **Two IAM roles, once per account** (skip any that `aws iam get-role --role-name <name>` already finds). The *task execution role* lets ECS pull your image and write logs; the *infrastructure role* lets ECS create the load balancer and networking for you:
   ```bash
   aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document \
     '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
   aws iam attach-role-policy --role-name ecsTaskExecutionRole \
     --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
   aws iam create-role --role-name ecsInfrastructureRoleForExpressServices --assume-role-policy-document \
     '{"Version":"2012-10-17","Statement":[{"Sid":"AllowAccessInfrastructureForECSExpressServices","Effect":"Allow","Principal":{"Service":"ecs.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
   aws iam attach-role-policy --role-name ecsInfrastructureRoleForExpressServices \
     --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSInfrastructureRoleforExpressGatewayServices
   ```
   New roles take about a minute to propagate — if the next step says it cannot assume a role, wait and retry.
3. **Container config as a file.** Copy [`references/primary-container.json`](references/primary-container.json) to `deploy/aws/primary-container.json` and fill in the image (`$REGISTRY/$ECR_REPO:v1`) and plain env vars. It holds no secret values — only secret ARNs — so it is committed. Every update sends the **whole** container config, which is why it lives in one file.
4. **Create the service:**
   ```bash
   aws ecs create-express-gateway-service --region $AWS_REGION \
     --service-name $SERVICE \
     --primary-container file://deploy/aws/primary-container.json \
     --execution-role-arn arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole \
     --infrastructure-role-arn arn:aws:iam::$ACCOUNT_ID:role/ecsInfrastructureRoleForExpressServices \
     --health-check-path $HEALTH_PATH \
     --cpu 512 --memory 1024 \
     --scaling-target '{"minTaskCount":1,"maxTaskCount":2}' \
     --monitor-resources
   ```
   `--cpu 512 --memory 1024` = 0.5 vCPU and 1 GiB (CPU units and MiB, per the CLI reference; check `help` if the CLI rejects them). The health check path **must** be set — the default is `/ping`, which your app does not serve. `maxTaskCount` caps cost. Press `q` to leave the live monitor once the status is `ACTIVE`.
5. **URL and check:**
   ```bash
   export SERVICE_ARN=arn:aws:ecs:$AWS_REGION:$ACCOUNT_ID:service/default/$SERVICE
   aws ecs describe-express-gateway-service --service-arn $SERVICE_ARN --region $AWS_REGION \
     --query 'service.activeConfigurations[0].ingressPaths[0].endpoint' --output text
   export URL=https://<endpoint-from-above>
   curl -fsS $URL$HEALTH_PATH
   ```

### Step 4 — Config and secrets

- **Plain config:** add `{"name": "...", "value": "..."}` entries to `environment` in `deploy/aws/primary-container.json`.
- **Secrets** go in **AWS Secrets Manager** (an encrypted store); ECS injects them as env vars at start-up:
  ```bash
  read -rs SECRET_VALUE && aws secretsmanager create-secret --region $AWS_REGION \
    --name $SERVICE/database-url --secret-string "$SECRET_VALUE" --query ARN --output text; unset SECRET_VALUE
  # Let ECS read this service's secrets (and nothing else):
  aws iam put-role-policy --role-name ecsTaskExecutionRole --policy-name $SERVICE-read-secrets --policy-document \
    '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"secretsmanager:GetSecretValue","Resource":"arn:aws:secretsmanager:'$AWS_REGION':'$ACCOUNT_ID':secret:'$SERVICE'/*"}]}'
  ```
  Add `{"name": "DATABASE_URL", "valueFrom": "<secret ARN printed above>"}` to `secrets` in `deploy/aws/primary-container.json`, then apply:
  ```bash
  aws ecs update-express-gateway-service --service-arn $SERVICE_ARN --region $AWS_REGION \
    --primary-container file://deploy/aws/primary-container.json --monitor-resources
  ```

### Step 5 — 💰 Database (optional): Amazon RDS for PostgreSQL

Skip if the app has no database. RDS is billed **every hour it runs**. Tell the human before creating it. The database stays private: only the Express service's security group (a firewall rule set) may reach port 5432.

```bash
VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
SERVICE_SG=$(aws ecs describe-express-gateway-service --service-arn $SERVICE_ARN --region $AWS_REGION \
  --query 'service.activeConfigurations[0].networkConfiguration.securityGroups[0]' --output text)
DB_SG=$(aws ec2 create-security-group --group-name $SERVICE-db --description "Postgres for $SERVICE" \
  --vpc-id $VPC_ID --region $AWS_REGION --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id $DB_SG --protocol tcp --port 5432 --source-group $SERVICE_SG --region $AWS_REGION
read -rs DB_PASSWORD
aws rds create-db-instance --region $AWS_REGION --db-instance-identifier $SERVICE-db \
  --engine postgres --db-instance-class db.t4g.micro --allocated-storage 20 \
  --master-username appadmin --master-user-password "$DB_PASSWORD" --db-name app \
  --vpc-security-group-ids $DB_SG --no-publicly-accessible --backup-retention-period 7
aws rds wait db-instance-available --db-instance-identifier $SERVICE-db --region $AWS_REGION
aws rds describe-db-instances --db-instance-identifier $SERVICE-db --region $AWS_REGION \
  --query 'DBInstances[0].Endpoint.Address' --output text
```

Store `postgresql://appadmin:<DB_PASSWORD>@<endpoint>:5432/app?sslmode=require` as the `$SERVICE/database-url` secret (Step 4). Because the database is private, the simplest migration path for a small app is to run migrations when the container starts (most migration tools take a lock, so two tasks starting together is safe); larger apps run them as a separate CI step. Never use a "push schema" command against production.

### Step 6 — CI/CD with an OIDC role

1. Run the setup script. It prints everything it will create and asks y/N first:
   ```bash
   bash .agents/skills/deploy-aws/references/setup-oidc.sh
   ```
   It registers GitHub as an **OIDC identity provider** in your account (once), and creates a role `github-deploy-$SERVICE` that only this repository's `production` environment can assume, allowed only to push to this ECR repository and update this one Express service.
2. Store the identifiers as GitHub **variables** (not secrets) — the script prints the `gh variable set` commands:
   `AWS_ROLE_ARN`, `AWS_REGION`, `ECR_REPOSITORY`, `ECS_SERVICE_ARN`, `ECS_SERVICE_NAME`, `APP_DIR`, `HEALTH_PATH`.
3. Copy [`references/github-actions-ecs-express.yml`](references/github-actions-ecs-express.yml) to `.github/workflows/deploy-aws.yml` (the guard hook asks before writing CI files — expected). Make sure `deploy/aws/primary-container.json` is committed. Open a PR with `/ship`; the deploy runs when it merges to `main`.

### Step 7 — Verify

```bash
curl -fsS $URL$HEALTH_PATH
aws ecs describe-express-gateway-service --service-arn $SERVICE_ARN --region $AWS_REGION --query 'service.status'
aws logs describe-log-groups --log-group-name-prefix /aws/ecs --region $AWS_REGION --query 'logGroups[].logGroupName'
aws logs tail <log-group-name> --since 15m --region $AWS_REGION
```

If the app has `@smoke` scenarios, run them against the live URL (from `apps/$APP`): `BASE_URL=$URL npx playwright test --grep @smoke`.

### Step 8 — Write the runbook

Copy [`references/runbook-template.md`](references/runbook-template.md) to `docs/deploy/aws.md` and fill in every `<…>`: account, region, service and ARN, URL, ECR repo, roles, secrets (names/ARNs only), database, workflow, and the redeploy, rollback, logs and teardown commands. Commit it with the workflow and `deploy/aws/primary-container.json`.

Rollback: Express Mode uses canary deployments with 5XX rollback alarms, so a release that starts failing is rolled back automatically. To roll back by hand, set `image` in `deploy/aws/primary-container.json` to the last good `:<sha>` tag and run the `update-express-gateway-service` command from Step 4.

## Next.js frontends: Amplify Hosting (optional)

For a Next.js app that does not need a container, **AWS Amplify Hosting** builds and serves it directly from GitHub, including server-side rendering. Console path: Amplify → *Create new app* → GitHub → pick the repo and `main` → for this monorepo set the app root to `apps/web` → review the detected Next.js build settings → add environment variables → *Save and deploy*. Amplify connects through a GitHub App, so no keys are stored in the repo. Check the Next.js versions Amplify currently supports before choosing it, and note it is billed per build minute, data served and SSR request.

## 🗑️ Teardown

Only when the human asks, and only after they type the service name to confirm. List what will be deleted first.

```bash
aws ecs delete-express-gateway-service --service-arn $SERVICE_ARN --region $AWS_REGION --monitor-resources   # removes load balancer, target groups, security groups, scaling
aws rds delete-db-instance --db-instance-identifier $SERVICE-db --final-db-snapshot-identifier $SERVICE-db-final --region $AWS_REGION
aws ec2 delete-security-group --group-id <DB_SG> --region $AWS_REGION       # after the database is gone
aws secretsmanager delete-secret --secret-id $SERVICE/database-url --region $AWS_REGION   # recoverable for 30 days by default
aws ecr delete-repository --repository-name $ECR_REPO --force --region $AWS_REGION        # deletes all images
aws iam delete-role-policy --role-name github-deploy-$SERVICE --policy-name deploy && aws iam delete-role --role-name github-deploy-$SERVICE
aws iam delete-role-policy --role-name ecsTaskExecutionRole --policy-name $SERVICE-read-secrets
aws budgets delete-budget --account-id $ACCOUNT_ID --budget-name $SERVICE-monthly
```

The final snapshot keeps your data (and costs a little storage); delete it later with `aws rds delete-db-snapshot`. Leave the shared `ecsTaskExecutionRole`, `ecsInfrastructureRoleForExpressServices` and the GitHub OIDC provider if other services use them. Disable `.github/workflows/deploy-aws.yml`.

## Gate — before moving on

- [ ] Budget with email alerts exists
- [ ] `curl $URL$HEALTH_PATH` returns 200
- [ ] Secrets are in Secrets Manager; `deploy/aws/primary-container.json` holds ARNs only
- [ ] The deploy workflow assumes a role via OIDC (no `aws-access-key-id` anywhere)
- [ ] `docs/deploy/aws.md` is filled in and committed

## Tell the human

- The live URL, what was created (with a cost note for each — remember the always-on baseline), and where the runbook is.
- In Teaching mode: **What I did** — pushed the image to ECR, created an Express Mode service (Fargate + load balancer), stored secrets in Secrets Manager, and let GitHub deploy through a role it can assume only from this repo. **Why** — no long-lived keys to leak, and every merge deploys the same way. **What to check** — open the URL, then ECS → Express services in the console to see deployments and logs.
- Next: `/next`.
