package com.agriconnect.orderItem;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class OrderItemService {
    private final OrderItemRepository repository;

    public OrderItemService(OrderItemRepository repository) { this.repository = repository; }

    public List<OrderItem> getAll(Long orderId, Long batchId) {
        if (orderId != null) return repository.findByOrderId(orderId);
        if (batchId != null) return repository.findByBatchId(batchId);
        return repository.findAll();
    }

    public OrderItem getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order item not found with id: " + id));
    }

    public OrderItem create(OrderItem item) {
        item.setId(null);
        return repository.save(item);
    }

    public OrderItem update(Long id, OrderItem request) {
        OrderItem item = getById(id);
        item.setOrderId(request.getOrderId());
        item.setBatchId(request.getBatchId());
        item.setQuantity(request.getQuantity());
        item.setUnitPrice(request.getUnitPrice());
        return repository.save(item);
    }

    public void delete(Long id) { repository.delete(getById(id)); }
}
