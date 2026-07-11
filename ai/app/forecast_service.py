from __future__ import annotations

import pandas as pd

from predict import clean_input, selected_model_name

from .model_loader import cached_model
from .schemas import ForecastInput, ForecastPrediction


def predict_many(items: list[ForecastInput]) -> list[ForecastPrediction]:
    if not items:
        return []

    input_df = pd.DataFrame([item.model_dump() for item in items])
    cleaned_df = clean_input(input_df)
    model = cached_model()
    predictions = model.predict(cleaned_df).round(2)
    model_name = selected_model_name()

    results: list[ForecastPrediction] = []
    for row, predicted_quantity in zip(cleaned_df.to_dict("records"), predictions):
        results.append(
            ForecastPrediction(
                **row,
                predicted_quantity=float(predicted_quantity),
                model_name=model_name,
            )
        )
    return results
