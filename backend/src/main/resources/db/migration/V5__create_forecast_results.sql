CREATE TABLE forecast_results (
    id BIGSERIAL PRIMARY KEY,
    province VARCHAR(100) NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    predicted_quantity NUMERIC(12,2) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_forecast_results_filters
ON forecast_results (province, crop_name, year, month);
