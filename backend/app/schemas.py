from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    model_loaded: bool


class StudentFeatures(BaseModel):
    """Input fields aligned to the compact demo dataset."""

    model_config = ConfigDict(extra="forbid")

    study_hours_per_day: float = Field(ge=0, le=24)
    attendance_percent: float = Field(ge=0, le=100)
    assignment_completion_percent: float = Field(ge=0, le=100)
    practice_quizzes_per_week: int = Field(ge=0, le=100)
    class_participation_score: float = Field(ge=0, le=10)
    previous_score: float = Field(ge=0, le=100)
    sleep_hours: float = Field(ge=0, le=24)


class PredictionRequest(BaseModel):
    features: StudentFeatures


class PredictionResponse(BaseModel):
    status: str
    message: str
    predicted_score: float
    model_name: str
    dataset: str
    guidance: list[str]
    disclaimer: str
