package com.agriconnect.crop;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
class UserDirectoryClient {
    private final RestClient client;
    private final String internalKey;

    UserDirectoryClient(@Value("${auth-service.url}") String authUrl,
                        @Value("${internal.api-key}") String internalKey) {
        this.client = RestClient.create(authUrl);
        this.internalKey = internalKey;
    }

    Map<Long, String> names(Collection<Long> ids) {
        if (ids.isEmpty()) return Map.of();
        try {
            return client.post().uri("/internal/users/names")
                    .header("X-Internal-Api-Key", internalKey)
                    .body(List.copyOf(ids))
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (RuntimeException ignored) {
            return Map.of();
        }
    }
}
