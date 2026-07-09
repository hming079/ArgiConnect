# AgriConnect Local AI Forecast MVP

This folder contains a lightweight local machine learning workflow for forecasting agricultural supply quantity by province, crop, year, and month.

By default, ETL uses the backend-generated dataset:

```text
../backend/scripts/output/daily_province_crop_stats.csv
```

It aggregates daily province/crop rows into monthly training rows with the columns required by the model.

It uses a simple scikit-learn pipeline:

- `OneHotEncoder` for `province` and `crop_name`
- `StandardScaler` for numeric features
- model comparison across `LinearRegression`, `DecisionTreeRegressor`, `RandomForestRegressor`, and `GradientBoostingRegressor`

No external AI APIs, deep learning, LangChain, or RAG are used.

## Setup

```powershell
cd ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run ETL

```powershell
python etl.py
```

This builds `data/agri_forecast_dataset.csv` from backend daily stats when available. If that backend file is missing, ETL falls back to generated demo data. It then cleans the dataset and writes:

```text
data/cleaned_agri_forecast_dataset.csv
```

## Train Model

```powershell
python train.py
```

Or train from the backend-owned dataset after importing it into PostgreSQL:

```powershell
python train.py --dataset-url "http://localhost:8080/api/forecast-dataset" --token "<ADMIN_JWT>"
```

Outputs:

```text
models/agri_forecast_model.pkl
models/metrics.json
models/model_comparison.json
```

`train.py` automatically selects the best model by highest R2 score, then lowest RMSE, then lowest MAE. `predict.py` continues to load `models/agri_forecast_model.pkl`.

## Generate Forecast

Single prediction:

```powershell
python predict.py --province "An Giang" --crop-name "Nho" --year 2026 --month 6 --sold-quantity 18000 --average-price 25000
```

Batch prediction:

```powershell
python predict.py --input-csv data/cleaned_agri_forecast_dataset.csv
```

Output:

```text
data/forecast_result.csv
```

## Import Into Backend

Start PostgreSQL and the Spring Boot backend, then import the training dataset into the backend:

```text
POST /api/forecast-dataset/import-csv
```

To import prediction output into forecast results, call:

```text
POST /api/forecasts/import-csv
```

The backend reads `ai/data/forecast_result.csv` and saves rows into PostgreSQL.
