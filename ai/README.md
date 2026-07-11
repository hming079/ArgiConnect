# AgriConnect Local AI Forecast MVP

This folder contains a lightweight local machine learning workflow for forecasting agricultural supply quantity by province, crop, year, and month.

By default, ETL uses the generated dataset:

```text
output/daily_province_crop_stats.csv
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

This builds `data/agri_forecast_dataset.csv` from generated daily stats when available. If that file is missing, ETL falls back to demo data. It then cleans the dataset and writes:

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

## Run As A Local AI Service

The AI module can also run as a small FastAPI service. This lets the Spring Boot backend call the trained model directly instead of importing `forecast_result.csv` manually.

Start the service:

```powershell
cd ai
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8001
```

Health check:

```text
GET http://localhost:8001/health
```

Single prediction:

```text
POST http://localhost:8001/predict
```

Example body:

```json
{
  "province": "An Giang",
  "crop_name": "Nho",
  "year": 2026,
  "month": 7,
  "sold_quantity": 1200,
  "average_price": 18000
}
```

Batch prediction:

```text
POST http://localhost:8001/predict-batch
```

Example body:

```json
{
  "items": [
    {
      "province": "An Giang",
      "crop_name": "Nho",
      "year": 2026,
      "month": 7,
      "sold_quantity": 1200,
      "average_price": 18000
    }
  ]
}
```

## Backend AI Service Integration

Spring Boot reads the AI service URL from:

```properties
AI_FORECAST_SERVICE_URL=http://localhost:8001
```

or the default:

```properties
ai.forecast-service-url=http://localhost:8001
```

Admin can call:

```text
POST /api/forecasts/generate-ai
```

Backend flow:

```text
forecast_dataset_records
    -> Spring Boot AiForecastClient
    -> FastAPI /predict-batch
    -> forecast_results
    -> Admin forecast dashboard
```

Recommended demo order:

```powershell
cd ai
python etl.py
python train.py
uvicorn app.main:app --reload --port 8001
```

Then in the Admin Dashboard:

```text
Import Dataset -> Generate AI Forecast
```
