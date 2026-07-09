from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import math
import urllib.request
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeRegressor


BASE_DIR = Path(__file__).resolve().parent
DATASET = BASE_DIR / "data" / "cleaned_agri_forecast_dataset.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "agri_forecast_model.pkl"
METRICS_PATH = MODEL_DIR / "metrics.json"
COMPARISON_PATH = MODEL_DIR / "model_comparison.json"

CATEGORICAL_COLUMNS = ["province", "crop_name"]
NUMERIC_COLUMNS = ["year", "month", "sold_quantity", "average_price"]
TARGET_COLUMN = "harvest_quantity"
REQUIRED_COLUMNS = CATEGORICAL_COLUMNS + NUMERIC_COLUMNS + [TARGET_COLUMN]


def load_training_data(dataset_url: str | None, token: str | None) -> pd.DataFrame:
    if not dataset_url:
        if not DATASET.exists():
            raise FileNotFoundError("Cleaned dataset not found. Run `python etl.py` first.")
        return pd.read_csv(DATASET)

    request = urllib.request.Request(dataset_url)
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(request, timeout=20) as response:
        records = json.loads(response.read().decode("utf-8"))

    df = pd.DataFrame(records)
    rename_map = {
        "cropName": "crop_name",
        "harvestQuantity": "harvest_quantity",
        "soldQuantity": "sold_quantity",
        "averagePrice": "average_price",
    }
    return df.rename(columns=rename_map)


def validate_dataset(df: pd.DataFrame) -> pd.DataFrame:
    missing = [column for column in REQUIRED_COLUMNS if column not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")
    if df.empty:
        raise ValueError("Dataset is empty.")

    df = df[REQUIRED_COLUMNS].copy()
    for column in CATEGORICAL_COLUMNS:
        df[column] = df[column].fillna("").astype(str).str.strip()
    if (df[CATEGORICAL_COLUMNS] == "").any().any():
        raise ValueError("Dataset contains missing province or crop_name values.")

    for column in NUMERIC_COLUMNS + [TARGET_COLUMN]:
        df[column] = pd.to_numeric(df[column], errors="coerce")
    if df[NUMERIC_COLUMNS + [TARGET_COLUMN]].isna().any().any():
        raise ValueError("Dataset contains invalid numeric values.")
    if len(df) < 5:
        raise ValueError("Dataset needs at least 5 rows to train and test models.")
    return df


def make_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_COLUMNS),
            ("numeric", StandardScaler(), NUMERIC_COLUMNS),
        ]
    )


def candidate_models() -> dict[str, object]:
    return {
        "LinearRegression": LinearRegression(),
        "DecisionTreeRegressor": DecisionTreeRegressor(random_state=42, min_samples_leaf=2),
        "RandomForestRegressor": RandomForestRegressor(
            n_estimators=120,
            random_state=42,
            min_samples_leaf=2,
        ),
        "GradientBoostingRegressor": GradientBoostingRegressor(random_state=42),
    }


def build_pipeline(regressor: object) -> Pipeline:
    return Pipeline(
        steps=[
            ("preprocessor", make_preprocessor()),
            ("regressor", regressor),
        ]
    )


def evaluate_model(model: Pipeline, x_test: pd.DataFrame, y_test: pd.Series) -> dict[str, float]:
    predictions = model.predict(x_test)
    return {
        "mae": mean_absolute_error(y_test, predictions),
        "rmse": math.sqrt(mean_squared_error(y_test, predictions)),
        "r2_score": r2_score(y_test, predictions),
    }


def rounded_metrics(metrics: dict[str, float]) -> dict[str, float]:
    return {
        "mae": round(metrics["mae"], 2),
        "rmse": round(metrics["rmse"], 2),
        "r2_score": round(metrics["r2_score"], 4),
    }


def print_comparison(results: list[dict[str, float | str]]) -> None:
    print("\nModel comparison")
    print("-" * 74)
    print(f"{'Model':<28} {'MAE':>12} {'RMSE':>12} {'R2 score':>12}")
    print("-" * 74)
    for result in results:
        print(
            f"{str(result['model_name']):<28} "
            f"{float(result['mae']):>12,.2f} "
            f"{float(result['rmse']):>12,.2f} "
            f"{float(result['r2_score']):>12,.4f}"
        )
    print("-" * 74)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the AgriConnect local forecast model.")
    parser.add_argument("--dataset-url", help="Optional backend dataset endpoint, for example http://localhost:8080/api/forecast-dataset")
    parser.add_argument("--token", help="Optional JWT token for backend dataset access.")
    args = parser.parse_args()

    df = validate_dataset(load_training_data(args.dataset_url, args.token))
    x = df[CATEGORICAL_COLUMNS + NUMERIC_COLUMNS]
    y = df[TARGET_COLUMN]

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
    )

    trained_models: dict[str, Pipeline] = {}
    comparison: list[dict[str, float | str]] = []

    for model_name, regressor in candidate_models().items():
        model = build_pipeline(regressor)
        model.fit(x_train, y_train)
        metrics = evaluate_model(model, x_test, y_test)
        trained_models[model_name] = model
        comparison.append({"model_name": model_name, **rounded_metrics(metrics)})

    comparison.sort(
        key=lambda item: (
            -float(item["r2_score"]),
            float(item["rmse"]),
            float(item["mae"]),
        )
    )
    best = comparison[0]
    best_model_name = str(best["model_name"])
    selected_metrics = {
        "best_model_name": best_model_name,
        "mae": best["mae"],
        "rmse": best["rmse"],
        "r2_score": best["r2_score"],
        "train_rows": int(len(x_train)),
        "test_rows": int(len(x_test)),
        "selected_at": datetime.now(timezone.utc).isoformat(),
    }

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(trained_models[best_model_name], MODEL_PATH)
    COMPARISON_PATH.write_text(json.dumps(comparison, indent=2), encoding="utf-8")
    METRICS_PATH.write_text(json.dumps(selected_metrics, indent=2), encoding="utf-8")

    print_comparison(comparison)
    print(f"Selected best model: {best_model_name}")
    print(f"MAE: {selected_metrics['mae']}")
    print(f"RMSE: {selected_metrics['rmse']}")
    print(f"R2 score: {selected_metrics['r2_score']}")
    print(f"Saved model: {MODEL_PATH}")
    print(f"Saved metrics: {METRICS_PATH}")
    print(f"Saved comparison: {COMPARISON_PATH}")


if __name__ == "__main__":
    main()
