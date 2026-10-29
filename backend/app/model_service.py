"""Model service for the compact student-performance demo dataset.

This intentionally trains once per backend process from the repository's compact CSV.
The source data is synthetic/demo data, so outputs must not be used for real academic
decisions. The estimator and preprocessing mirror the Streamlit app's Extra Trees
regression option.
"""
from functools import lru_cache
import json
import os
from pathlib import Path

import joblib

import pandas as pd
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

FEATURE_COLUMNS = [
    "study_hours_per_day",
    "attendance_percent",
    "assignment_completion_percent",
    "practice_quizzes_per_week",
    "class_participation_score",
    "previous_score",
    "sleep_hours",
]
TARGET_COLUMN = "final_score"
MODEL_NAME = "Extra Trees Regressor"
DATASET_DESCRIPTION = "Compact synthetic study-habits dataset (100 students, 8 columns)"
DISCLAIMER = (
    "This estimate comes from a small synthetic demonstration dataset, not validated "
    "real-world student records. It is for learning and demonstration only and must "
    "not be used to grade, rank, admit, or make other consequential decisions about students."
)




def get_model_metadata() -> dict[str, str]:
    """Return truthful metadata for the currently active predictor."""
    active_path = os.getenv("ACTIVE_MODEL_PATH", "").strip()
    if active_path and Path(active_path).is_file():
        metadata_path = Path(active_path).with_suffix(".metadata.json")
        if metadata_path.is_file():
            try:
                metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
                dataset = str(metadata.get("dataset", "Uploaded training dataset"))
                model_name = str(metadata.get("model_name", MODEL_NAME))
                return {
                    "model_name": model_name,
                    "dataset": dataset,
                    "disclaimer": (
                        "This model was trained on an uploaded dataset and has not been independently "
                        "validated for real-world student outcomes, representativeness, or fairness. "
                        "Use for learning and demonstration only; never for grading, ranking, admissions, "
                        "or other consequential decisions."
                    ),
                }
            except (OSError, ValueError, TypeError):
                pass
    return {"model_name": MODEL_NAME, "dataset": DATASET_DESCRIPTION, "disclaimer": DISCLAIMER}

@lru_cache(maxsize=1)
def _load_trained_model():
    """Load an explicitly promoted model, or fit the bundled demo model."""
    active_path = os.getenv("ACTIVE_MODEL_PATH", "").strip()
    if active_path and Path(active_path).is_file():
        return joblib.load(active_path)

    csv_path = Path(__file__).resolve().parents[2] / "data" / "student_performance_compact.csv"
    if not csv_path.is_file():
        raise FileNotFoundError(f"Required demo dataset was not found: {csv_path}")

    data = pd.read_csv(csv_path)
    required = set(FEATURE_COLUMNS + [TARGET_COLUMN])
    missing_columns = required.difference(data.columns)
    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {sorted(missing_columns)}")

    data = data[FEATURE_COLUMNS + [TARGET_COLUMN]].copy()
    data[TARGET_COLUMN] = pd.to_numeric(data[TARGET_COLUMN], errors="coerce")
    data = data.dropna(subset=[TARGET_COLUMN])
    if len(data) < 10:
        raise ValueError("At least 10 rows with a known final_score are required.")

    X = data[FEATURE_COLUMNS].apply(pd.to_numeric, errors="coerce")
    y = data[TARGET_COLUMN]
    pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            (
                "model",
                ExtraTreesRegressor(
                    n_estimators=180,
                    random_state=42,
                    min_samples_leaf=2,
                    n_jobs=-1,
                ),
            ),
        ]
    )
    pipeline.fit(X, y)
    return pipeline


def model_is_ready() -> bool:
    try:
        _load_trained_model()
        return True
    except (FileNotFoundError, ValueError, OSError):
        return False


def predict_score(features: dict[str, int | float]) -> float:
    model = _load_trained_model()
    row = pd.DataFrame([{name: features[name] for name in FEATURE_COLUMNS}], columns=FEATURE_COLUMNS)
    score = float(model.predict(row)[0])
    if not pd.notna(score):
        raise ValueError("The model returned a non-finite prediction.")
    return round(score, 2)


def get_improvement_guidance(features: dict[str, int | float]) -> list[str]:
    """Offer general habit suggestions based on entered values, not causal claims."""
    tips: list[str] = []
    if features["study_hours_per_day"] < 2:
        tips.append("Try a consistent 20–30 minute focused study session on most days.")
    elif features["study_hours_per_day"] < 4:
        tips.append("Make study sessions active with practice questions and spaced revision.")
    if features["attendance_percent"] < 85:
        tips.append("If possible, attend classes regularly and plan how to catch up on missed topics.")
    if features["assignment_completion_percent"] < 80:
        tips.append("Break unfinished assignments into smaller tasks and set mini-deadlines.")
    if features["practice_quizzes_per_week"] < 3:
        tips.append("Try one or two short practice quizzes each week and review incorrect answers.")
    if features["class_participation_score"] < 6:
        tips.append("Prepare one question before class or ask for clarification on a difficult topic.")
    if features["previous_score"] < 60:
        tips.append("Review earlier mistakes and practise the topics where marks were lost.")
    if features["sleep_hours"] < 7:
        tips.append("Where practical, maintain a consistent sleep routine and get sufficient rest.")
    if not tips:
        tips.append("Choose one realistic learning habit to practise for a few weeks and track how it goes.")
    return tips[:5]
