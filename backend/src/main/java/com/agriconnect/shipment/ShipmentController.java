package com.agriconnect.shipment;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/shipments")
@SecurityRequirement(name = "bearerAuth")
public class ShipmentController {
    private final ShipmentService service;

    public ShipmentController(ShipmentService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Shipment>> getAll(
            @RequestParam(required = false) Long logisticsUserId,
            @RequestParam(required = false) ShipmentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.getAll(logisticsUserId, status, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Shipment> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getAccessibleById(id));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Shipment> getByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(service.getByOrderId(orderId));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List visible shipments", description = "All roles see shipments related to their orders; admin sees all; logistics sees assigned shipments")
    public ResponseEntity<Page<Shipment>> getMyShipments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(service.getMyShipments(page, size));
    }

    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Shipment>> getMyShipments() {
        return ResponseEntity.ok(service.getMyShipments(0, 20));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Shipment> create(@RequestBody Shipment shipment) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(shipment));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Shipment> update(@PathVariable Long id, @RequestBody Shipment shipment) {
        return ResponseEntity.ok(service.update(id, shipment));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update shipment status", description = "Allowed by workflow role and order ownership")
    public ResponseEntity<Shipment> updateStatus(
            @PathVariable Long id, @RequestParam ShipmentStatus status) {
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
