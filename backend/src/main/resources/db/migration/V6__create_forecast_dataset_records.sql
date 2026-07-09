CREATE TABLE forecast_dataset_records (
    id BIGSERIAL PRIMARY KEY,
    province VARCHAR(100) NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    harvest_quantity NUMERIC(12,2) NOT NULL,
    sold_quantity NUMERIC(12,2) NOT NULL,
    average_price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_forecast_dataset_records_filters
ON forecast_dataset_records (province, crop_name, year, month);
