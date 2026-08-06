-- Prerequisite: run migrate-phase2-3.sql first and take a fresh backup.
BEGIN;
-- Historical copy is a backfill, not a new domain action. Avoid emitting incomplete events
-- before order items have been copied; analytics has its own restartable backfill command.
SET LOCAL agriconnect.suppress_outbox = 'on';
SET LOCAL search_path TO order_schema,
    logistics_schema,
    crop_schema,
    core_schema,
    public;
-- Historical lock records become reservation history only. Quantities were already classified by phase 2 migration.
INSERT INTO crop_schema.inventory_reservations(
        id,
        request_id,
        order_reference,
        crop_batch_id,
        buyer_id,
        quantity,
        status,
        expires_at,
        created_at,
        updated_at
    )
SELECT md5('legacy-lock:' || cl.id)::uuid,
    md5('legacy-lock-request:' || cl.id)::uuid,
    'LEGACY-LOCK-' || cl.id,
    cl.batch_id,
    cl.buyer_id,
    cl.quantity,
    CASE
        cl.status
        WHEN 'ACTIVE' THEN 'RESERVED'
        WHEN 'CONVERTED' THEN 'COMMITTED'
        ELSE 'EXPIRED'
    END,
    cl.expired_at,
    cl.locked_at,
    cl.locked_at
FROM core_schema.crop_locks cl ON CONFLICT(id) DO NOTHING;
-- Each historical order item gets a stable committed reference. This records provenance and does not update stock.
INSERT INTO crop_schema.inventory_reservations(
        id,
        request_id,
        order_reference,
        crop_batch_id,
        buyer_id,
        quantity,
        status,
        expires_at,
        created_at,
        updated_at
    )
SELECT md5('legacy-order-item:' || oi.id)::uuid,
    md5('legacy-order-item-request:' || oi.id)::uuid,
    'LEGACY-ORDER-' || o.id,
    oi.batch_id,
    o.buyer_id,
    oi.quantity,
    'COMMITTED',
    COALESCE(o.order_date, o.created_at) + interval '100 years',
    COALESCE(o.created_at, o.order_date),
    COALESCE(o.created_at, o.order_date)
FROM core_schema.order_items oi
    JOIN core_schema.orders o ON o.id = oi.order_id ON CONFLICT(id) DO NOTHING;
INSERT INTO order_schema.orders(
        id,
        buyer_id,
        total_amount,
        status,
        delivery_address,
        order_date,
        created_at
    )
SELECT o.id,
    o.buyer_id,
    o.total_amount,
    o.status,
    s.delivery_address,
    o.order_date,
    o.created_at
FROM core_schema.orders o
    LEFT JOIN core_schema.shipments s ON s.order_id = o.id ON CONFLICT(id) DO NOTHING;
INSERT INTO order_schema.order_items(
        id,
        order_id,
        batch_id,
        farmer_id,
        inventory_reservation_id,
        quantity,
        unit_price,
        subtotal
    )
SELECT oi.id,
    oi.order_id,
    oi.batch_id,
    cb.farmer_id,
    md5('legacy-order-item:' || oi.id)::uuid,
    oi.quantity,
    oi.unit_price,
    oi.subtotal
FROM core_schema.order_items oi
    JOIN core_schema.crop_batches cb ON cb.id = oi.batch_id ON CONFLICT(id) DO NOTHING;
INSERT INTO order_schema.crop_locks(
        id,
        inventory_reservation_id,
        batch_id,
        buyer_id,
        quantity,
        status,
        locked_at,
        expired_at
    )
SELECT id,
    md5('legacy-lock:' || id)::uuid,
    batch_id,
    buyer_id,
    quantity,
    status,
    locked_at,
    expired_at
FROM core_schema.crop_locks ON CONFLICT(id) DO NOTHING;
INSERT INTO logistics_schema.shipments(
        id,
        order_id,
        buyer_id,
        farmer_ids,
        logistics_user_id,
        pickup_address,
        delivery_address,
        status,
        shipped_at,
        delivered_at
    )
SELECT s.id,
    s.order_id,
    o.buyer_id,
    string_agg(DISTINCT cb.farmer_id::text, ','),
    s.logistics_user_id,
    s.pickup_address,
    s.delivery_address,
    s.status,
    s.shipped_at,
    s.delivered_at
FROM core_schema.shipments s
    JOIN core_schema.orders o ON o.id = s.order_id
    LEFT JOIN core_schema.order_items oi ON oi.order_id = o.id
    LEFT JOIN core_schema.crop_batches cb ON cb.id = oi.batch_id
GROUP BY s.id,
    o.buyer_id ON CONFLICT(order_id) DO NOTHING;
SELECT setval(
        'order_schema.orders_id_seq',
        COALESCE(
            (
                SELECT max(id)
                FROM order_schema.orders
            ),
            1
        ),
        true
    );
SELECT setval(
        'order_schema.order_items_id_seq',
        COALESCE(
            (
                SELECT max(id)
                FROM order_schema.order_items
            ),
            1
        ),
        true
    );
SELECT setval(
        'order_schema.crop_locks_id_seq',
        COALESCE(
            (
                SELECT max(id)
                FROM order_schema.crop_locks
            ),
            1
        ),
        true
    );
SELECT setval(
        'logistics_schema.shipments_id_seq',
        COALESCE(
            (
                SELECT max(id)
                FROM logistics_schema.shipments
            ),
            1
        ),
        true
    );
COMMIT;
SELECT 'orders' entity,
(
        SELECT count(*)
        FROM core_schema.orders
    ) source_count,
(
        SELECT count(*)
        FROM order_schema.orders
    ) target_count
UNION ALL
SELECT 'order_items',
(
        SELECT count(*)
        FROM core_schema.order_items
    ),
(
        SELECT count(*)
        FROM order_schema.order_items
    )
UNION ALL
SELECT 'crop_locks',
(
        SELECT count(*)
        FROM core_schema.crop_locks
    ),
(
        SELECT count(*)
        FROM order_schema.crop_locks
    )
UNION ALL
SELECT 'shipments',
(
        SELECT count(*)
        FROM core_schema.shipments
    ),
(
        SELECT count(*)
        FROM logistics_schema.shipments
    );