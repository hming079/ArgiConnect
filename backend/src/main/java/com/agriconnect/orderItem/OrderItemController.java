package com.agriconnect.orderItem;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/order-items")
public class OrderItemController {
    private final OrderItemService service;

    public OrderItemController(OrderItemService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<OrderItem>> getAll(
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) Long batchId) {
        return ResponseEntity.ok(service.getAll(orderId, batchId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderItem> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<OrderItem> create(@RequestBody OrderItem item) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderItem> update(@PathVariable Long id, @RequestBody OrderItem item) {
        return ResponseEntity.ok(service.update(id, item));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
