package com.agriconnect.order;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private final OrderRepository repository;

    public OrderService(OrderRepository repository) { this.repository = repository; }

    public List<Order> getAll(Long buyerId, OrderStatus status) {
        if (buyerId != null) return repository.findByBuyerId(buyerId);
        if (status != null) return repository.findByStatus(status);
        return repository.findAll();
    }

    public Order getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    public Order create(Order order) {
        order.setId(null);
        return repository.save(order);
    }

    public Order update(Long id, Order request) {
        Order order = getById(id);
        order.setBuyerId(request.getBuyerId());
        order.setTotalAmount(request.getTotalAmount());
        order.setStatus(request.getStatus());
        order.setOrderDate(request.getOrderDate());
        return repository.save(order);
    }

    public void delete(Long id) { repository.delete(getById(id)); }
}
