FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -e .
CMD ["uvicorn", "rhaef_v2.core.graph:app", "--host", "0.0.0.0", "--port", "8000"]
