from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "agri_forecast_model.pkl"
METRICS_PATH = BASE_DIR / "models" / "metrics.json"
OUTPUT_PATH = BASE_DIR / "data" / "forecast_result.csv"

FEATURE_COLUMNS = ["province", "crop_name", "year", "month", "sold_quantity", "average_price"]


def normalize_text(value: str) -> str:
    return " ".join(str(value).strip().title().split())


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Model not found. Run `python train.py` first.")
    return joblib.load(MODEL_PATH)


def selected_model_name() -> str:
    if not METRICS_PATH.exists():
        return "UnknownModel"
    try:
        metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
        return metrics.get("best_model_name", "UnknownModel")
    except json.JSONDecodeError:
        return "UnknownModel"


def clean_input(df: pd.DataFrame) -> pd.DataFrame:
    missing = [column for column in FEATURE_COLUMNS if column not in df.columns]
    if missing:
        raise ValueError(f"Input is missing required columns: {missing}")

    df = df[FEATURE_COLUMNS].copy()
    df["province"] = df["province"].map(normalize_text)
    df["crop_name"] = df["crop_name"].map(normalize_text)
    for column in ["year", "month", "sold_quantity", "average_price"]:
        df[column] = pd.to_numeric(df[column], errors="coerce")
    if df.isna().any().any():
        raise ValueError("Input contains invalid or missing numeric values.")
    df["year"] = df["year"].astype(int)
    df["month"] = df["month"].astype(int)
    return df


def predict(df: pd.DataFrame) -> pd.DataFrame:
    model = load_model()
    cleaned = clean_input(df)
    result = cleaned.copy()
    result["predicted_quantity"] = model.predict(cleaned).round(2)
    result["model_name"] = selected_model_name()
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Predict agricultural harvest quantity.")
    parser.add_argument("--input-csv", help="Optional CSV file for batch prediction.")
    parser.add_argument("--province", default="An Giang")
    parser.add_argument("--crop-name", default="Nho")
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--month", type=int, default=6)
    parser.add_argument("--sold-quantity", type=float, default=18000)
    parser.add_argument("--average-price", type=float, default=25000)
    args = parser.parse_args()

    if args.input_csv:
        input_df = pd.read_csv(args.input_csv)
    else:
        input_df = pd.DataFrame(
            [
                {
                    "province": args.province,
                    "crop_name": args.crop_name,
                    "year": args.year,
                    "month": args.month,
                    "sold_quantity": args.sold_quantity,
                    "average_price": args.average_price,
                }
            ]
        )

    result = predict(input_df)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(OUTPUT_PATH, index=False)

    print(result.to_string(index=False))
    print(f"Saved forecast output: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
