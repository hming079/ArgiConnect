CREATE OR REPLACE FUNCTION order_schema.order_outbox() RETURNS trigger AS $$
DECLARE
    eid uuid := gen_random_uuid();
    et text;
    rk text;
    farmers text;
BEGIN
    IF current_setting('agriconnect.suppress_outbox', true) = 'on' THEN
        RETURN NEW;
    END IF;

    et := CASE
        WHEN TG_OP = 'INSERT' THEN 'OrderCreated'
        WHEN NEW.status = 'CONFIRMED' THEN 'OrderConfirmed'
        WHEN NEW.status = 'PACKING' THEN 'OrderPackingStarted'
        WHEN NEW.status = 'SHIPPING' THEN 'OrderShippingStarted'
        WHEN NEW.status = 'DELIVERED' THEN 'OrderDelivered'
        ELSE 'OrderCancelled'
    END;
    rk := CASE NEW.status
        WHEN 'CONFIRMED' THEN 'order.confirmed'
        WHEN 'CANCELLED' THEN 'order.cancelled'
        ELSE 'order.' || lower(NEW.status)
    END;

    SELECT string_agg(DISTINCT oi.farmer_id::text, ',')
      INTO farmers
      FROM order_schema.order_items oi
     WHERE oi.order_id = NEW.id;

    INSERT INTO order_schema.outbox_events
        (id, aggregate_type, aggregate_id, event_type, event_version, payload, status, created_at)
    VALUES (
        eid, 'Order', NEW.id::text, et, 1,
        jsonb_build_object(
            'eventId', eid, 'eventType', et, 'eventVersion', 1,
            'aggregateType', 'Order', 'aggregateId', NEW.id::text,
            'occurredAt', now(), 'traceId', gen_random_uuid(),
            'producer', 'order-service', 'routingKey', rk,
            'payload', jsonb_build_object(
                'orderId', NEW.id, 'buyerId', NEW.buyer_id,
                'farmerIds', coalesce(farmers, ''),
                'deliveryAddress', NEW.delivery_address, 'status', NEW.status
            )
        ),
        'PENDING', now()
    );
    RETURN NEW;
END
$$ LANGUAGE plpgsql;
