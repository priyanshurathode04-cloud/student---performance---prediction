from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "student_performance_compact.csv"
TARGET = "final_score"
FEATURES = [
    "study_hours_per_day",
    "attendance_percent",
    "assignment_completion_percent",
    "practice_quizzes_per_week",
    "class_participation_score",
    "previous_score",
    "sleep_hours",
]


def _build_pipeline(frame: pd.DataFrame) -> Pipeline:
    numeric = frame.select_dtypes(include=["number", "bool"]).columns.tolist()
    categorical = [column for column in frame.columns if column not in numeric]
    transformers = []
    if numeric:
        transformers.append(("numeric", Pipeline([("imputer", SimpleImputer(strategy="median"))]), numeric))
    if categorical:
        transformers.append((
            "categorical",
            Pipeline([
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("onehot", OneHotEncoder(handle_unknown="ignore")),
            ]),
            categorical,
        ))
    return Pipeline([
        ("preprocess", ColumnTransformer(transformers=transformers, remainder="drop")),
        ("model", ExtraTreesRegressor(n_estimators=180, random_state=42, min_samples_leaf=2, n_jobs=-1)),
    ])


@lru_cache(maxsize=1)
def get_model_bundle() -> dict:
    if not DATA_PATH.is_file():
        raise FileNotFoundError(
            f"Training dataset not found at {DATA_PATH}. Ensure the repository data folder is included."
        )
    data = pd.read_csv(DATA_PATH)
    missing = [column for column in FEATURES + [TARGET] if column not in data.columns]
    if missing:
        raise ValueError(f"Training dataset is missing required columns: {', '.join(missing)}")

    data = data[FEATURES + [TARGET]].copy()
    data[TARGET] = pd.to_numeric(data[TARGET], errors="coerce")
    data = data.dropna(subset=[TARGET])
    if len(data) < 20:
        raise ValueError("At least 20 labelled rows are required for the demo model.")

    X = data[FEATURES]
    y = data[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    evaluation_model = _build_pipeline(X_train)
    evaluation_model.fit(X_train, y_train)
    predictions = evaluation_model.predict(X_test)
    metrics = {
        "mae": round(float(mean_absolute_error(y_test, predictions)), 3),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, predictions))), 3),
        "r2": round(float(r2_score(y_test, predictions)), 3) if len(y_test) > 1 else None,
        "test_rows": int(len(y_test)),
        "training_rows": int(len(X_train)),
    }

    model = _build_pipeline(X)
    model.fit(X, y)
    importance = model.named_steps["model"].feature_importances_
    feature_importance = [
        {"feature": name, "importance": round(float(value), 4)}
        for name, value in sorted(zip(FEATURES, importance), key=lambda item: item[1], reverse=True)
    ]
    return {
        "model": model,
        "metrics": metrics,
        "feature_importance": feature_importance,
        "rows": int(len(data)),
        "features": FEATURES,
        "dataset": DATA_PATH.name,
    }


def predict_score(features: dict) -> dict:
    bundle = get_model_bundle()
    frame = pd.DataFrame([{key: features[key] for key in FEATURES}])
    score = float(bundle["model"].predict(frame)[0])
    return {
        "predicted_score": round(float(np.clip(score, 0, 100)), 1),
        "metrics": bundle["metrics"],
        "feature_importance": bundle["feature_importance"],
        "training_rows": bundle["rows"],
        "dataset": bundle["dataset"],
    }
