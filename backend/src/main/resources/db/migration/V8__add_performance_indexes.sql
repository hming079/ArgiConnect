CREATE INDEX IF NOT EXISTS idx_crop_batches_crop_id ON crop_batches (crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_batches_farmer_id ON crop_batches (farmer_id);
CREATE INDEX IF NOT EXISTS idx_crop_batches_status ON crop_batches (status);
CREATE INDEX IF NOT EXISTS idx_crop_batches_province ON crop_batches (province);
CREATE INDEX IF NOT EXISTS idx_crop_batches_expiry_date ON crop_batches (expiry_date);
CREATE INDEX IF NOT EXISTS idx_crop_batches_crop_status ON crop_batches (crop_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders (order_date);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_batch_id ON order_items (batch_id);

CREATE INDEX IF NOT EXISTS idx_rescue_registrations_batch_id ON rescue_registrations (batch_id);
CREATE INDEX IF NOT EXISTS idx_rescue_registrations_rescue_point_id ON rescue_registrations (rescue_point_id);
CREATE INDEX IF NOT EXISTS idx_rescue_registrations_status ON rescue_registrations (status);
CREATE INDEX IF NOT EXISTS idx_rescue_registrations_approved_by ON rescue_registrations (approved_by);

CREATE INDEX IF NOT EXISTS idx_shipments_logistics_user_id ON shipments (logistics_user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments (status);
CREATE INDEX IF NOT EXISTS idx_shipments_order_status ON shipments (order_id, status);
