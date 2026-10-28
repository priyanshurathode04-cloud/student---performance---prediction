from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_model_not_loaded_yet():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "student-performance-api"
    assert body["model_loaded"] is False


def test_prediction_does_not_return_a_fake_score_before_model_integration():
    response = client.post(
        "/api/predict",
        json={
            "features": {
                "study_hours_per_day": 2.5,
                "attendance_percent": 85,
                "assignment_completion_percent": 90,
                "practice_quizzes_per_week": 3,
                "class_participation_score": 6,
                "previous_score": 70,
                "sleep_hours": 7.5,
            }
        },
    )
    assert response.status_code == 503
    assert "not connected to the trained model" in response.json()["detail"]


def test_prediction_rejects_out_of_range_features():
    response = client.post(
        "/api/predict",
        json={
            "features": {
                "study_hours_per_day": 25,
                "attendance_percent": 85,
                "assignment_completion_percent": 90,
                "practice_quizzes_per_week": 3,
                "class_participation_score": 6,
                "previous_score": 70,
                "sleep_hours": 7.5,
            }
        },
    )
    assert response.status_code == 422
