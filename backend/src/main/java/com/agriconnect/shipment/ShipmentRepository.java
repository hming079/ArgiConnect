package com.agriconnect.shipment;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByOrderId(Long orderId);
    List<Shipment> findByLogisticsUserId(Long logisticsUserId);
    List<Shipment> findByStatus(ShipmentStatus status);

    @Query(value = """
            SELECT s.*
            FROM shipments s
            JOIN orders o ON o.id = s.order_id
            WHERE o.buyer_id = :buyerId
            """, nativeQuery = true)
    List<Shipment> findVisibleForBuyer(@Param("buyerId") Long buyerId);

    @Query(value = """
            SELECT DISTINCT s.*
            FROM shipments s
            JOIN order_items oi ON oi.order_id = s.order_id
            JOIN crop_batches cb ON cb.id = oi.batch_id
            WHERE cb.farmer_id = :farmerId
            """, nativeQuery = true)
    List<Shipment> findVisibleForFarmer(@Param("farmerId") Long farmerId);
}
