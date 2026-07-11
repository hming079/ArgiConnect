from __future__ import annotations

import csv
import math
import random
from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
RAW_DATASET = DATA_DIR / "agri_forecast_dataset.csv"
CLEANED_DATASET = DATA_DIR / "cleaned_agri_forecast_dataset.csv"
GENERATED_DAILY_STATS = BASE_DIR / "output" / "daily_province_crop_stats.csv"

PROVINCES = [
    "An Giang",
    "Binh Thuan",
    "Can Tho",
    "Dak Lak",
    "Dong Thap",
    "Lam Dong",
    "Long An",
    "Tien Giang",
]

CROPS = {
    "Rice": {"base": 8200, "price": 7800, "peak_months": {2, 3, 8, 9}},
    "Mango": {"base": 2100, "price": 32000, "peak_months": {4, 5, 6}},
    "Dragon Fruit": {"base": 2800, "price": 24000, "peak_months": {5, 6, 7, 8}},
    "Durian": {"base": 1200, "price": 68000, "peak_months": {6, 7, 8}},
    "Pineapple": {"base": 1800, "price": 16000, "peak_months": {3, 4, 5, 10}},
    "Watermelon": {"base": 2400, "price": 11000, "peak_months": {1, 2, 12}},
}


def normalize_text(value: str) -> str:
    return " ".join(str(value).strip().title().split())


def generate_sample_dataset(path: Path) -> None:
    random.seed(42)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    province_factor = {province: 0.85 + index * 0.06 for index, province in enumerate(PROVINCES)}

    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=[
                "province",
                "crop_name",
                "year",
                "month",
                "harvest_quantity",
                "sold_quantity",
                "average_price",
            ],
        )
        writer.writeheader()
        for year in range(2023, 2026):
            year_factor = 1 + (year - 2023) * 0.035
            for province in PROVINCES:
                for crop_name, crop in CROPS.items():
                    for month in range(1, 13):
                        seasonal = 1.35 if month in crop["peak_months"] else 0.82
                        wave = 1 + 0.10 * math.sin((month / 12) * 2 * math.pi)
                        noise = random.uniform(0.90, 1.12)
                        harvest = crop["base"] * province_factor[province] * year_factor * seasonal * wave * noise
                        sold_ratio = random.uniform(0.58, 0.92)
                        price_noise = random.uniform(0.88, 1.18)
                        price = crop["price"] * (1.05 if month not in crop["peak_months"] else 0.94) * price_noise

                        writer.writerow(
                            {
                                "province": province,
                                "crop_name": crop_name,
                                "year": year,
                                "month": month,
                                "harvest_quantity": round(harvest, 2),
                                "sold_quantity": round(harvest * sold_ratio, 2),
                                "average_price": round(price, 2),
                            }
                        )


def build_dataset_from_backend_stats(source: Path, target: Path) -> None:
    stats = pd.read_csv(source)
    required_columns = [
        "date",
        "province",
        "crop_name",
        "harvest_kg",
        "demand_kg",
        "average_price",
    ]
    missing = [column for column in required_columns if column not in stats.columns]
    if missing:
        raise ValueError(f"Backend daily stats file is missing required columns: {missing}")

    stats = stats[required_columns].copy()
    stats["date"] = pd.to_datetime(stats["date"], errors="coerce")
    stats = stats.dropna(subset=["date"])
    stats["year"] = stats["date"].dt.year
    stats["month"] = stats["date"].dt.month

    for column in ["harvest_kg", "demand_kg", "average_price"]:
        stats[column] = pd.to_numeric(stats[column], errors="coerce").fillna(0)

    stats["weighted_price_value"] = stats["average_price"] * stats["demand_kg"].clip(lower=0)
    stats["price_weight"] = stats["demand_kg"].where(stats["average_price"] > 0, 0)

    grouped = (
        stats.groupby(["province", "crop_name", "year", "month"], as_index=False)
        .agg(
            harvest_quantity=("harvest_kg", "sum"),
            sold_quantity=("demand_kg", "sum"),
            weighted_price_value=("weighted_price_value", "sum"),
            price_weight=("price_weight", "sum"),
            average_price_fallback=("average_price", lambda values: values[values > 0].mean()),
        )
    )
    grouped["average_price"] = grouped.apply(
        lambda row: row["weighted_price_value"] / row["price_weight"]
        if row["price_weight"] > 0
        else row["average_price_fallback"],
        axis=1,
    )
    grouped["average_price"] = grouped["average_price"].fillna(0)
    grouped = grouped[
        [
            "province",
            "crop_name",
            "year",
            "month",
            "harvest_quantity",
            "sold_quantity",
            "average_price",
        ]
    ]
    grouped.to_csv(target, index=False)
    print(f"Built AI dataset from backend stats: {source}")


def run_etl() -> None:
    if GENERATED_DAILY_STATS.exists():
        build_dataset_from_backend_stats(GENERATED_DAILY_STATS, RAW_DATASET)
    elif not RAW_DATASET.exists():
        generate_sample_dataset(RAW_DATASET)
        print(f"Generated sample dataset: {RAW_DATASET}")

    df = pd.read_csv(RAW_DATASET)
    required_columns = [
        "province",
        "crop_name",
        "year",
        "month",
        "harvest_quantity",
        "sold_quantity",
        "average_price",
    ]
    missing = [column for column in required_columns if column not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    df = df[required_columns].copy()
    df["province"] = df["province"].fillna("Unknown").map(normalize_text)
    df["crop_name"] = df["crop_name"].fillna("Unknown").map(normalize_text)

    numeric_columns = ["year", "month", "harvest_quantity", "sold_quantity", "average_price"]
    for column in numeric_columns:
        df[column] = pd.to_numeric(df[column], errors="coerce")
        df[column] = df[column].fillna(df[column].median())

    df["year"] = df["year"].astype(int)
    df["month"] = df["month"].clip(1, 12).astype(int)
    df = df.drop_duplicates()
    df.to_csv(CLEANED_DATASET, index=False)
    print(f"Saved cleaned dataset: {CLEANED_DATASET}")


if __name__ == "__main__":
    run_etl()
