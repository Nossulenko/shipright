#!/usr/bin/env bash
# Shipright — set up Workload Identity Federation so GitHub Actions can deploy to
# Cloud Run WITHOUT a service-account key.
#
# Creates (skipping anything that already exists):
#   1. a deployer service account          <SERVICE>-deployer
#   2. a workload identity pool             github
#   3. an OIDC provider for GitHub          restricted to ONE repository and the main branch
#   4. IAM bindings: the repo may act as the deployer; the deployer may deploy Cloud Run,
#      push to ONE Artifact Registry repo, and run services as the runtime service account.
#
# Usage: PROJECT_ID=... REGION=... SERVICE=... AR_REPO=... bash setup-wif.sh
set -euo pipefail

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing '$1'. Install it first." >&2; exit 1; }; }
need gcloud

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${REGION:?Set REGION}"
: "${SERVICE:?Set SERVICE (Cloud Run service name)}"
: "${AR_REPO:?Set AR_REPO (Artifact Registry repository)}"

if [ -z "${GITHUB_REPO:-}" ]; then
  if command -v gh >/dev/null 2>&1; then
    GITHUB_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
  fi
fi
: "${GITHUB_REPO:?Set GITHUB_REPO as owner/repo (could not detect it with gh)}"

POOL=github
PROVIDER=$(printf 'gh-%s' "${GITHUB_REPO#*/}" | tr '[:upper:]_.' '[:lower:]--' | cut -c1-32)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
DEPLOYER_SA="${SERVICE}-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
RUNTIME_SA="${RUNTIME_SA:-${SERVICE}-runtime@${PROJECT_ID}.iam.gserviceaccount.com}"
PRINCIPAL="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${GITHUB_REPO}"

cat <<PLAN
About to configure, in project ${PROJECT_ID} (${PROJECT_NUMBER}):
  - service account   ${DEPLOYER_SA}
  - identity pool     ${POOL}
  - OIDC provider     ${PROVIDER}  (only repo ${GITHUB_REPO}, only refs/heads/main)
  - roles for the deployer:
      roles/run.admin                    on the project
      roles/artifactregistry.writer      on repository ${AR_REPO} (${REGION})
      roles/iam.serviceAccountUser       on ${RUNTIME_SA}
  - roles/iam.workloadIdentityUser on the deployer, for ${GITHUB_REPO}
These are free to create. Nothing is deleted.
PLAN
read -r -p "Proceed? [y/N] " answer
[ "${answer:-N}" = "y" ] || [ "${answer:-N}" = "Y" ] || { echo "Aborted. Nothing changed."; exit 0; }

if ! gcloud iam service-accounts describe "$DEPLOYER_SA" --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SERVICE}-deployer" --project "$PROJECT_ID" --display-name="${SERVICE} GitHub deployer"
fi

if ! gcloud iam workload-identity-pools describe "$POOL" --project "$PROJECT_ID" --location=global >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$POOL" --project "$PROJECT_ID" --location=global \
    --display-name="GitHub Actions"
fi

if ! gcloud iam workload-identity-pools providers describe "$PROVIDER" --project "$PROJECT_ID" \
     --location=global --workload-identity-pool="$POOL" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" --project "$PROJECT_ID" \
    --location=global --workload-identity-pool="$POOL" \
    --display-name="GitHub ${GITHUB_REPO}" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository == '${GITHUB_REPO}' && assertion.ref == 'refs/heads/main'"
fi

# The GitHub repo may impersonate the deployer.
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" --project "$PROJECT_ID" \
  --role=roles/iam.workloadIdentityUser --member="$PRINCIPAL" >/dev/null

# The deployer may deploy Cloud Run services...
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}" --role=roles/run.admin --condition=None >/dev/null
# ...push images to this one repository...
gcloud artifacts repositories add-iam-policy-binding "$AR_REPO" --project "$PROJECT_ID" --location "$REGION" \
  --member="serviceAccount:${DEPLOYER_SA}" --role=roles/artifactregistry.writer >/dev/null
# ...and start services that run as the runtime service account.
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" --project "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}" --role=roles/iam.serviceAccountUser >/dev/null

WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}"
cat <<NEXT

Done. Store these as GitHub repository variables (they are identifiers, not secrets):

  gh variable set GCP_PROJECT_ID     --body "${PROJECT_ID}"
  gh variable set GCP_REGION         --body "${REGION}"
  gh variable set GCP_WIF_PROVIDER   --body "${WIF_PROVIDER}"
  gh variable set GCP_DEPLOYER_SA    --body "${DEPLOYER_SA}"
  gh variable set GCP_RUNTIME_SA     --body "${RUNTIME_SA}"
  gh variable set GCP_AR_REPO        --body "${AR_REPO}"
  gh variable set CLOUD_RUN_SERVICE  --body "${SERVICE}"
  gh variable set APP_DIR            --body "apps/<app>"
  gh variable set HEALTH_PATH        --body "/health"

Then copy .agents/skills/deploy-gcp/references/github-actions-cloud-run.yml to .github/workflows/deploy-gcp.yml.
NEXT
