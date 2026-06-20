package com.agriconnect.rescueRegistration;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rescue-registrations")
public class RescueRegistrationController {

    private final RescueRegistrationService service;

    public RescueRegistrationController(RescueRegistrationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<RescueRegistration>> getAll(
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) Long rescuePointId,
            @RequestParam(required = false) RescueRegistrationStatus status) {
        return ResponseEntity.ok(service.getAll(batchId, rescuePointId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RescueRegistration> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<RescueRegistration> create(@RequestBody RescueRegistration registration) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(registration));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RescueRegistration> update(
            @PathVariable Long id, @RequestBody RescueRegistration registration) {
        return ResponseEntity.ok(service.update(id, registration));
    }

    @PatchMapping("/{id}/review")
    public ResponseEntity<RescueRegistration> review(
            @PathVariable Long id,
            @RequestParam RescueRegistrationStatus status,
            @RequestParam Long approvedBy) {
        return ResponseEntity.ok(service.review(id, status, approvedBy));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
