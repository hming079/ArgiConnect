package com.agriconnect.order;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import com.agriconnect.order.dto.CheckoutRequest;
import com.agriconnect.order.dto.CreateOrderRequest;
import com.agriconnect.order.dto.OrderStatusUpdateRequest;

@RestController
@RequestMapping("/api/orders")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {
    private final OrderService service;

    public OrderController(OrderService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Order>> getAll(
            @RequestParam(required = false) Long buyerId,
            @RequestParam(required = false) OrderStatus status) {
        return ResponseEntity.ok(service.getAll(buyerId, status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('BUYER', 'ADMIN')")
    public ResponseEntity<Order> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getAccessibleById(id));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('BUYER')")
    @Operation(summary = "List my orders", description = "Required role: BUYER")
    public ResponseEntity<List<Order>> getMyOrders() {
        return ResponseEntity.ok(service.getMyOrders());
    }

    @PostMapping
    @PreAuthorize("hasRole('BUYER')")
    @Operation(summary = "Create order", description = "Required role: BUYER; buyerId comes from JWT identity")
    public ResponseEntity<Order> create(@RequestBody CreateOrderRequest request) {
        Order order = new Order();
        if (request != null) {
            order.setTotalAmount(request.getTotalAmount());
            order.setOrderDate(request.getOrderDate());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(order));
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('BUYER')")
    @Operation(summary = "Checkout order", description = "Creates an order and subtracts purchased quantities from crop batches")
    public ResponseEntity<Order> checkout(@RequestBody CheckoutRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.checkout(request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Update order status",
            description = "Allowed transitions: PENDING->CONFIRMED/CANCELLED, CONFIRMED->PACKING/CANCELLED, PACKING->SHIPPING, SHIPPING->DELIVERED. Role rules: CONFIRMED ADMIN/FARMER, PACKING FARMER/LOGISTICS, SHIPPING/DELIVERED LOGISTICS, CANCELLED BUYER/ADMIN.")
    public ResponseEntity<Order> updateStatus(
            @PathVariable Long id,
            @RequestBody OrderStatusUpdateRequest request) {
        return ResponseEntity.ok(service.updateStatus(id, request == null ? null : request.getStatus()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update order details", description = "Admin-only. Order status is managed through PATCH /api/orders/{id}/status")
    public ResponseEntity<Order> update(@PathVariable Long id, @RequestBody Order order) {
        return ResponseEntity.ok(service.update(id, order));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
