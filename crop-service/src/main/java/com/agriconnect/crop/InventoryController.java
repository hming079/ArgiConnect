package com.agriconnect.crop;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/inventory/reservations")
class InventoryController {
    private final InventoryService s;
    private final String key;

    InventoryController(InventoryService s, @Value("${internal.api-key}") String k) {
        this.s = s;
        key = k;
    }

    private void auth(String k) {
        if (!java.security.MessageDigest.isEqual(k.getBytes(), key.getBytes()))
            throw new DomainException(org.springframework.http.HttpStatus.FORBIDDEN, "INVALID_INTERNAL_KEY",
                    "Invalid internal API key");
    }

    @PostMapping
    Map<String, Object> reserve(@RequestHeader("X-Internal-Api-Key") String k, @RequestBody ReservationRequest r) {
        auth(k);
        return s.reserve(r);
    }

    @PostMapping("/{id}/commit")
    Map<String, Object> commit(@RequestHeader("X-Internal-Api-Key") String k, @PathVariable UUID id) {
        auth(k);
        return s.transition(id, "COMMITTED");
    }

    @PostMapping("/{id}/release")
    Map<String, Object> release(@RequestHeader("X-Internal-Api-Key") String k, @PathVariable UUID id) {
        auth(k);
        return s.transition(id, "RELEASED");
    }

    @GetMapping("/{id}")
    Map<String, Object> get(@RequestHeader("X-Internal-Api-Key") String k, @PathVariable UUID id) {
        auth(k);
        return s.get(id);
    }
}
