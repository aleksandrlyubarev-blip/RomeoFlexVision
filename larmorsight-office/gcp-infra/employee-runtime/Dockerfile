# Минимальный плейсхолдер образа AI-сотрудника LarmorSight для Cloud Run.
#
# Это СКЕЛЕТ: замените server.py на реальный рантайм (загрузка SKILL.md из Cloud
# Storage, вызовы Anthropic API, осмысленные HTTP-эндпоинты). Cloud Run шлёт
# трафик на порт из переменной окружения PORT (по умолчанию 8080).
#
# Сборка и пуш (пример через Cloud Build → Artifact Registry):
#   gcloud artifacts repositories create larmorsight \
#     --repository-format=docker --location=us-central1
#   gcloud builds submit \
#     --tag us-central1-docker.pkg.dev/PROJECT_ID/larmorsight/larmorsight-employee:latest .
# Затем укажите этот образ как employee_image в ../terraform.tfvars.

FROM python:3.11-slim

WORKDIR /app
COPY server.py .

# TODO: добавьте зависимости реального рантайма, например:
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt   # anthropic, google-cloud-storage, ...

ENV PORT=8080
EXPOSE 8080
CMD ["python", "/app/server.py"]
