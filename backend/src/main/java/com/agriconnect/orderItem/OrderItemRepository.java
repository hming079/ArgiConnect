package com.agriconnect.orderItem;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);
    List<OrderItem> findByBatchId(Long batchId);

    @Query(value = """
            SELECT oi.*
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.buyer_id = :buyerId
            """, nativeQuery = true)
    List<OrderItem> findVisibleForBuyer(@Param("buyerId") Long buyerId);

    @Query(value = """
            SELECT oi.*
            FROM order_items oi
            JOIN crop_batches cb ON cb.id = oi.batch_id
            WHERE cb.farmer_id = :farmerId
            """, nativeQuery = true)
    List<OrderItem> findVisibleForFarmer(@Param("farmerId") Long farmerId);
}
