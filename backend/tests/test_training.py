import numpy as np
import pandas as pd
import pytest

from app.training_service import DatasetValidationError, train_candidate


def valid_csv_bytes(rows: int = 40) -> bytes:
    rng = np.random.default_rng(42)
    frame = pd.DataFrame({
        "study_hours_per_day": rng.uniform(0, 8, rows),
        "attendance_percent": rng.uniform(50, 100, rows),
        "assignment_completion_percent": rng.uniform(40, 100, rows),
        "practice_quizzes_per_week": rng.integers(0, 8, rows),
        "class_participation_score": rng.uniform(0, 10, rows),
        "previous_score": rng.uniform(20, 100, rows),
        "sleep_hours": rng.uniform(4, 10, rows),
    })
    frame["final_score"] = np.clip(
        frame["previous_score"] * 0.45
        + frame["study_hours_per_day"] * 3
        + frame["attendance_percent"] * 0.15,
        0, 100,
    )
    return frame.to_csv(index=False).encode("utf-8")


def test_training_produces_candidate_and_held_out_metrics():
    result = train_candidate(valid_csv_bytes())
    assert result["status"] == "candidate"
    assert result["rows_used"] == 40
    assert result["train_rows"] + result["test_rows"] == 40
    assert result["metrics"]["mae"] >= 0
    assert result["metrics"]["rmse"] >= 0
    assert len(result["feature_importance"]) == 7


def test_training_rejects_missing_columns():
    with pytest.raises(DatasetValidationError, match="Missing required columns"):
        train_candidate(b"study_hours_per_day,final_score\n1,50\n" * 25)


def test_training_rejects_out_of_range_features():
    frame = pd.read_csv(__import__("io").BytesIO(valid_csv_bytes()))
    frame.loc[0, "attendance_percent"] = 101
    with pytest.raises(DatasetValidationError, match="attendance_percent"):
        train_candidate(frame.to_csv(index=False).encode("utf-8"))


def test_training_rejects_too_few_rows():
    with pytest.raises(DatasetValidationError, match="At least 20 rows"):
        train_candidate(valid_csv_bytes(10))
