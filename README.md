# AgriConnect

AgriConnect is a full-stack agricultural rescue and commerce platform. It connects farmers, buyers, logistics users, and administrators so crop batches can be listed, rescued, ordered, and tracked from supply to shipment.

## Features

- Role-based authentication with JWT for `ADMIN`, `FARMER`, `BUYER`, and `LOGISTICS` users.
- Crop and crop batch management for agricultural products.
- Rescue point and rescue registration workflows.
- Buyer cart, checkout, order, and shipment flows.
- Admin dashboards for users, rescue requests, subsidies, analytics, and coordination.
- Swagger/OpenAPI documentation for backend APIs.

## Tech Stack

### Backend

- Java 17
- Spring Boot
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL
- Flyway migrations
- Maven

### Frontend

- React
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Axios
- Tailwind CSS / shadcn-style UI components

## Project Structure

```text
ArgiConnect/
  backend/     Spring Boot API, database migrations, tests
  frontend/    React client application
  run.bat      Windows helper script to start backend and frontend
```

## Prerequisites

Install these before running the project:

- Java 17+
- Node.js 20+
- npm
- Docker Desktop, for PostgreSQL

## Getting Started

### 1. Start PostgreSQL

From the backend folder:

```bash
cd backend
docker compose up -d
```

The database runs on:

```text
localhost:5433
database: agriconnect
username: postgres
password: postgres
```

### 2. Start the backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Backend URL:

```text
http://localhost:8080
```

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

### 3. Start the frontend

Create `frontend/.env` if it does not exist:

```env
VITE_API_URL=http://localhost:8080/api
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

### Quick Start on Windows

You can also start both apps with:

```bat
run.bat
```

Start PostgreSQL first with Docker before using this script.

## Demo Accounts

The default password for seeded users is:

```text
123456
```

| Role | Email |
| --- | --- |
| Admin | admin.khang@sannongnghiep.vn |
| Farmer | tam.nongdan@gmail.com |
| Buyer | datngo.buyer@gmail.com |
| Logistics | tungdinh.logistics@gmail.com |

## Useful Commands

### Backend

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
```

## Local AI Forecast MVP

AgriConnect includes a lightweight local machine learning workflow in `ai/` for forecasting agricultural supply quantity by province, crop, year, and month. It uses scikit-learn locally and does not call external AI APIs.

### 1. Create Python environment

```powershell
cd ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Prepare data

```powershell
python etl.py
```

This uses `ai/output/daily_province_crop_stats.csv` when available, aggregates daily rows into monthly province/crop training rows, and writes:

```text
data/cleaned_agri_forecast_dataset.csv
```

### 3. Train model

```powershell
python train.py
```

Outputs:

```text
models/agri_forecast_model.pkl
models/metrics.json
```

### 4. Generate forecast

```powershell
python predict.py
```

Or provide one prediction manually:

```powershell
python predict.py --province "An Giang" --crop-name "Nho" --year 2026 --month 6 --sold-quantity 18000 --average-price 25000
```

Batch prediction is also supported:

```powershell
python predict.py --input-csv data/cleaned_agri_forecast_dataset.csv
```

Forecast output is saved to:

```text
ai/data/forecast_result.csv
```

### 5. Import forecast into backend

Start PostgreSQL and the Spring Boot backend. First import the cleaned AI training dataset into PostgreSQL:

```text
POST /api/forecast-dataset/import-csv
```

Then train from the backend-owned dataset if desired:

```powershell
cd ai
python train.py --dataset-url "http://localhost:8080/api/forecast-dataset" --token "<ADMIN_JWT>"
```

To import the latest prediction output, call:

```text
POST /api/forecasts/import-csv
```

The backend keeps training data in `forecast_dataset_records` and prediction output in `forecast_results`.

The Admin Dashboard displays imported forecast rows and supports simple filters for province, crop, year, and month.

## Main API Areas

| Area | Base Path |
| --- | --- |
| Authentication | `/api/auth` |
| Users | `/api/users` |
| Crops | `/api/crops` |
| Crop batches | `/api/crop-batches` |
| Crop locks | `/api/crop-locks` |
| Orders | `/api/orders` |
| Order items | `/api/order-items` |
| Shipments | `/api/shipments` |
| Rescue points | `/api/rescue-points` |
| Rescue registrations | `/api/rescue-registrations` |
| Analytics | `/api/analytics` |
| Forecasts | `/api/forecasts` |

Use Swagger UI for request and response details.

## Notes for Development

- Backend database schema is managed by Flyway migrations in `backend/src/main/resources/db/migration`.
- Development seed data is loaded from `backend/src/main/resources/db/specific/dev`.
- Frontend API calls use `VITE_API_URL` from environment variables.
- JWT tokens are stored in browser local storage during development.

## Future Improvements

- Move local database credentials and JWT secrets to environment variables.
- Add GitHub Actions CI for backend tests, frontend lint, and frontend build.
- Add screenshots or a short demo flow to make the project easier to review.
