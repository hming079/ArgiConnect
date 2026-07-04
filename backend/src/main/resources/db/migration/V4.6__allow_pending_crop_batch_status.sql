ALTER TABLE crop_batches
DROP CONSTRAINT IF EXISTS crop_batches_status_check;

ALTER TABLE crop_batches
ADD CONSTRAINT crop_batches_status_check
CHECK (status IN ('pending', 'available', 'sold_out', 'expired', 'cancelled'));
