package com.agriconnect.orderItem;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import com.agriconnect.common.BadRequestException;
import com.agriconnect.common.ResourceNotFoundException;
import com.agriconnect.cropBatch.CropBatchRepository;
import com.agriconnect.order.Order;
import com.agriconnect.order.OrderRepository;
import com.agriconnect.security.CurrentUser;
import com.agriconnect.user.Role;

@Service
public class OrderItemService {
    private final OrderItemRepository repository;
    private final OrderRepository orderRepository;
    private final CropBatchRepository cropBatchRepository;
    private final CurrentUser currentUser;

    public OrderItemService(
            OrderItemRepository repository,
            OrderRepository orderRepository,
            CropBatchRepository cropBatchRepository,
            CurrentUser currentUser) {
        this.repository = repository;
        this.orderRepository = orderRepository;
        this.cropBatchRepository = cropBatchRepository;
        this.currentUser = currentUser;
    }

    public List<OrderItem> getAll(Long orderId, Long batchId) {
        List<OrderItem> visibleItems = switch (currentUser.getRole()) {
            case ADMIN, LOGISTICS -> repository.findAll();
            case BUYER -> repository.findVisibleForBuyer(currentUser.getId());
            case FARMER -> repository.findVisibleForFarmer(currentUser.getId());
        };

        return visibleItems.stream()
                .filter(item -> orderId == null || orderId.equals(item.getOrderId()))
                .filter(item -> batchId == null || batchId.equals(item.getBatchId()))
                .toList();
    }

    public OrderItem getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found with id: " + id));
    }

    @Transactional
    public OrderItem create(OrderItem item) {
        getWritableOrder(item.getOrderId());
        assertBatchExists(item.getBatchId());
        assertValidQuantity(item.getQuantity());
        item.setId(null);
        return repository.save(item);
    }

    @Transactional
    public OrderItem update(Long id, OrderItem request) {
        OrderItem item = getById(id);
        getWritableOrder(item.getOrderId());
        getWritableOrder(request.getOrderId());
        assertBatchExists(request.getBatchId());
        assertValidQuantity(request.getQuantity());

        item.setOrderId(request.getOrderId());
        item.setBatchId(request.getBatchId());
        item.setQuantity(request.getQuantity());
        item.setUnitPrice(request.getUnitPrice());
        return repository.save(item);
    }

    @Transactional
    public void delete(Long id) {
        OrderItem item = getById(id);
        getWritableOrder(item.getOrderId());
        repository.delete(item);
    }

    private Order getWritableOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        if (currentUser.getRole() != Role.ADMIN && !order.getBuyerId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Buyers can only modify items for their own orders");
        }
        return order;
    }

    private boolean isVisible(OrderItem item) {
        Role role = currentUser.getRole();
        if (role == Role.ADMIN || role == Role.LOGISTICS) return true;
        if (role == Role.BUYER) {
            return orderRepository.findById(item.getOrderId())
                    .map(order -> order.getBuyerId().equals(currentUser.getId()))
                    .orElse(false);
        }
        if (role == Role.FARMER) {
            return cropBatchRepository.findById(item.getBatchId())
                    .map(batch -> batch.getFarmerId().equals(currentUser.getId()))
                    .orElse(false);
        }
        return false;
    }

    private void assertBatchExists(Long batchId) {
        if (batchId == null || !cropBatchRepository.existsById(batchId)) {
            throw new ResourceNotFoundException("Crop batch not found with id: " + batchId);
        }
    }

    private void assertValidQuantity(BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Order item quantity must be greater than zero");
        }
    }

}
