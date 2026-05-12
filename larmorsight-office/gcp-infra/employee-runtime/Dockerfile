# Образ рантайма AI-сотрудника LarmorSight для Cloud Run.
#
# app.py на старте подтягивает навык сотрудника из Cloud Storage и поднимает
# FastAPI с эндпоинтами GET /healthz и POST /run (вызов Anthropic Messages API
# c prompt caching). Cloud Run шлёт трафик на порт из переменной окружения PORT.
#
# Сборка и пуш (пример, из larmorsight-office/gcp-infra/employee-runtime):
#   gcloud artifacts repositories create larmorsight \
#     --repository-format=docker --location=us-central1
#   gcloud builds submit \
#     --tag us-central1-docker.pkg.dev/PROJECT_ID/larmorsight/larmorsight-employee:latest .
# Затем укажите этот образ как employee_image в ../terraform.tfvars.
# Либо используйте ../cloudbuild.yaml: gcloud builds submit --config ../cloudbuild.yaml ..

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
