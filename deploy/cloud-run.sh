#!/usr/bin/env bash
#
# Deploy rhaef_v2 to Cloud Run with a live Vertex/Gemini path, then verify it.
# See docs/deployment-cloud-run.md for the full walkthrough and prerequisites.
#
# Usage:
#   PROJECT_ID=your-project REGION=us-central1 ./deploy/cloud-run.sh
#
set -euo pipefail

PROJECT_ID="${PROJECT_ID:?set PROJECT_ID}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-rhaef-v2}"
SA="${SA:-rhaef-run}"
SA_EMAIL="${SA}@${PROJECT_ID}.iam.gserviceaccount.com"

echo ">> Project: $PROJECT_ID  Region: $REGION  Service: $SERVICE"
gcloud config set project "$PROJECT_ID" >/dev/null

echo ">> Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com

echo ">> Ensuring service account $SA_EMAIL ..."
if ! gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA" --display-name="rhaef-v2 Cloud Run runtime"
fi
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/aiplatform.user" \
  --condition=None >/dev/null

echo ">> Deploying from source (uses repo Dockerfile)..."
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --service-account "$SA_EMAIL" \
  --set-env-vars "VERTEXAI_PROJECT=${PROJECT_ID},VERTEXAI_LOCATION=${REGION}" \
  --allow-unauthenticated

URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
echo ">> Service URL: $URL"

echo ">> Verifying liveness (/health)..."
curl -fsS "$URL/health" && echo

echo ">> Verifying real Gemini call (/healthz/gemini)..."
# Non-2xx (e.g. 503 degraded/error) makes this fail loudly so a broken Vertex path
# does not pass as a successful deploy.
curl -fsS "$URL/healthz/gemini" && echo
echo ">> Done. Expect status=ok and gemini_used=true above."
