#!/usr/bin/env bash
# Shipright — let GitHub Actions deploy to AWS WITHOUT access keys.
#
# Creates (skipping anything that already exists):
#   1. the GitHub OIDC identity provider     token.actions.githubusercontent.com (once per account)
#   2. an IAM role                           github-deploy-<SERVICE>
#        trust:  only repo:<owner>/<repo>:environment:production, audience sts.amazonaws.com
#        allow:  push to ONE ECR repository, update/describe ONE Express service,
#                pass the ECS task execution role to ECS
#
# Usage: SERVICE=... ECR_REPO=... AWS_REGION=... bash setup-oidc.sh
set -euo pipefail

command -v aws >/dev/null 2>&1 || { echo "Missing 'aws'. Install AWS CLI v2 first." >&2; exit 1; }

: "${SERVICE:?Set SERVICE (Express service name)}"
: "${ECR_REPO:?Set ECR_REPO (ECR repository name)}"
: "${AWS_REGION:?Set AWS_REGION}"
ENVIRONMENT_NAME="${GH_ENVIRONMENT:-production}"

if [ -z "${GITHUB_REPO:-}" ] && command -v gh >/dev/null 2>&1; then
  GITHUB_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
fi
: "${GITHUB_REPO:?Set GITHUB_REPO as owner/repo (could not detect it with gh)}"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
ROLE_NAME="github-deploy-${SERVICE}"
SUBJECT="repo:${GITHUB_REPO}:environment:${ENVIRONMENT_NAME}"
SERVICE_ARN="arn:aws:ecs:${AWS_REGION}:${ACCOUNT_ID}:service/default/${SERVICE}"
ECR_ARN="arn:aws:ecr:${AWS_REGION}:${ACCOUNT_ID}:repository/${ECR_REPO}"
EXEC_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole"
INFRA_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/ecsInfrastructureRoleForExpressServices"

cat <<PLAN
About to configure, in AWS account ${ACCOUNT_ID} (${AWS_REGION}):
  - OIDC provider   token.actions.githubusercontent.com   (skipped if it exists)
  - IAM role        ${ROLE_NAME}
      trusted only by  ${SUBJECT}
      may push to      ${ECR_ARN}
      may update       ${SERVICE_ARN}
      may pass         ${EXEC_ROLE_ARN} to ECS
IAM roles and OIDC providers are free. Nothing is deleted.
PLAN
read -r -p "Proceed? [y/N] " answer
[ "${answer:-N}" = "y" ] || [ "${answer:-N}" = "Y" ] || { echo "Aborted. Nothing changed."; exit 0; }

if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$PROVIDER_ARN" >/dev/null 2>&1; then
  # The certificate thumbprint is no longer required by AWS for GitHub's provider.
  aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com >/dev/null
fi

TRUST=$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "${PROVIDER_ARN}" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "${SUBJECT}"
      }
    }
  }]
}
JSON
)

PERMISSIONS=$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "EcrLogin", "Effect": "Allow", "Action": "ecr:GetAuthorizationToken", "Resource": "*" },
    { "Sid": "EcrPush", "Effect": "Allow",
      "Action": ["ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart",
                 "ecr:CompleteLayerUpload", "ecr:PutImage", "ecr:BatchGetImage"],
      "Resource": "${ECR_ARN}" },
    { "Sid": "ExpressDeploy", "Effect": "Allow",
      "Action": ["ecs:UpdateExpressGatewayService", "ecs:DescribeExpressGatewayService", "ecs:DescribeServices"],
      "Resource": "${SERVICE_ARN}" },
    { "Sid": "RegisterRevision", "Effect": "Allow", "Action": "ecs:RegisterTaskDefinition", "Resource": "*" },
    { "Sid": "PassExecutionRole", "Effect": "Allow", "Action": "iam:PassRole",
      "Resource": "${EXEC_ROLE_ARN}",
      "Condition": { "StringEquals": { "iam:PassedToService": "ecs-tasks.amazonaws.com" } } },
    { "Sid": "PassInfrastructureRole", "Effect": "Allow", "Action": "iam:PassRole",
      "Resource": "${INFRA_ROLE_ARN}",
      "Condition": { "StringEquals": { "iam:PassedToService": "ecs.amazonaws.com" } } }
  ]
}
JSON
)

if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  aws iam update-assume-role-policy --role-name "$ROLE_NAME" --policy-document "$TRUST"
else
  aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document "$TRUST" \
    --description "GitHub Actions deploy for ${SERVICE} (${GITHUB_REPO})" >/dev/null
fi
aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name deploy --policy-document "$PERMISSIONS"

cat <<NEXT

Done. If a deploy fails with AccessDenied, the error names the missing action — add only that action.
Store these as GitHub repository variables (identifiers, not secrets):

  gh variable set AWS_ROLE_ARN      --body "arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
  gh variable set AWS_REGION        --body "${AWS_REGION}"
  gh variable set ECR_REPOSITORY    --body "${ECR_REPO}"
  gh variable set ECS_SERVICE_ARN   --body "${SERVICE_ARN}"
  gh variable set ECS_SERVICE_NAME  --body "${SERVICE}"
  gh variable set APP_DIR           --body "apps/<app>"
  gh variable set HEALTH_PATH       --body "/health"

Then copy .agents/skills/deploy-aws/references/github-actions-ecs-express.yml to .github/workflows/deploy-aws.yml.
The workflow job must use \`environment: ${ENVIRONMENT_NAME}\` to match the trust policy.
NEXT
