FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -e .
# Cloud Run injects $PORT (defaults to 8080); bind to it so the service is reachable.
ENV PORT=8080
CMD ["sh", "-c", "uvicorn rhaef_v2.core.graph:app --host 0.0.0.0 --port ${PORT:-8080}"]
