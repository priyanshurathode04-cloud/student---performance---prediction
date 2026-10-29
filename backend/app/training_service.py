"""CSV model training and candidate artifact management for the demo API.

Training never replaces the active predictor automatically. Promotion is available only
when ACTIVE_MODEL_PATH points to a durable path configured by the deployment operator.
"""
from __future__ import annotations

import json
import os
import re
import uuid
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from .model_service import FEATURE_COLUMNS, TARGET_COLUMN

MAX_ROWS = 100_000
MIN_ROWS = 20
MAX_COLUMNS = 50
MAX_SCORE = 100.0
CANDIDATE_DIR = Path(os.getenv("MODEL_CANDIDATE_DIR", "/tmp/student-performance-candidates"))


class DatasetValidationError(ValueError):
    pass


def train_candidate(csv_bytes: bytes) -> dict:
    if not csv_bytes:
        raise DatasetValidationError("The uploaded CSV is empty.")
    try:
        from io import BytesIO
        frame = pd.read_csv(BytesIO(csv_bytes))
    except Exception as exc:
        raise DatasetValidationError("Could not read this file as a valid CSV.") from exc

    if frame.empty:
        raise DatasetValidationError("The CSV has no data rows.")
    if len(frame) > MAX_ROWS:
        raise DatasetValidationError(f"Use at most {MAX_ROWS:,} rows per training run.")
    if len(frame.columns) > MAX_COLUMNS:
        raise DatasetValidationError(f"Use at most {MAX_COLUMNS} columns.")
    required = FEATURE_COLUMNS + [TARGET_COLUMN]
    missing = [column for column in required if column not in frame.columns]
    if missing:
        raise DatasetValidationError("Missing required columns: " + ", ".join(missing))
    if len(frame) < MIN_ROWS:
        raise DatasetValidationError(f"At least {MIN_ROWS} rows are required before the train/test split.")

    selected = frame[required].copy()
    for column in required:
        selected[column] = pd.to_numeric(selected[column], errors="coerce")
    selected[TARGET_COLUMN] = selected[TARGET_COLUMN].where(selected[TARGET_COLUMN].between(0, MAX_SCORE))
    selected = selected.dropna(subset=[TARGET_COLUMN])
    if len(selected) < MIN_ROWS:
        raise DatasetValidationError(f"At least {MIN_ROWS} rows with numeric final_score values between 0 and 100 are required.")

    bounds = {
        "study_hours_per_day": (0, 24),
        "attendance_percent": (0, 100),
        "assignment_completion_percent": (0, 100),
        "practice_quizzes_per_week": (0, 100),
        "class_participation_score": (0, 10),
        "previous_score": (0, 100),
        "sleep_hours": (0, 24),
    }
    for column, (low, high) in bounds.items():
        invalid = selected[column].notna() & ~selected[column].between(low, high)
        if invalid.any():
            raise DatasetValidationError(f"{column} contains values outside {low}–{high}.")
    if selected[TARGET_COLUMN].nunique() < 2:
        raise DatasetValidationError("final_score must contain at least two distinct values.")

    empty_features = [column for column in FEATURE_COLUMNS if selected[column].notna().sum() == 0]
    if empty_features:
        raise DatasetValidationError("These required feature columns contain no usable numeric values: " + ", ".join(empty_features))

    X = selected[FEATURE_COLUMNS]
    y = selected[TARGET_COLUMN].astype(float)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    model = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("model", ExtraTreesRegressor(
            n_estimators=180, random_state=42, min_samples_leaf=2, n_jobs=-1
        )),
    ])
    model.fit(X_train, y_train)
    predicted = np.clip(model.predict(X_test), 0, 100)
    rmse = float(np.sqrt(mean_squared_error(y_test, predicted)))
    candidate_id = uuid.uuid4().hex
    CANDIDATE_DIR.mkdir(parents=True, exist_ok=True)
    candidate_path = CANDIDATE_DIR / f"{candidate_id}.joblib"
    joblib.dump(model, candidate_path)
    candidate_metadata = {
        "model_name": "Extra Trees Regressor",
        "dataset": f"Uploaded training dataset ({len(selected)} rows)",
        "training_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "metrics": {
            "mae": round(float(mean_absolute_error(y_test, predicted)), 3),
            "rmse": round(rmse, 3),
            "r2": round(float(r2_score(y_test, predicted)), 3) if len(y_test) >= 2 else None,
        },
    }
    metadata_path = CANDIDATE_DIR / f"{candidate_id}.json"
    metadata_path.write_text(json.dumps(candidate_metadata), encoding="utf-8")
    importances = model.named_steps["model"].feature_importances_
    return {
        "candidate_id": candidate_id,
        "rows_used": int(len(selected)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "metrics": {
            "mae": round(float(mean_absolute_error(y_test, predicted)), 3),
            "rmse": round(rmse, 3),
            "r2": round(float(r2_score(y_test, predicted)), 3) if len(y_test) >= 2 else None,
        },
        "feature_importance": [
            {"feature": name, "importance": round(float(score), 5)}
            for name, score in sorted(zip(FEATURE_COLUMNS, importances), key=lambda item: item[1], reverse=True)
        ],
        "status": "candidate",
        "message": "Candidate trained and evaluated on a held-out split. It has not replaced the active prediction model.",
    }


def promote_candidate(candidate_id: str) -> str:
    if not re.fullmatch(r"[a-f0-9]{32}", candidate_id):
        raise DatasetValidationError("Invalid candidate ID.")
    active_path_value = os.getenv("ACTIVE_MODEL_PATH", "").strip()
    if not active_path_value:
        raise RuntimeError("Set ACTIVE_MODEL_PATH to a durable persistent-disk file before promoting models.")
    candidate_path = CANDIDATE_DIR / f"{candidate_id}.joblib"
    if not candidate_path.is_file():
        raise FileNotFoundError("Candidate not found. Training candidates may be lost when the service restarts.")
    candidate_metadata_path = CANDIDATE_DIR / f"{candidate_id}.json"
    if not candidate_metadata_path.is_file():
        raise FileNotFoundError("Candidate metadata not found; retrain the candidate before promoting it.")
    candidate_metadata = json.loads(candidate_metadata_path.read_text(encoding="utf-8"))
    active_path = Path(active_path_value)
    active_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = active_path.with_suffix(active_path.suffix + ".tmp")
    joblib.dump(joblib.load(candidate_path), temporary_path)
    temporary_path.replace(active_path)
    metadata_path = active_path.with_suffix(".metadata.json")
    temporary_metadata_path = metadata_path.with_suffix(metadata_path.suffix + ".tmp")
    temporary_metadata_path.write_text(json.dumps(candidate_metadata), encoding="utf-8")
    temporary_metadata_path.replace(metadata_path)
    return str(active_path)
