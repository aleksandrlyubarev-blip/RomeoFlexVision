FROM python:3.12-slim
WORKDIR /app
COPY . .
# roboqc_data is required at runtime: rhaef_v2.agents.roboqc imports
# roboqc_data.prompts when the RoboQC graph executes.
RUN pip install -e . -e ./roboqc_data
CMD ["uvicorn", "rhaef_v2.core.graph:app", "--host", "0.0.0.0", "--port", "8000"]
