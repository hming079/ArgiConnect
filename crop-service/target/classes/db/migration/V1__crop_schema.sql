CREATE TABLE crops (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    storage_days INTEGER NOT NULL,
    default_unit VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE crop_batches (
    id BIGSERIAL PRIMARY KEY,
    crop_id BIGINT NOT NULL REFERENCES crops(id),
    farmer_id BIGINT NOT NULL,
    farmer_name VARCHAR(255),
    initial_quantity NUMERIC(12, 2) NOT NULL,
    available_quantity NUMERIC(12, 2) NOT NULL,
    reserved_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sold_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    harvest_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    ward VARCHAR(100),
    address_detail TEXT,
    status VARCHAR(30) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_crop_quantities CHECK (
        initial_quantity >= 0
        AND available_quantity >= 0
        AND reserved_quantity >= 0
        AND sold_quantity >= 0
        AND initial_quantity = available_quantity + reserved_quantity + sold_quantity
    )
);
CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY,
    request_id UUID NOT NULL UNIQUE,
    order_reference VARCHAR(100),
    crop_batch_id BIGINT NOT NULL REFERENCES crop_batches(id),
    buyer_id BIGINT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY,
    reservation_id UUID,
    crop_batch_id BIGINT NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_version INTEGER NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(30) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT
);
CREATE TABLE processed_events (
    event_id UUID PRIMARY KEY,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_reservation_expiry ON inventory_reservations(status, expires_at);