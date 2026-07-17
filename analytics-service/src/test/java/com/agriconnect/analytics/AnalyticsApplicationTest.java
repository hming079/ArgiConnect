package com.agriconnect.analytics;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "jwt.secret=Y2hhbmdlLW1lLXRvLWEtMzItYnl0ZS1taW5pbXVtLXNlY3JldA==",
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:postgresql://localhost:1/unavailable",
        "spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,org.springframework.boot.flyway.autoconfigure.FlywayAutoConfiguration"
})
class AnalyticsApplicationTest {
    @Test void contextLoads() {}
}
