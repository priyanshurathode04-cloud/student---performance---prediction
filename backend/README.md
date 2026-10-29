# Student Performance Prediction API

FastAPI service for the Next.js redesign.

## Local development

From the repository root:

```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --reload --app-dir backend --host 0.0.0.0 --port 8000
```

The API loads `data/student_performance_compact.csv` and trains an Extra Trees regression pipeline once per process. Median imputation is used for missing input features. The model is intentionally a demonstration model trained on a small synthetic dataset; it is not validated for real student outcomes.

- Health check: `GET http://localhost:8000/health`
- Prediction: `POST http://localhost:8000/api/predict`
- Interactive API docs: `http://localhost:8000/docs`

## Frontend connection

In `frontend`, copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the URL where the API is running. Restart the Next.js development server after changing environment variables.

Set `FRONTEND_ORIGIN` on the backend to the frontend's exact origin for cross-origin requests. Do not use `*` with credentials enabled.

## Tests

From the repository root:

```bash
pip install -r backend/requirements.txt
PYTHONPATH=backend pytest -q backend/tests
``

Predictions are for learning and demonstration only and must not be used to grade, rank, admit, or make other consequential decisions about students.
