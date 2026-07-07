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

Use Swagger UI for request and response details.
http://localhost:8080/swagger-ui/index.html#/

## Notes for Development

- Backend database schema is managed by Flyway migrations in `backend/src/main/resources/db/migration`.
- Development seed data is loaded from `backend/src/main/resources/db/specific/dev`.
- Frontend API calls use `VITE_API_URL` from environment variables.
- JWT tokens are stored in browser local storage during development.

## Future Improvements

- Move local database credentials and JWT secrets to environment variables.
- Add GitHub Actions CI for backend tests, frontend lint, and frontend build.
- Add screenshots or a short demo flow to make the project easier to review.
