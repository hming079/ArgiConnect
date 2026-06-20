-- =========================
-- CROPS
-- =========================

INSERT INTO crops(name, description, storage_days, default_unit)
VALUES
('Dưa hấu', 'Dưa hấu Bình Định', 10, 'kg'),
('Thanh long', 'Thanh long ruột đỏ', 14, 'kg'),
('Xoài', 'Xoài cát Hòa Lộc', 12, 'kg'),
('Bắp cải', 'Bắp cải Đà Lạt', 20, 'kg');

-- =========================
-- CROP_BATCHES
-- =========================

INSERT INTO crop_batches(
crop_id,
farmer_id,
quantity,
unit,
harvest_date,
expiry_date,
province,
district,
location,
status
)
VALUES
(1, 3, 5000, 'kg', '2026-06-10', '2026-06-20',
'Bình Định', 'Tây Sơn',
'Thôn Phú An, Tây Sơn', 'READY_FOR_RESCUE'),

(2, 4, 2500, 'kg', '2026-06-12', '2026-06-26',
'Gia Lai', 'Chư Sê',
'Nông trại Hoa Farm', 'AT_FARM'),

(3, 3, 1800, 'kg', '2026-06-14', '2026-06-26',
'Phú Yên', 'Tuy An',
'Trang trại Tám Agri', 'SORTING'),

(4, 4, 3200, 'kg', '2026-06-08', '2026-06-28',
'Lâm Đồng', 'Đơn Dương',
'Khu rau sạch Đơn Dương', 'READY_FOR_RESCUE');

-- =========================
-- RESCUE_POINTS
-- =========================

INSERT INTO rescue_points(
name,
province,
address,
status
)
VALUES
(
'Điểm Giải Cứu Quy Nhơn',
'Bình Định',
'123 Nguyễn Tất Thành, Quy Nhơn',
'ACTIVE'
),
(
'Điểm Giải Cứu Pleiku',
'Gia Lai',
'45 Hùng Vương, Pleiku',
'ACTIVE'
),
(
'Kho Trung Chuyển Đà Lạt',
'Lâm Đồng',
'12 Trần Phú, Đà Lạt',
'ACTIVE'
);

-- =========================
-- RESCUE_REGISTRATIONS
-- =========================

INSERT INTO rescue_registrations(
batch_id,
rescue_point_id,
approved_by,
status,
approved_at
)
VALUES
(
1,
1,
1,
'APPROVED',
CURRENT_TIMESTAMP
),
(
4,
3,
2,
'APPROVED',
CURRENT_TIMESTAMP
),
(
2,
2,
NULL,
'PENDING',
NULL
);

-- =========================
-- ORDERS
-- =========================

INSERT INTO orders(
buyer_id,
total_amount,
status
)
VALUES
(
6,
12000000,
'PAID'
),
(
6,
4500000,
'PENDING'
);

-- =========================
-- ORDER_ITEMS
-- =========================

INSERT INTO order_items(
order_id,
batch_id,
quantity,
unit_price,
subtotal
)
VALUES
(
1,
1,
1000,
12000,
12000000
),
(
2,
4,
300,
15000,
4500000
);

-- =========================
-- CROP_LOCKS
-- =========================

INSERT INTO crop_locks(
batch_id,
buyer_id,
quantity,
status,
expired_at
)
VALUES
(
4,
6,
500,
'ACTIVE',
CURRENT_TIMESTAMP + INTERVAL '15 minutes'
);

-- =========================
-- SHIPMENTS
-- =========================

INSERT INTO shipments(
order_id,
logistics_user_id,
pickup_address,
delivery_address,
status,
shipped_at
)
VALUES
(
1,
8,
'Thôn Phú An, Tây Sơn, Bình Định',
'15 Nguyễn Huệ, TP.HCM',
'IN_TRANSIT',
CURRENT_TIMESTAMP
);
