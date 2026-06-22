package com.agriconnect.order;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;

import com.agriconnect.common.ResourceNotFoundException;
import com.agriconnect.security.CurrentUser;
import com.agriconnect.user.Role;

@Service
public class OrderService {
    private final OrderRepository repository;
    private final CurrentUser currentUser;

    public OrderService(OrderRepository repository, CurrentUser currentUser) {
        this.repository = repository;
        this.currentUser = currentUser;
    }

    public List<Order> getAll(Long buyerId, OrderStatus status) {
        if (buyerId != null) return repository.findByBuyerId(buyerId);
        if (status != null) return repository.findByStatus(status);
        return repository.findAll();
    }

    public Order getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    public List<Order> getMyOrders() {
        return repository.findByBuyerId(currentUser.getId());
    }

    public Order getAccessibleById(Long id) {
        Order order = getById(id);
        if (currentUser.getRole() != Role.ADMIN && !order.getBuyerId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Buyers can only access their own orders");
        }
        return order;
    }

    public Order create(Order order) {
        order.setId(null);
        order.setBuyerId(currentUser.getId());
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
