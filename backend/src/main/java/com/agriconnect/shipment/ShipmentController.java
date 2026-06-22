package com.agriconnect.shipment;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Shipment>> getAll(
            @RequestParam(required = false) Long logisticsUserId,
            @RequestParam(required = false) ShipmentStatus status) {
        return ResponseEntity.ok(service.getAll(logisticsUserId, status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Shipment> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Shipment> getByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(service.getByOrderId(orderId));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('LOGISTICS')")
    @Operation(summary = "List my shipments", description = "Required role: LOGISTICS")
    public ResponseEntity<List<Shipment>> getMyShipments() {
        return ResponseEntity.ok(service.getMyShipments());
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
    @PreAuthorize("hasRole('LOGISTICS')")
    @Operation(summary = "Update shipment status", description = "Required role: LOGISTICS; assignment is enforced")
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
