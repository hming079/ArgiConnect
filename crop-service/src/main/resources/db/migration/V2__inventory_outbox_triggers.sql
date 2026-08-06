CREATE OR REPLACE FUNCTION inventory_outbox() RETURNS trigger AS $$
DECLARE eid uuid := gen_random_uuid();
et text;
rk text;
BEGIN et :=CASE
    WHEN TG_OP = 'INSERT' THEN 'InventoryReserved'
    WHEN NEW.status = 'COMMITTED' THEN 'InventoryCommitted'
    WHEN NEW.status = 'EXPIRED' THEN 'InventoryReservationExpired'
    ELSE 'InventoryReleased'
END;
rk :=CASE
    et
    WHEN 'InventoryReserved' THEN 'inventory.reserved'
    WHEN 'InventoryCommitted' THEN 'inventory.committed'
    ELSE 'inventory.released'
END;
INSERT INTO outbox_events(
        id,
        aggregate_type,
        aggregate_id,
        event_type,
        event_version,
        payload,
        status,
        created_at
    )
VALUES(
        eid,
        'InventoryReservation',
        NEW.id::text,
        et,
        1,
        jsonb_build_object(
            'eventId',
            eid,
            'eventType',
            et,
            'eventVersion',
            1,
            'aggregateType',
            'InventoryReservation',
            'aggregateId',
            NEW.id::text,
            'occurredAt',
            now(),
            'traceId',
            gen_random_uuid(),
            'producer',
            'crop-service',
            'routingKey',
            rk,
            'payload',
            jsonb_build_object(
                'reservationId',
                NEW.id,
                'cropBatchId',
                NEW.crop_batch_id,
                'buyerId',
                NEW.buyer_id,
                'quantity',
                NEW.quantity,
                'status',
                NEW.status,
                'expiresAt',
                NEW.expires_at
            )
        ),
        'PENDING',
        now()
    );
RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_inventory_outbox
AFTER
INSERT
    OR
UPDATE OF status ON inventory_reservations FOR EACH ROW EXECUTE FUNCTION inventory_outbox();