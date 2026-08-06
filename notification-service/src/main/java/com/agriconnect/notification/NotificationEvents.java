package com.agriconnect.notification;

import java.util.*;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Configuration
class NotificationEvents {
    @Bean
    TopicExchange events(@Value("${events.exchange}") String n) {
        return new TopicExchange(n, true, false);
    }

    @Bean
    org.springframework.amqp.core.Queue notificationDlq() {
        return QueueBuilder.durable("notification.events.dlq").build();
    }

    @Bean
    org.springframework.amqp.core.Queue notificationQueue() {
        return QueueBuilder.durable("notification.events").deadLetterExchange("")
                .deadLetterRoutingKey("notification.events.dlq").build();
    }

    @Bean
    Declarables notificationBindings(org.springframework.amqp.core.Queue notificationQueue, TopicExchange events) {
        return new Declarables(BindingBuilder.bind(notificationQueue).to(events).with("rescue.registration.#"),
                BindingBuilder.bind(notificationQueue).to(events).with("order.#"),
                BindingBuilder.bind(notificationQueue).to(events).with("shipment.#"),
                BindingBuilder.bind(notificationQueue).to(events).with("inventory.released"));
    }
}

@Component
class NotificationConsumer {
    private final JdbcClient db;

    NotificationConsumer(JdbcClient d) {
        db = d;
    }

    @RabbitListener(queues = "notification.events")
    @Transactional
    void consume(Map<String, Object> e) {
        UUID id = UUID.fromString(String.valueOf(e.get("eventId")));
        if (db.sql("select count(*) from processed_events where event_id=:id").param("id", id).query(Long.class)
                .single() > 0)
            return;
        Map<?, ?> p = (Map<?, ?>) e.get("payload");
        String type = String.valueOf(e.get("eventType"));
        Object recipient = p.get("buyerId");
        if (recipient == null)
            recipient = p.get("farmerId");
        if (recipient == null)
            recipient = p.get("recipientUserId");
        String aggregate = String.valueOf(e.get("aggregateType")), aggregateId = String.valueOf(e.get("aggregateId"));
        db.sql("insert into notifications(recipient_user_id,event_id,type,title,message,reference_type,reference_id)values(:u,:e,:t,:title,:m,:r,:id)")
                .param("u", recipient, java.sql.Types.BIGINT).param("e", id).param("t", type)
                .param("title", title(type)).param("m", "AgriConnect event: " + type).param("r", aggregate)
                .param("id", aggregateId).update();
        db.sql("insert into processed_events(event_id)values(:id)").param("id", id).update();
    }

    private String title(String t) {
        if (t.contains("Approved"))
            return "Đăng ký cứu hộ đã được duyệt";
        if (t.contains("Rejected"))
            return "Đăng ký cứu hộ bị từ chối";
        if (t.contains("Delivered"))
            return "Đơn hàng đã giao";
        if (t.contains("Shipping"))
            return "Đơn hàng đang vận chuyển";
        if (t.contains("Cancelled"))
            return "Đơn hàng đã hủy";
        if (t.contains("Expired"))
            return "Giữ hàng đã hết hạn";
        return "Cập nhật AgriConnect";
    }
}
