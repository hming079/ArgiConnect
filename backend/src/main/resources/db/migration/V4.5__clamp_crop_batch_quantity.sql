UPDATE crop_batches
SET current_quantity = initial_quantity
WHERE current_quantity > initial_quantity;

UPDATE crop_batches
SET current_quantity = 0
WHERE current_quantity < 0;
