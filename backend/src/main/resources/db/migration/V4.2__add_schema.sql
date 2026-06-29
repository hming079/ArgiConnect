-- MODIFY QUANTITY AND UNIT PRICE
ALTER TABLE crop_batches
RENAME COLUMN quantity TO initial_quantity;

ALTER TABLE crop_batches
ADD COLUMN current_quantity NUMERIC(12,2),
ADD COLUMN unit_price NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE crop_batches
SET current_quantity = initial_quantity;

ALTER TABLE crop_batches
ALTER COLUMN current_quantity SET NOT NULL;

ALTER TABLE crop_batches
ADD CONSTRAINT chk_crop_batch_quantity
CHECK (
    initial_quantity >= 0
    AND current_quantity >= 0
    AND current_quantity <= initial_quantity
);

ALTER TABLE crop_batches
ADD CONSTRAINT chk_crop_batch_unit_price
CHECK (unit_price >= 0);


-- MODIFY ADDRESS
-- Crop batches address
ALTER TABLE crop_batches
RENAME COLUMN location TO address_detail;

ALTER TABLE crop_batches
ADD COLUMN ward VARCHAR(100);

ALTER TABLE crop_batches
ALTER COLUMN province SET NOT NULL;

-- Rescue points address
ALTER TABLE rescue_points
RENAME COLUMN address TO address_detail;

ALTER TABLE rescue_points
ADD COLUMN district VARCHAR(100),
ADD COLUMN ward VARCHAR(100);