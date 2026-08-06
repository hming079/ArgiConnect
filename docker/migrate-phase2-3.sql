-- Run only after taking a database backup. This script is restartable and never deletes source rows.
BEGIN;
-- Trigger functions must resolve their schema-owned outbox even when psql's caller search path is public.
SET LOCAL search_path TO crop_schema,
    public;
INSERT INTO crop_schema.crops(
        id,
        name,
        description,
        storage_days,
        default_unit,
        created_at,
        updated_at
    )
SELECT id,
    name,
    description,
    storage_days,
    default_unit,
    created_at,
    updated_at
FROM core_schema.crops ON CONFLICT (id) DO NOTHING;
INSERT INTO crop_schema.crop_batches(
        id,
        crop_id,
        farmer_id,
        initial_quantity,
        available_quantity,
        reserved_quantity,
        sold_quantity,
        unit_price,
        unit,
        harvest_date,
        expiry_date,
        province,
        district,
        ward,
        address_detail,
        status,
        created_at,
        updated_at
    )
SELECT cb.id,
    cb.crop_id,
    cb.farmer_id,
    cb.initial_quantity,
    cb.current_quantity,
    LEAST(
        cb.initial_quantity - cb.current_quantity,
        COALESCE(l.active_quantity, 0)
    ),
    GREATEST(
        cb.initial_quantity - cb.current_quantity - COALESCE(l.active_quantity, 0),
        0
    ),
    cb.unit_price,
    cb.unit,
    cb.harvest_date,
    cb.expiry_date,
    cb.province,
    cb.district,
    cb.ward,
    cb.address_detail,
    cb.status,
    cb.created_at,
    cb.updated_at
FROM core_schema.crop_batches cb
    LEFT JOIN (
        SELECT batch_id,
            SUM(quantity) active_quantity
        FROM core_schema.crop_locks
        WHERE status = 'ACTIVE'
        GROUP BY batch_id
    ) l ON l.batch_id = cb.id ON CONFLICT (id) DO NOTHING;
INSERT INTO rescue_schema.rescue_points(
        id,
        name,
        province,
        district,
        ward,
        address_detail,
        status,
        created_at,
        updated_at
    )
SELECT id,
    name,
    province,
    district,
    ward,
    address_detail,
    status,
    created_at,
    updated_at
FROM core_schema.rescue_points ON CONFLICT (id) DO NOTHING;
INSERT INTO rescue_schema.rescue_registrations(
        id,
        crop_batch_id,
        farmer_id,
        rescue_point_id,
        admin_id,
        quantity_snapshot,
        status,
        submitted_at,
        reviewed_at
    )
SELECT rr.id,
    rr.batch_id,
    cb.farmer_id,
    rr.rescue_point_id,
    rr.approved_by,
    cb.current_quantity,
    rr.status,
    rr.submitted_at,
    rr.approved_at
FROM core_schema.rescue_registrations rr
    JOIN core_schema.crop_batches cb ON cb.id = rr.batch_id ON CONFLICT (id) DO NOTHING;
SELECT setval(
        'crop_schema.crops_id_seq',
        COALESCE(
            (
                SELECT max(id)
                FROM crop_schema.crops
            ),
            1
        ),
        true
    );
SELECT setval(
        'crop_schema.crop_batches_id_seq',
        COALESCE(
            (
                SELECT max(id)
                FROM crop_schema.crop_batches
            ),
            1
        ),
        true
    );
SELECT setval(
        'rescue_schema.rescue_points_id_seq',
        COALESCE(
            (
                SELECT max(id)
                FROM rescue_schema.rescue_points
            ),
            1
        ),
        true
    );
SELECT setval(
        'rescue_schema.rescue_registrations_id_seq',
        COALESCE(
            (
                SELECT max(id)
                FROM rescue_schema.rescue_registrations
            ),
            1
        ),
        true
    );
COMMIT;
SELECT 'crops' AS entity,
(
        SELECT count(*)
        FROM core_schema.crops
    ) AS source_count,
(
        SELECT count(*)
        FROM crop_schema.crops
    ) AS target_count
UNION ALL
SELECT 'crop_batches',
(
        SELECT count(*)
        FROM core_schema.crop_batches
    ),
(
        SELECT count(*)
        FROM crop_schema.crop_batches
    )
UNION ALL
SELECT 'rescue_points',
(
        SELECT count(*)
        FROM core_schema.rescue_points
    ),
(
        SELECT count(*)
        FROM rescue_schema.rescue_points
    )
UNION ALL
SELECT 'rescue_registrations',
(
        SELECT count(*)
        FROM core_schema.rescue_registrations
    ),
(
        SELECT count(*)
        FROM rescue_schema.rescue_registrations
    );