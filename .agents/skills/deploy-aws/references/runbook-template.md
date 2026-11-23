# Runbook — AWS (ECS Express Mode)

> Written by `/deploy-aws`. Keep it true: update it in the same PR as any infrastructure change.
> Never put secret **values** here — names and ARNs only.

| | |
| --- | --- |
| Live URL | `<https://ENDPOINT.ecs.REGION.on.aws>` |
| Custom domain | `<none / app.example.com>` |
| Account | `<ACCOUNT_ID>` (profile `<AWS_PROFILE>`) |
| Budget | `<SERVICE>-monthly` at `<20 USD>` — alerts at 50 / 90 % actual, 100 % forecast |
| Region | `<AWS_REGION>` |
| App folder | `apps/<APP>` |
| Health path | `</health>` |
| Last updated | `<YYYY-MM-DD>` by `<name>` |

## Resources

| Resource | Name / ARN | Notes / cost |
| --- | --- | --- |
| Express service | `<SERVICE>` — `arn:aws:ecs:<REGION>:<ACCOUNT_ID>:service/default/<SERVICE>` | min 1 / max `<2>` tasks, 0.5 vCPU / 1 GiB — **always on** |
| Load balancer, target group, security groups | managed by Express Mode | ALB billed hourly |
| ECR repository | `<ECR_REPO>` | image storage, scan on push |
| Task execution role | `ecsTaskExecutionRole` (+ inline `<SERVICE>-read-secrets`) | shared per account |
| Infrastructure role | `ecsInfrastructureRoleForExpressServices` | shared per account |
| GitHub deploy role | `github-deploy-<SERVICE>` | trusted only by `repo:<owner>/<repo>:environment:production` |
| Secrets Manager | `<SERVICE>/database-url`, `<…>` | billed per secret per month |
| RDS PostgreSQL (optional) | `<SERVICE>-db` (`db.t4g.micro`), SG `<DB_SG>` | billed hourly, private |
| Container config | `deploy/aws/primary-container.json` | committed; image, port, env, secret ARNs |

## Configuration

| Env var | Source | Example / secret |
| --- | --- | --- |
| `PORT` | `environment` | `8080` |
| `NODE_ENV` | `environment` | `production` |
| `DATABASE_URL` | `secrets` | `<SERVICE>/database-url` |
| `<…>` | | |

## Redeploy

- **Normal path:** merge to `main` → `.github/workflows/deploy-aws.yml` builds, pushes and updates the service.
- **By hand (emergency):**
  ```bash
  docker build --platform linux/amd64 -t <REGISTRY>/<ECR_REPO>:<tag> apps/<APP> && docker push <REGISTRY>/<ECR_REPO>:<tag>
  # set "image" in deploy/aws/primary-container.json to that tag, then:
  aws ecs update-express-gateway-service --service-arn <SERVICE_ARN> \
    --primary-container file://deploy/aws/primary-container.json --monitor-resources
  ```

## Rollback

- Automatic: Express Mode canary deployments roll back on 5XX alarms.
- Manual: set `image` in `deploy/aws/primary-container.json` to the last good `:<sha>` and run the update command above.
  List tags: `aws ecr describe-images --repository-name <ECR_REPO> --query 'sort_by(imageDetails,&imagePushedAt)[-10:].imageTags'`

Then revert the bad commit on `main` so the next deploy does not bring it back.

## Logs and health

```bash
curl -fsS <URL></health>
aws ecs describe-express-gateway-service --service-arn <SERVICE_ARN> --query 'service.status'
aws ecs monitor-express-gateway-service --service-arn <SERVICE_ARN>
aws logs tail <LOG_GROUP> --since 30m --follow
```

## Secrets rotation

```bash
read -rs V && aws secretsmanager put-secret-value --secret-id <SERVICE>/database-url --secret-string "$V"; unset V
aws ecs update-express-gateway-service --service-arn <SERVICE_ARN> \
  --primary-container file://deploy/aws/primary-container.json     # new tasks read the new value
```

## Database

- Endpoint: `<SERVICE>-db.<id>.<REGION>.rds.amazonaws.com:5432`, database `app`, TLS required, not publicly accessible
- Migrations: `<run on container start / CI step>`
- Snapshots: `aws rds describe-db-snapshots --db-instance-identifier <SERVICE>-db`

## Teardown (destructive — confirm first)

```bash
aws ecs delete-express-gateway-service --service-arn <SERVICE_ARN> --monitor-resources
aws rds delete-db-instance --db-instance-identifier <SERVICE>-db --final-db-snapshot-identifier <SERVICE>-db-final
aws ec2 delete-security-group --group-id <DB_SG>
aws secretsmanager delete-secret --secret-id <SERVICE>/database-url
aws ecr delete-repository --repository-name <ECR_REPO> --force
aws iam delete-role-policy --role-name github-deploy-<SERVICE> --policy-name deploy
aws iam delete-role --role-name github-deploy-<SERVICE>
aws iam delete-role-policy --role-name ecsTaskExecutionRole --policy-name <SERVICE>-read-secrets
aws budgets delete-budget --account-id <ACCOUNT_ID> --budget-name <SERVICE>-monthly
```

Disable `.github/workflows/deploy-aws.yml` afterwards.
