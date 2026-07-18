package com.agriconnect.gateway;

import java.net.URI;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;
import static org.springframework.web.reactive.function.server.RequestPredicates.path;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;
import com.fasterxml.jackson.databind.ObjectMapper;
import static org.springframework.cloud.gateway.support.RouteMetadataUtils.RESPONSE_TIMEOUT_ATTR;

@Configuration
public class GatewayConfiguration {
    private static final Logger log = LoggerFactory.getLogger(GatewayConfiguration.class);

    @Bean
    RouteLocator routes(RouteLocatorBuilder builder,
            @Value("${services.auth-url}") String auth,
            @Value("${services.core-url}") String core,
            @Value("${services.analytics-url}") String analytics,
            @Value("${services.crop-url}") String crop,
            @Value("${services.rescue-url}") String rescue,
            @Value("${services.order-url}") String order,
            @Value("${services.logistics-url}") String logistics,
            @Value("${services.notification-url}") String notification) {
        return builder.routes()
            .route("auth", r -> r.path("/api/auth/**", "/api/users/**").uri(auth))
            .route("batch-compatibility", r -> r.path("/api/batches/**")
                    .filters(f -> f.rewritePath("/api/batches(?<segment>/?.*)", "/api/crop-batches${segment}"))
                    .uri(crop))
            .route("crop", r -> r.path("/api/crops/**", "/api/crop-batches/**").uri(crop))
            .route("rescue", r -> r.path("/api/rescue-registrations/**", "/api/rescue-points/**").uri(rescue))
            .route("order", r -> r.path("/api/crop-locks/**", "/api/orders/**").uri(order))
            .route("logistics", r -> r.path("/api/shipments/**").uri(logistics))
            .route("notification", r -> r.path("/api/notifications/**").uri(notification))
            .route("analytics", r -> r.path("/api/dashboard/**", "/api/analytics/**", "/api/ai/**",
                    "/api/inventory-risk-forecast/**", "/api/forecast-results/**", "/api/forecasts/**", "/api/forecast-dataset/**")
                    .metadata(RESPONSE_TIMEOUT_ATTR, 120000L).uri(analytics))
            .route("core-compatibility", r -> r.path("/api/order-items/**", "/api/core-compatibility/**").uri(core))
            .build();
    }

    @Bean GlobalFilter requestLoggingFilter(MeterRegistry metrics) {
        return (exchange, chain) -> {
            long started = System.currentTimeMillis();
            String traceId = exchange.getRequest().getHeaders().getFirst("X-Trace-Id");
            if (traceId == null || traceId.isBlank()) traceId = UUID.randomUUID().toString();
            String finalTraceId = traceId;
            var request = exchange.getRequest().mutate().header("X-Trace-Id", traceId).build();
            exchange.getResponse().getHeaders().set("X-Trace-Id", traceId);
            return chain.filter(exchange.mutate().request(request).build()).doFinally(signal -> {
                long duration = System.currentTimeMillis() - started;
                String method = String.valueOf(exchange.getRequest().getMethod());
                String path = exchange.getRequest().getURI().getPath();
                String status = String.valueOf(exchange.getResponse().getStatusCode());
                metrics.counter("agriconnect.gateway.requests", "method", method, "status", status).increment();
                metrics.timer("agriconnect.gateway.duration", "method", method).record(duration, java.util.concurrent.TimeUnit.MILLISECONDS);
                log.info("{\"service\":\"api-gateway\",\"traceId\":\"{}\",\"endpoint\":\"{}\",\"status\":\"{}\",\"durationMs\":{}}",
                        finalTraceId, path, status, duration);
            });
        };
    }

    @Bean RouterFunction<ServerResponse> fallback(ObjectMapper mapper) {
        return route(path("/fallback/{service}"), request -> {
            String service = request.pathVariable("service");
            Map<String, Object> body = Map.of("timestamp", Instant.now().toString(), "status", 503,
                    "error", "Service Unavailable", "message", service + " service is currently unavailable",
                    "path", request.headers().firstHeader("X-Original-Path") == null ? request.path() : request.headers().firstHeader("X-Original-Path"));
            return ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE).contentType(MediaType.APPLICATION_JSON).bodyValue(body);
        });
    }
}
