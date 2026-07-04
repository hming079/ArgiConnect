package com.agriconnect.shipment;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;

import com.agriconnect.common.ResourceNotFoundException;
import com.agriconnect.cropBatch.CropBatchRepository;
import com.agriconnect.order.OrderRepository;
import com.agriconnect.order.OrderStatus;
import com.agriconnect.orderItem.OrderItemRepository;
import com.agriconnect.security.CurrentUser;
import com.agriconnect.user.Role;

@Service
public class ShipmentService {
    private final ShipmentRepository repository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CropBatchRepository cropBatchRepository;
    private final CurrentUser currentUser;

    public ShipmentService(
            ShipmentRepository repository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CropBatchRepository cropBatchRepository,
            CurrentUser currentUser) {
        this.repository = repository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cropBatchRepository = cropBatchRepository;
        this.currentUser = currentUser;
    }

    public List<Shipment> getAll(Long logisticsUserId, ShipmentStatus status) {
        List<Shipment> shipments = switch (currentUser.getRole()) {
            case ADMIN, LOGISTICS -> repository.findAll();
            case BUYER -> repository.findVisibleForBuyer(currentUser.getId());
            case FARMER -> repository.findVisibleForFarmer(currentUser.getId());
        };

        return shipments.stream()
                .filter(shipment -> logisticsUserId == null || logisticsUserId.equals(shipment.getLogisticsUserId()))
                .filter(shipment -> status == null || status == shipment.getStatus())
                .toList();
    }

    public Shipment getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with id: " + id));
    }

    public Shipment getAccessibleById(Long id) {
        Shipment shipment = getById(id);
        assertVisible(shipment);
        return shipment;
    }

    public Shipment getByOrderId(Long orderId) {
        Shipment shipment = repository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found for order: " + orderId));
        assertVisible(shipment);
        return shipment;
    }

    public List<Shipment> getMyShipments() {
        return getAll(null, null);
    }

    public Shipment create(Shipment shipment) {
        shipment.setId(null);
        shipment.setStatus(ShipmentStatus.PENDING);
        shipment.setShippedAt(null);
        shipment.setDeliveredAt(null);
        return repository.save(shipment);
    }

    public Shipment update(Long id, Shipment request) {
        Shipment shipment = getById(id);
        shipment.setOrderId(request.getOrderId());
        shipment.setLogisticsUserId(request.getLogisticsUserId());
        shipment.setPickupAddress(request.getPickupAddress());
        shipment.setDeliveryAddress(request.getDeliveryAddress());
        shipment.setStatus(request.getStatus());
        shipment.setShippedAt(request.getShippedAt());
        shipment.setDeliveredAt(request.getDeliveredAt());
        return repository.save(shipment);
    }

    public Shipment updateStatus(Long id, ShipmentStatus status) {
        Shipment shipment = getById(id);
        assertCanChangeStatus(shipment, status);
        shipment.setStatus(status);
        LocalDateTime now = LocalDateTime.now();
        if (status == ShipmentStatus.SHIPPING && shipment.getShippedAt() == null) {
            shipment.setShippedAt(now);
        }
        if (status == ShipmentStatus.DELIVERED) {
            shipment.setDeliveredAt(now);
        }
        syncOrderStatus(shipment.getOrderId(), status);
        return repository.save(shipment);
    }

    public void delete(Long id) { repository.delete(getById(id)); }

    private void assertVisible(Shipment shipment) {
        Role role = currentUser.getRole();
        if (role == Role.ADMIN || role == Role.LOGISTICS) return;
        if (role == Role.BUYER && isCurrentBuyerShipment(shipment)) return;
        if (role == Role.FARMER && isCurrentFarmerShipment(shipment)) return;
        throw new AccessDeniedException("You can only access shipments for your orders");
    }

    private void assertCanChangeStatus(Shipment shipment, ShipmentStatus status) {
        Role role = currentUser.getRole();
        boolean allowed = switch (status) {
            case PENDING -> false;
            case CONFIRMED -> role == Role.ADMIN || (role == Role.FARMER && isCurrentFarmerShipment(shipment));
            case PACKING -> (role == Role.FARMER && isCurrentFarmerShipment(shipment)) || role == Role.LOGISTICS;
            case SHIPPING, DELIVERED -> role == Role.LOGISTICS;
            case CANCELLED -> role == Role.ADMIN || (role == Role.BUYER && isCurrentBuyerShipment(shipment));
        };
        if (!allowed) {
            throw new AccessDeniedException("This role cannot change shipment to " + status);
        }
    }

    private boolean isCurrentBuyerShipment(Shipment shipment) {
        return orderRepository.findById(shipment.getOrderId())
                .map(order -> order.getBuyerId().equals(currentUser.getId()))
                .orElse(false);
    }

    private boolean isCurrentFarmerShipment(Shipment shipment) {
        Long farmerId = currentUser.getId();
        return orderItemRepository.findByOrderId(shipment.getOrderId()).stream()
                .anyMatch(item -> cropBatchRepository.findById(item.getBatchId())
                        .map(batch -> farmerId.equals(batch.getFarmerId()))
                        .orElse(false));
    }

    private void syncOrderStatus(Long orderId, ShipmentStatus shipmentStatus) {
        orderRepository.findById(orderId).ifPresent(order -> {
            order.setStatus(OrderStatus.valueOf(shipmentStatus.name()));
            orderRepository.save(order);
        });
    }
}
