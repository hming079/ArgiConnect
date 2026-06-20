package com.agriconnect.shipment;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ShipmentService {
    private final ShipmentRepository repository;

    public ShipmentService(ShipmentRepository repository) { this.repository = repository; }

    public List<Shipment> getAll(Long logisticsUserId, ShipmentStatus status) {
        if (logisticsUserId != null) return repository.findByLogisticsUserId(logisticsUserId);
        if (status != null) return repository.findByStatus(status);
        return repository.findAll();
    }

    public Shipment getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shipment not found with id: " + id));
    }

    public Shipment getByOrderId(Long orderId) {
        return repository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Shipment not found for order: " + orderId));
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
        shipment.setStatus(status);
        LocalDateTime now = LocalDateTime.now();
        if (status == ShipmentStatus.PICKED_UP && shipment.getShippedAt() == null) {
            shipment.setShippedAt(now);
        }
        if (status == ShipmentStatus.DELIVERED) {
            shipment.setDeliveredAt(now);
        }
        return repository.save(shipment);
    }

    public void delete(Long id) { repository.delete(getById(id)); }
}
