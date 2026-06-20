package com.agriconnect.cropBatch;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CropBatchRepository extends JpaRepository<CropBatch, Long> {

    List<CropBatch> findByCropId(Long cropId);

    List<CropBatch> findByFarmerId(Long farmerId);

    List<CropBatch> findByStatus(CropBatchStatus status);

}
