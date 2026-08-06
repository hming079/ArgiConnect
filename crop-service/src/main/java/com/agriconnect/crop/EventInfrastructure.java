package com.agriconnect.crop;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.*;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Configuration
class EventConfig {
    @Bean
    TopicExchange events(@Value("${events.exchange}") String n) {
        return new TopicExchange(n, true, false);
    }
}

@Component
class Outbox {
    private final JdbcClient db;
    private final ObjectMapper json;
    private final RabbitTemplate rabbit;
    private final String exchange;

    Outbox(JdbcClient d, ObjectMapper j, RabbitTemplate r, @Value("${events.exchange}") String e) {
        db = d;
        json = j;
        rabbit = r;
        exchange = e;
    }

    void add(String aggregate, String id, String type, String routing, Object payload) {
        try {
            Map<String, Object> envelope = new LinkedHashMap<>();
            envelope.put("eventId", UUID.randomUUID());
            envelope.put("eventType", type);
            envelope.put("eventVersion", 1);
            envelope.put("aggregateType", aggregate);
            envelope.put("aggregateId", id);
            envelope.put("occurredAt", Instant.now());
            envelope.put("traceId", Trace.id());
            envelope.put("producer", "crop-service");
            envelope.put("routingKey", routing);
            envelope.put("payload", payload);
            String value = json.writeValueAsString(envelope);
            db.sql("insert into outbox_events(id,aggregate_type,aggregate_id,event_type,event_version,payload,status,created_at)values(:id,:a,:g,:t,1,cast(:p as jsonb),'PENDING',now())")
                    .param("id", envelope.get("eventId")).param("a", aggregate).param("g", id).param("t", type)
                    .param("p", value).update();
        } catch (Exception e) {
            throw new IllegalStateException("Cannot save outbox event", e);
        }
    }

    @Scheduled(fixedDelayString = "${outbox.publish-delay-ms:1000}")
    @Transactional
    void publish() {
        for (Map<String, Object> x : db.sql(
                "select id,payload::text payload from outbox_events where status='PENDING' order by created_at for update skip locked limit 50")
                .query().listOfRows())
            try {
                Map<?, ?> e = json.readValue(String.valueOf(x.get("payload")), Map.class);
                rabbit.convertAndSend(exchange, String.valueOf(e.get("routingKey")), e);
                db.sql("update outbox_events set status='PUBLISHED',published_at=now()where id=:id")
                        .param("id", x.get("id")).update();
            } catch (Exception ex) {
                db.sql("update outbox_events set attempts=attempts+1,last_error=:e,status=case when attempts>=4 then 'FAILED' else 'PENDING' end where id=:id")
                        .param("e", ex.getMessage()).param("id", x.get("id")).update();
            }
    }
}

class Trace {
    static String id() {
        String x = org.slf4j.MDC.get("traceId");
        return x == null ? UUID.randomUUID().toString() : x;
    }
}
