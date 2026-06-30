ALTER TABLE crop_batches
DROP CONSTRAINT IF EXISTS crop_batches_status_check;

UPDATE crop_batches
SET status = CASE
    WHEN status = 'SOLD_OUT' THEN 'sold_out'
    WHEN status = 'DELIVERED' THEN 'sold_out'
    WHEN status = 'EXPIRED' THEN 'expired'
    WHEN status = 'CANCELLED' THEN 'cancelled'
    ELSE 'available'
END;

ALTER TABLE crop_batches
ADD CONSTRAINT crop_batches_status_check
CHECK (status IN ('available', 'sold_out', 'expired', 'cancelled'));
