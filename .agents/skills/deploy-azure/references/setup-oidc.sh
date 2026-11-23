#!/usr/bin/env bash
# Shipright — let GitHub Actions deploy to Azure WITHOUT a client secret.
#
# Creates (skipping anything that already exists):
#   1. a user-assigned managed identity     id-<NAME>-github   (in resource group RG)
#   2. a federated credential that trusts   repo:<owner>/<repo>:environment:production
#   3. role assignments:  Contributor on resource group RG, AcrPush on registry ACR
#
# Usage: RG=... NAME=... ACR=... bash setup-oidc.sh
set -euo pipefail

command -v az >/dev/null 2>&1 || { echo "Missing 'az'. Install the Azure CLI first." >&2; exit 1; }

: "${RG:?Set RG (resource group)}"
: "${NAME:?Set NAME (container app name)}"
: "${ACR:?Set ACR (registry name)}"
ENVIRONMENT_NAME="${GH_ENVIRONMENT:-production}"

if [ -z "${GITHUB_REPO:-}" ] && command -v gh >/dev/null 2>&1; then
  GITHUB_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
fi
: "${GITHUB_REPO:?Set GITHUB_REPO as owner/repo (could not detect it with gh)}"

IDENTITY="id-${NAME}-github"
SUBJECT="repo:${GITHUB_REPO}:environment:${ENVIRONMENT_NAME}"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
RG_ID=$(az group show --name "$RG" --query id -o tsv)
ACR_ID=$(az acr show --name "$ACR" --resource-group "$RG" --query id -o tsv)

cat <<PLAN
About to configure, in subscription "${SUBSCRIPTION_NAME}" (${SUBSCRIPTION_ID}):
  - managed identity      ${IDENTITY}  (resource group ${RG})
  - federated credential  github-${ENVIRONMENT_NAME}  trusting  ${SUBJECT}
  - role Contributor      on resource group ${RG}
  - role AcrPush          on registry ${ACR}
A user-assigned identity is free. Nothing is deleted.
PLAN
read -r -p "Proceed? [y/N] " answer
[ "${answer:-N}" = "y" ] || [ "${answer:-N}" = "Y" ] || { echo "Aborted. Nothing changed."; exit 0; }

if ! az identity show --name "$IDENTITY" --resource-group "$RG" >/dev/null 2>&1; then
  az identity create --name "$IDENTITY" --resource-group "$RG" -o none
fi
CLIENT_ID=$(az identity show --name "$IDENTITY" --resource-group "$RG" --query clientId -o tsv)
PRINCIPAL_ID=$(az identity show --name "$IDENTITY" --resource-group "$RG" --query principalId -o tsv)

if ! az identity federated-credential show --name "github-${ENVIRONMENT_NAME}" \
     --identity-name "$IDENTITY" --resource-group "$RG" >/dev/null 2>&1; then
  az identity federated-credential create --name "github-${ENVIRONMENT_NAME}" \
    --identity-name "$IDENTITY" --resource-group "$RG" \
    --issuer "https://token.actions.githubusercontent.com" \
    --subject "$SUBJECT" --audiences "api://AzureADTokenExchange" -o none
fi

assign() { # role scope
  if [ -z "$(az role assignment list --assignee "$PRINCIPAL_ID" --role "$1" --scope "$2" --query '[0].id' -o tsv)" ]; then
    az role assignment create --assignee-object-id "$PRINCIPAL_ID" --assignee-principal-type ServicePrincipal \
      --role "$1" --scope "$2" -o none
  fi
}
assign "Contributor" "$RG_ID"
assign "AcrPush" "$ACR_ID"

cat <<NEXT

Done. Role assignments can take a few minutes to apply.
Store these as GitHub repository variables (identifiers, not secrets):

  gh variable set AZURE_CLIENT_ID        --body "${CLIENT_ID}"
  gh variable set AZURE_TENANT_ID        --body "${TENANT_ID}"
  gh variable set AZURE_SUBSCRIPTION_ID  --body "${SUBSCRIPTION_ID}"
  gh variable set AZURE_RESOURCE_GROUP   --body "${RG}"
  gh variable set AZURE_CONTAINER_APP    --body "${NAME}"
  gh variable set AZURE_ACR_NAME         --body "${ACR}"
  gh variable set APP_DIR                --body "apps/<app>"
  gh variable set HEALTH_PATH            --body "/health"

Then copy .agents/skills/deploy-azure/references/github-actions-container-apps.yml to .github/workflows/deploy-azure.yml.
The workflow job must use `environment: ${ENVIRONMENT_NAME}` to match the federated credential.
NEXT
