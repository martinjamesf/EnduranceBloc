# Translator service container (avoids local Rust build issues for pydantic-core)
FROM python:3.12-slim

WORKDIR /app/services/translator_service

# Install runtime deps
COPY services/translator_service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY services/translator_service/app ./app

# Copy calibration artifacts (optional but recommended)
COPY services/training/artifacts /app/services/training/artifacts

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
