# Deploy `rhaef_v2` to Cloud Run with a live Vertex/Gemini call

This wires the deployed FastAPI app so that a real request triggers a real
Gemini API call through **Vertex AI** — which satisfies **both** Build with Gemini
XPRIZE entry requirements at once:

- "Projects that include LLM functionality must use the Gemini API for at least one
  LLM call **in the deployed application**" — covered by the live Vertex/Gemini call.
- "A Project must use at least one product from Google Cloud" — covered by **Cloud
  Run** (hosting) **and Vertex AI** (inference).

> MongoDB Atlas is *not* a Google Cloud product and does not satisfy the second
> requirement on its own — Cloud Run + Vertex AI do.

The app exposes `GET /healthz/gemini`, which performs exactly one Gemini call and
reports whether Gemini actually answered (see "Verify" below).

---

## 0. Prerequisites

```bash
gcloud auth login
gcloud config set project "$PROJECT_ID"

# Enable the APIs the deploy + inference path needs.
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

Pick a region where `gemini-2.5-flash` is served and run Cloud Run in the **same**
region to avoid cross-region latency/quota (e.g. `us-central1`).

## 1. Service account with Vertex access (auth = ADC, no API key)

The `vertex_ai/` route authenticates via **Application Default Credentials** of the
Cloud Run service account — there is no `GEMINI_API_KEY` to set, and none should be
baked into the image.

```bash
export PROJECT_ID="your-project"
export REGION="us-central1"
export SA="rhaef-run"

gcloud iam service-accounts create "$SA" \
  --display-name="rhaef-v2 Cloud Run runtime"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

## 2. Build & deploy

`gcloud run deploy --source .` uses the repo `Dockerfile` (Cloud Build builds it,
pushes to Artifact Registry, then deploys). The `Dockerfile` binds uvicorn to
`$PORT`, which Cloud Run injects.

```bash
gcloud run deploy rhaef-v2 \
  --source . \
  --region "$REGION" \
  --service-account "${SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars "VERTEXAI_PROJECT=${PROJECT_ID},VERTEXAI_LOCATION=${REGION}" \
  --allow-unauthenticated
```

Notes:
- `VERTEXAI_PROJECT` / `VERTEXAI_LOCATION` are forwarded by `ModelRouter` into every
  `vertex_ai/` call (`_enrich_for_vertex`).
- Drop `--allow-unauthenticated` once you front the service with auth; for the
  XPRIZE demo a public URL is fine.
- To pin a different Gemini model without code changes, add
  `RHAEF_GEMINI_MODEL=vertex_ai/gemini-2.5-pro` to `--set-env-vars`.

## 3. Verify the deployed Gemini path

```bash
URL="$(gcloud run services describe rhaef-v2 --region "$REGION" --format='value(status.url)')"

curl -s "$URL/health"            # {"status":"ok"}  — app is up
curl -s "$URL/healthz/gemini"    # the real proof
```

Expected healthy response (HTTP 200):

```json
{
  "status": "ok",
  "requested_model": "vertex_ai/gemini-2.5-flash",
  "answered_model": "vertex_ai/gemini-2.5-flash",
  "gemini_used": true,
  "reply": "pong"
}
```

If you instead get HTTP **503** with `"status":"degraded"` and
`"gemini_used": false`, the call **silently fell back off Gemini** onto the
non-Gemini fallback model — the XPRIZE requirement is **not** met. Almost always
this is one of:

- service account missing `roles/aiplatform.user`,
- `VERTEXAI_LOCATION` set to a region that does not serve the model,
- `aiplatform.googleapis.com` not enabled.

HTTP **503** with `"status":"error"` includes the exception class + detail to
diagnose (e.g. auth, quota, model-not-found).

## 4. One-shot script

`deploy/cloud-run.sh` runs steps 1–3 end to end. Set `PROJECT_ID` (and optionally
`REGION`, `SERVICE`, `SA`) first:

```bash
PROJECT_ID=your-project REGION=us-central1 ./deploy/cloud-run.sh
```
