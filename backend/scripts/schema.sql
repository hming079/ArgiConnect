-- =========================
-- USERS
-- =========================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),

    role VARCHAR(20) NOT NULL CHECK (
        role IN ('FARMER', 'BUYER', 'LOGISTICS', 'ADMIN')
    ),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'INACTIVE')
    ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CROPS
-- =========================

CREATE TABLE crops (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    description TEXT,

    storage_days INTEGER NOT NULL,
    default_unit VARCHAR(20) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CROP_BATCHES
-- =========================

CREATE TABLE crop_batches (
    id BIGSERIAL PRIMARY KEY,

    crop_id BIGINT NOT NULL,
    farmer_id BIGINT NOT NULL,

    quantity NUMERIC(12,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,

    harvest_date DATE NOT NULL,
    expiry_date DATE NOT NULL,

    province VARCHAR(100),
    district VARCHAR(100),
    location TEXT,

    status VARCHAR(30) NOT NULL CHECK (
        status IN (
            'AT_FARM',
            'SORTING',
            'READY_FOR_RESCUE',
            'LOCKED',
            'SHIPPING',
            'DELIVERED',
            'SOLD_OUT'
        )
    ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_batch_crop
        FOREIGN KEY (crop_id)
        REFERENCES crops(id),

    CONSTRAINT fk_batch_farmer
        FOREIGN KEY (farmer_id)
        REFERENCES users(id)
);

-- =========================
-- RESCUE_POINTS
-- =========================

CREATE TABLE rescue_points (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    province VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (
        status IN ('ACTIVE', 'INACTIVE')
    ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- RESCUE_REGISTRATIONS
-- =========================

CREATE TABLE rescue_registrations (
    id BIGSERIAL PRIMARY KEY,

    batch_id BIGINT NOT NULL,
    rescue_point_id BIGINT NOT NULL,

    approved_by BIGINT,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN (
            'PENDING',
            'APPROVED',
            'REJECTED'
        )
    ),

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,

    CONSTRAINT fk_registration_batch
        FOREIGN KEY (batch_id)
        REFERENCES crop_batches(id),

    CONSTRAINT fk_registration_point
        FOREIGN KEY (rescue_point_id)
        REFERENCES rescue_points(id),

    CONSTRAINT fk_registration_admin
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
);

-- =========================
-- ORDERS
-- =========================

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,

    buyer_id BIGINT NOT NULL,

    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL CHECK (
        status IN (
            'PENDING',
            'PAID',
            'SHIPPING',
            'COMPLETED',
            'CANCELLED'
        )
    ),

    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_buyer
        FOREIGN KEY (buyer_id)
        REFERENCES users(id)
);

-- =========================
-- ORDER_ITEMS
-- =========================

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,

    quantity NUMERIC(12,2) NOT NULL,

    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL,

    CONSTRAINT fk_order_item_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_item_batch
        FOREIGN KEY (batch_id)
        REFERENCES crop_batches(id)
);

-- =========================
-- CROP_LOCKS
-- =========================

CREATE TABLE crop_locks (
    id BIGSERIAL PRIMARY KEY,

    batch_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,

    quantity NUMERIC(12,2) NOT NULL,

    status VARCHAR(20) NOT NULL CHECK (
        status IN (
            'ACTIVE',
            'EXPIRED',
            'CONVERTED'
        )
    ),

    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_lock_batch
        FOREIGN KEY (batch_id)
        REFERENCES crop_batches(id),

    CONSTRAINT fk_lock_buyer
        FOREIGN KEY (buyer_id)
        REFERENCES users(id)
);

-- =========================
-- SHIPMENTS
-- =========================

CREATE TABLE shipments (
    id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL UNIQUE,

    logistics_user_id BIGINT NOT NULL,

    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,

    status VARCHAR(20) NOT NULL CHECK (
        status IN (
            'PENDING',
            'PICKED_UP',
            'IN_TRANSIT',
            'DELIVERED'
        )
    ),

    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,

    CONSTRAINT fk_shipment_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id),

    CONSTRAINT fk_shipment_logistics
        FOREIGN KEY (logistics_user_id)
        REFERENCES users(id)
);