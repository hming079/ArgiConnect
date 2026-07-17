package com.agriconnect.gateway;

import java.net.URI;
import java.time.Instant;
import java.util.Map;
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

@Configuration
public class GatewayConfiguration {
    private static final Logger log = LoggerFactory.getLogger(GatewayConfiguration.class);

    @Bean
    RouteLocator routes(RouteLocatorBuilder builder,
            @Value("${services.auth-url}") String auth,
            @Value("${services.core-url}") String core,
            @Value("${services.analytics-url}") String analytics) {
        return builder.routes()
            .route("auth", r -> r.path("/api/auth/**", "/api/users/**").uri(auth))
            .route("analytics", r -> r.path("/api/dashboard/**", "/api/analytics/**", "/api/ai/**",
                    "/api/inventory-risk-forecast/**", "/api/forecast-results/**", "/api/forecasts/**", "/api/forecast-dataset/**").uri(analytics))
            .route("core", r -> r.path("/api/crops/**", "/api/batches/**", "/api/crop-batches/**",
                    "/api/rescue-registrations/**", "/api/rescue-points/**", "/api/crop-locks/**",
                    "/api/orders/**", "/api/order-items/**", "/api/shipments/**").uri(core))
            .build();
    }

    @Bean GlobalFilter requestLoggingFilter() {
        return (exchange, chain) -> {
            long started = System.currentTimeMillis();
            return chain.filter(exchange).doFinally(signal -> log.info("{} {} -> {} ({} ms)",
                    exchange.getRequest().getMethod(), exchange.getRequest().getURI().getPath(),
                    exchange.getResponse().getStatusCode(), System.currentTimeMillis() - started));
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
