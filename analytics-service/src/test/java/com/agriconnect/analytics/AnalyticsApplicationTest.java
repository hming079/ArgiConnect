package com.agriconnect.analytics;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "jwt.secret=Y2hhbmdlLW1lLXRvLWEtMzItYnl0ZS1taW5pbXVtLXNlY3JldA==",
        "internal.api-key=test-internal-key",
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:analytics;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.rabbitmq.listener.simple.auto-startup=false"
})
class AnalyticsApplicationTest {
    @Test void contextLoads() {}
}
