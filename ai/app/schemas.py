from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class ForecastInput(BaseModel):
    province: str
    crop_name: str
    year: int
    month: int
    sold_quantity: float = Field(ge=0)
    average_price: float = Field(ge=0)


class ForecastPrediction(ForecastInput):
    predicted_quantity: float
    model_name: str


class BatchForecastRequest(BaseModel):
    items: List[ForecastInput]


class BatchForecastResponse(BaseModel):
    model_name: str
    predictions: List[ForecastPrediction]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str
