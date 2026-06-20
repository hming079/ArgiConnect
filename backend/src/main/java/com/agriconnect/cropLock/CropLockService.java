package com.agriconnect.cropLock;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CropLockService {
    private final CropLockRepository repository;

    public CropLockService(CropLockRepository repository) { this.repository = repository; }

    public List<CropLock> getAll(Long batchId, Long buyerId, CropLockStatus status) {
        if (batchId != null) return repository.findByBatchId(batchId);
        if (buyerId != null) return repository.findByBuyerId(buyerId);
        if (status != null) return repository.findByStatus(status);
        return repository.findAll();
    }

    public CropLock getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Crop lock not found with id: " + id));
    }

    public CropLock create(CropLock cropLock) {
        cropLock.setId(null);
        cropLock.setStatus(CropLockStatus.ACTIVE);
        return repository.save(cropLock);
    }

    public CropLock update(Long id, CropLock request) {
        CropLock cropLock = getById(id);
        cropLock.setBatchId(request.getBatchId());
        cropLock.setBuyerId(request.getBuyerId());
        cropLock.setQuantity(request.getQuantity());
        cropLock.setStatus(request.getStatus());
        cropLock.setExpiredAt(request.getExpiredAt());
        return repository.save(cropLock);
    }

    public void delete(Long id) { repository.delete(getById(id)); }
}
