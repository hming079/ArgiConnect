package com.agriconnect.order;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByBuyerId(Long buyerId);
    List<Order> findByStatus(OrderStatus status);

    @Query(value = """
            SELECT DISTINCT o.*
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN crop_batches cb ON cb.id = oi.batch_id
            WHERE cb.farmer_id = :farmerId
            """, nativeQuery = true)
    List<Order> findVisibleForFarmer(@Param("farmerId") Long farmerId);
}
