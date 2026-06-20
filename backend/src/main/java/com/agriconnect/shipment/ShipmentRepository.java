package com.agriconnect.shipment;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByOrderId(Long orderId);
    List<Shipment> findByLogisticsUserId(Long logisticsUserId);
    List<Shipment> findByStatus(ShipmentStatus status);
}
