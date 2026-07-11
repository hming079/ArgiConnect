package com.agriconnect.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query(value = """
            SELECT DISTINCT u.*
            FROM users u
            JOIN orders o ON o.buyer_id = u.id
            JOIN order_items oi ON oi.order_id = o.id
            JOIN crop_batches cb ON cb.id = oi.batch_id
            WHERE cb.farmer_id = :farmerId
              AND u.role = 'BUYER'
            """, nativeQuery = true)
    List<User> findVisibleBuyersForFarmer(@Param("farmerId") Long farmerId);

}
