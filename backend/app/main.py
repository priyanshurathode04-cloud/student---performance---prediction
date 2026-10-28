import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import HealthResponse, PredictionRequest, PredictionResponse

app = FastAPI(
    title="Student Performance Prediction API",
    version="0.1.0",
    description="API scaffold for the Student Performance Prediction System.",
)

# Set FRONTEND_ORIGIN to the deployed frontend origin before deployment.
allowed_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    # No model is loaded yet. Keep this explicit instead of returning a fake prediction.
    return HealthResponse(
        status="ok",
        service="student-performance-api",
        model_loaded=False,
    )


@app.post("/api/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> PredictionResponse:
    # The next migration stage will extract the existing Streamlit ML pipeline into
    # a shared service module and load a validated model artifact here.
    _ = request
    raise HTTPException(
        status_code=503,
        detail=(
            "Prediction service is not connected to the trained model yet. "
            "No prediction was generated."
        ),
    )
