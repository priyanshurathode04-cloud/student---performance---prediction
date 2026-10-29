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

The default predictor trains an Extra Trees regression pipeline from `data/student_performance_compact.csv` once per process. The bundled dataset is synthetic demonstration data and is not validated for real student outcomes.

## API routes

- `GET /health` — model readiness.
- `GET /api/dataset-info` — safe dataset/model metadata.
- `POST /api/predict` — score estimate and general study suggestions.
- `POST /api/train` — upload a CSV and train/evaluate a candidate model. Requires `X-Training-Token`.
- `POST /api/train/{candidate_id}/promote` — explicitly promote a candidate. Requires `X-Training-Token` and persistent active-model storage.
- Interactive API docs: `/docs`.

## Secure model training and deployment

Training is disabled unless the backend operator sets `TRAINING_API_TOKEN`. Generate a long random secret (at least 32 random bytes), store it only in the backend deployment's secret environment variables, and enter it only on the Train the Model page. Never place it in a `NEXT_PUBLIC_*` variable, commit it to Git, or share it in chat.

For persistent deployment (for example, a Render web service with a mounted persistent disk), configure:

- `TRAINING_API_TOKEN`: unique random secret used by the training UI.
- `MODEL_CANDIDATE_DIR`: a directory on the mounted persistent disk, for example `/var/data/candidates`.
- `ACTIVE_MODEL_PATH`: the active artifact path on that disk, for example `/var/data/active-model.joblib`.
- `FRONTEND_ORIGINS`: comma-separated allowed frontend origins if using additional production domains.

The disk must be mounted and writable by the service. Do not set `ACTIVE_MODEL_PATH` to a non-persistent filesystem path for production. Candidates are evaluated on a held-out split; promotion is an explicit operator action and should only happen after reviewing metrics and data quality. A service restart can lose candidates unless `MODEL_CANDIDATE_DIR` is persistent. Model artifacts are trusted pickle/joblib files and must only be created by this controlled service.

A dataset must contain these numeric columns: `study_hours_per_day`, `attendance_percent`, `assignment_completion_percent`, `practice_quizzes_per_week`, `class_participation_score`, `previous_score`, `sleep_hours`, and target `final_score` (0–100). Uploads are limited to 12 MiB and 100,000 rows. Avoid student names, IDs, contact details, or sensitive attributes. Upload only data you are authorized to use.

## Frontend connection

In `frontend`, copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the backend URL. Restart Next.js after changing environment variables. Do not put the training token in the frontend environment.

## Tests

From the repository root:

```bash
pip install -r backend/requirements.txt
PYTHONPATH=backend pytest -q backend/tests
```

Predictions are for learning and demonstration only. Do not use them to grade, rank, admit, or make other consequential decisions about students.
