package com.agriconnect.notification;

import io.micrometer.core.instrument.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
class OperationalMetrics {
    private final JdbcClient db;

    OperationalMetrics(JdbcClient d, MeterRegistry registry) {
        db = d;
        Gauge.builder("agriconnect.notifications.unread", this,
                x -> x.count("select count(*) from notifications where read_at is null"))
                .tag("service", "notification-service").register(registry);
        Gauge.builder("agriconnect.notifications.processed_events", this,
                x -> x.count("select count(*) from processed_events")).tag("service", "notification-service")
                .register(registry);
    }

    double count(String sql) {
        try {
            return db.sql(sql).query(Long.class).single();
        } catch (Exception e) {
            return Double.NaN;
        }
    }
}
