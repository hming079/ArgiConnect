package com.agriconnect.shipment;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {
    private final ShipmentService service;

    public ShipmentController(ShipmentService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<Shipment>> getAll(
            @RequestParam(required = false) Long logisticsUserId,
            @RequestParam(required = false) ShipmentStatus status) {
        return ResponseEntity.ok(service.getAll(logisticsUserId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shipment> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<Shipment> getByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(service.getByOrderId(orderId));
    }

    @PostMapping
    public ResponseEntity<Shipment> create(@RequestBody Shipment shipment) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(shipment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Shipment> update(@PathVariable Long id, @RequestBody Shipment shipment) {
        return ResponseEntity.ok(service.update(id, shipment));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Shipment> updateStatus(
            @PathVariable Long id, @RequestParam ShipmentStatus status) {
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
