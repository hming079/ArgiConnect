package com.agriconnect.cropBatch;

import java.util.List;
import java.math.BigDecimal;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CropBatchRepository extends JpaRepository<CropBatch, Long> {

    List<CropBatch> findByCropId(Long cropId);

    List<CropBatch> findByFarmerId(Long farmerId);

    List<CropBatch> findByStatus(CropBatchStatus status);

    @Modifying
    @Query(value = """
            UPDATE crop_batches
            SET current_quantity = current_quantity - :quantity
            WHERE id = :id
              AND current_quantity >= :quantity
              AND status NOT IN ('expired', 'cancelled', 'EXPIRED', 'CANCELLED', 'sold_out', 'SOLD_OUT')
            """, nativeQuery = true)
    int reserveAvailableQuantity(@Param("id") Long id, @Param("quantity") BigDecimal quantity);

    @Modifying
    @Query(value = """
            UPDATE crop_batches
            SET current_quantity = LEAST(current_quantity + :quantity, initial_quantity)
            WHERE id = :id
            """, nativeQuery = true)
    int restoreQuantity(@Param("id") Long id, @Param("quantity") BigDecimal quantity);

}
