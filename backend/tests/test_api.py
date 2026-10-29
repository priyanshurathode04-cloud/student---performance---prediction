from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID_FEATURES = {
    "study_hours_per_day": 2.5,
    "attendance_percent": 85,
    "assignment_completion_percent": 90,
    "practice_quizzes_per_week": 3,
    "class_participation_score": 6,
    "previous_score": 70,
    "sleep_hours": 7.5,
}


def test_health_reports_model_ready():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "student-performance-api"
    assert body["model_loaded"] is True


def test_prediction_returns_actual_model_score_and_guidance():
    response = client.post("/api/predict", json={"features": VALID_FEATURES})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert isinstance(body["predicted_score"], float)
    assert 0 <= body["predicted_score"] <= 100
    assert body["model_name"] == "Extra Trees Regressor"
    assert "synthetic" in body["dataset"].lower()
    assert body["guidance"]
    assert "demonstration only" in body["disclaimer"]


def test_prediction_is_deterministic_for_same_inputs():
    first = client.post("/api/predict", json={"features": VALID_FEATURES}).json()
    second = client.post("/api/predict", json={"features": VALID_FEATURES}).json()
    assert first["predicted_score"] == second["predicted_score"]


def test_prediction_rejects_out_of_range_features():
    invalid = {**VALID_FEATURES, "study_hours_per_day": 25}
    response = client.post("/api/predict", json={"features": invalid})
    assert response.status_code == 422


def test_prediction_rejects_unknown_features():
    invalid = {**VALID_FEATURES, "student_name": "Not a model feature"}
    response = client.post("/api/predict", json={"features": invalid})
    assert response.status_code == 422



def test_dataset_info_describes_demo_data():
    response = client.get("/api/dataset-info")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["target"] == "final_score"
    assert len(body["features"]) == 7
    assert "synthetic" in body["note"].lower()


def test_training_requires_operator_token(monkeypatch):
    monkeypatch.delenv("TRAINING_API_TOKEN", raising=False)
    response = client.post(
        "/api/train",
        files={"file": ("students.csv", b"study_hours_per_day,final_score\n1,50\n", "text/csv")},
    )
    assert response.status_code == 503
    assert "TRAINING_API_TOKEN" in response.json()["detail"]
