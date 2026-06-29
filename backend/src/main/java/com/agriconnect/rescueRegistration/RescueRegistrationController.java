package com.agriconnect.rescueRegistration;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@SecurityRequirement(name = "bearerAuth")
public class RescueRegistrationController {

    private final RescueRegistrationService service;

    public RescueRegistrationController(RescueRegistrationService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RescueRegistration>> getAll(
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) Long rescuePointId,
            @RequestParam(required = false) RescueRegistrationStatus status) {
        return ResponseEntity.ok(service.getVisibleRegistrations(batchId, rescuePointId, status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RescueRegistration> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('FARMER')")
    @Operation(summary = "List my rescue registrations", description = "Required role: FARMER")
    public ResponseEntity<List<RescueRegistration>> getMyRegistrations() {
        return ResponseEntity.ok(service.getMyRegistrations());
    }

    @PostMapping
    @PreAuthorize("hasRole('FARMER')")
    @Operation(summary = "Register a crop batch for rescue", description = "Required role: FARMER; batch ownership is enforced")
    public ResponseEntity<RescueRegistration> create(@RequestBody RescueRegistration registration) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(registration));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RescueRegistration> update(
            @PathVariable Long id, @RequestBody RescueRegistration registration) {
        return ResponseEntity.ok(service.update(id, registration));
    }

    @PutMapping("/my/{id}")
    @PreAuthorize("hasRole('FARMER')")
    @Operation(summary = "Update my pending rescue registration", description = "Required role: FARMER; ownership is enforced")
    public ResponseEntity<RescueRegistration> updateMy(
            @PathVariable Long id, @RequestBody RescueRegistration registration) {
        return ResponseEntity.ok(service.updateMy(id, registration));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve rescue registration", description = "Required role: ADMIN")
    public ResponseEntity<RescueRegistration> approve(@PathVariable Long id) {
        return ResponseEntity.ok(service.review(id, RescueRegistrationStatus.APPROVED));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject rescue registration", description = "Required role: ADMIN")
    public ResponseEntity<RescueRegistration> reject(@PathVariable Long id) {
        return ResponseEntity.ok(service.review(id, RescueRegistrationStatus.REJECTED));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/my/{id}")
    @PreAuthorize("hasRole('FARMER')")
    @Operation(summary = "Cancel my pending rescue registration", description = "Required role: FARMER; ownership is enforced")
    public ResponseEntity<Void> deleteMy(@PathVariable Long id) {
        service.deleteMy(id);
        return ResponseEntity.noContent().build();
    }
}
