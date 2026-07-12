from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from pydantic import ValidationError

from .forecast_service import load_default_inputs, predict_many
from .model_loader import current_model_name, model_is_available
from .schemas import BatchForecastRequest, BatchForecastResponse, ForecastInput, ForecastPrediction, HealthResponse


app = FastAPI(
    title="AgriConnect AI Forecast Service",
    description="Local ML service for harvest quantity prediction.",
    version="1.0.0",
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_loaded=model_is_available(),
        model_name=current_model_name(),
    )


@app.post("/predict", response_model=ForecastPrediction)
def predict_one(item: ForecastInput) -> ForecastPrediction:
    try:
        predictions = predict_many([item])
        return predictions[0]
    except FileNotFoundError as exception:
        raise HTTPException(status_code=400, detail=str(exception)) from exception
    except ValueError as exception:
        raise HTTPException(status_code=422, detail=str(exception)) from exception


@app.post("/predict-batch", response_model=BatchForecastResponse)
async def predict_batch(request: Request) -> BatchForecastResponse:
    try:
        try:
            payload = await request.json()
        except Exception:
            payload = None

        if payload:
            batch_request = BatchForecastRequest.model_validate(payload)
            items = batch_request.items
        else:
            items = load_default_inputs()

        predictions = predict_many(items)
        model_name = predictions[0].model_name if predictions else current_model_name()
        return BatchForecastResponse(model_name=model_name, predictions=predictions)
    except FileNotFoundError as exception:
        raise HTTPException(status_code=400, detail=str(exception)) from exception
    except ValidationError as exception:
        raise HTTPException(status_code=422, detail=exception.errors()) from exception
    except ValueError as exception:
        raise HTTPException(status_code=422, detail=str(exception)) from exception


@app.post("/predict-default-dataset", response_model=BatchForecastResponse)
def predict_default_dataset() -> BatchForecastResponse:
    try:
        predictions = predict_many(load_default_inputs())
        model_name = predictions[0].model_name if predictions else current_model_name()
        return BatchForecastResponse(model_name=model_name, predictions=predictions)
    except FileNotFoundError as exception:
        raise HTTPException(status_code=400, detail=str(exception)) from exception
    except ValueError as exception:
        raise HTTPException(status_code=422, detail=str(exception)) from exception
