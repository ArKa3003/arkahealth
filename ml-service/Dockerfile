# ARKA CDS Hooks — ML service container
# Build from repository root:
#   docker build -f ml-service/Dockerfile -t arka-ml .
# Run:
#   docker run -p 8000:8000 arka-ml

FROM python:3.11-slim

WORKDIR /app

COPY ml-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ml-service/ .
COPY lib/cds-platform/ml/feature-catalog.json ./feature-catalog.json
COPY ml-service/MODEL_CARD.md ./MODEL_CARD.md

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
