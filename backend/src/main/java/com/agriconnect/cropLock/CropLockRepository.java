package com.agriconnect.cropLock;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CropLockRepository extends JpaRepository<CropLock, Long> {
    List<CropLock> findByBatchId(Long batchId);
    List<CropLock> findByBuyerId(Long buyerId);
    List<CropLock> findByStatus(CropLockStatus status);
}
