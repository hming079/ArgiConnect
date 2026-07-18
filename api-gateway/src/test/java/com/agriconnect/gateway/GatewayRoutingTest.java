package com.agriconnect.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;

@SpringBootTest(properties = {
        "services.auth-url=http://auth-service:8081",
        "services.core-url=http://core-service:8082",
        "services.analytics-url=http://analytics-service:8083",
        "services.crop-url=http://crop-service:8084",
        "services.rescue-url=http://rescue-service:8085",
        "services.order-url=http://order-service:8086",
        "services.logistics-url=http://logistics-service:8087",
        "services.notification-url=http://notification-service:8088"
})
class GatewayRoutingTest {
    @Autowired RouteLocator routeLocator;

    @Test
    void routesEveryExtractedServiceToItsDockerName() {
        Map<String, URI> routes = routeLocator.getRoutes().collectList().block().stream()
                .collect(Collectors.toMap(Route::getId, Route::getUri));

        assertThat(routes).containsEntry("auth", URI.create("http://auth-service:8081"));
        assertThat(routes).containsEntry("crop", URI.create("http://crop-service:8084"));
        assertThat(routes).containsEntry("rescue", URI.create("http://rescue-service:8085"));
        assertThat(routes).containsEntry("order", URI.create("http://order-service:8086"));
        assertThat(routes).containsEntry("logistics", URI.create("http://logistics-service:8087"));
        assertThat(routes).containsEntry("analytics", URI.create("http://analytics-service:8083"));
        assertThat(routes).containsEntry("notification", URI.create("http://notification-service:8088"));
        assertThat(routes).containsEntry("core-compatibility", URI.create("http://core-service:8082"));
    }
}
