package com.agriconnect.crop;

import io.micrometer.core.instrument.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
class OperationalMetrics {
    private final JdbcClient db;

    OperationalMetrics(JdbcClient d, MeterRegistry registry) {
        db = d;
        Gauge.builder("agriconnect.outbox.unpublished", this,
                x -> x.count("select count(*) from outbox_events where status='PENDING'"))
                .tag("service", "crop-service").register(registry);
        Gauge.builder("agriconnect.inventory.reservations.active", this,
                x -> x.count("select count(*) from inventory_reservations where status='RESERVED'"))
                .tag("service", "crop-service").register(registry);
        Gauge.builder("agriconnect.inventory.reservations.expired", this,
                x -> x.count("select count(*) from inventory_reservations where status='EXPIRED'"))
                .tag("service", "crop-service").register(registry);
    }

    double count(String sql) {
        try {
            return db.sql(sql).query(Long.class).single();
        } catch (Exception e) {
            return Double.NaN;
        }
    }
}
