# EnduranceBloc Translator Service (FastAPI)

A minimal FastAPI service exposing `/translate` to convert raw workout payloads into the canonical schema. Initially mocked; swap logic with a PyTorch model later.

## Setup
```powershell
# from repo root
python -m venv .venv
& .venv/Scripts/Activate.ps1
pip install -r services/translator_service/requirements.txt
```

## Run
```powershell
python services/translator_service/app/main.py
# or
uvicorn services.translator_service.app.main:app --reload --host 0.0.0.0 --port 8000
```

## API
- GET `/health` -> `{ status: "ok" }`
- POST `/translate` -> Canonical workout JSON

Request body formats:
```json
{ "source": "trainingpeaks", "payload": { "title": "Easy run", "duration": 60, "distance": 10.2 } }
```
