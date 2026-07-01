FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml ./
COPY display_backend ./display_backend
RUN pip install --no-cache-dir .
VOLUME /data
ENV DISPLAY_DB=/data/display.db
EXPOSE 8000
CMD ["uvicorn", "display_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
