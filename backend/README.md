# FastAPI backend scaffold

This is the initial API boundary for the Next.js redesign. It intentionally does not produce predictions until the current Streamlit preprocessing and model pipeline has been extracted and tested.

## Run locally
```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- Health check: http://127.0.0.1:8000/health
- API docs: http://127.0.0.1:8000/docs

## Safety
- `/api/predict` currently returns HTTP 503 instead of inventing a score.
- CORS defaults to the local Next.js origin. Set `FRONTEND_ORIGIN` to the exact deployed frontend origin before deployment.
- Do not place Supabase service-role keys or other secrets in frontend variables.
- Do not deploy until the real model is integrated and automated tests pass.
