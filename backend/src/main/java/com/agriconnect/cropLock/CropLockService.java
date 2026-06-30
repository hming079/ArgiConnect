package com.agriconnect.cropLock;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import com.agriconnect.common.BadRequestException;
import com.agriconnect.common.ResourceNotFoundException;
import com.agriconnect.cropBatch.CropBatchRepository;
import com.agriconnect.security.CurrentUser;

@Service
public class CropLockService {
    private final CropLockRepository repository;
    private final CropBatchRepository cropBatchRepository;
    private final CurrentUser currentUser;

    public CropLockService(CropLockRepository repository, CropBatchRepository cropBatchRepository, CurrentUser currentUser) {
        this.repository = repository;
        this.cropBatchRepository = cropBatchRepository;
        this.currentUser = currentUser;
    }

    @Transactional
    public List<CropLock> getAll(Long batchId, Long buyerId, CropLockStatus status) {
        expireActiveLocks();
        if (batchId != null) return repository.findByBatchId(batchId);
        if (buyerId != null) return repository.findByBuyerId(buyerId);
        if (status != null) return repository.findByStatus(status);
        return repository.findAll();
    }

    public CropLock getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop lock not found with id: " + id));
    }

    @Transactional
    public CropLock create(CropLock cropLock) {
        expireActiveLocks();
        validateLock(cropLock);
        cropLock.setId(null);
        cropLock.setBuyerId(currentUser.getId());
        cropLock.setStatus(CropLockStatus.ACTIVE);
        int reserved = cropBatchRepository.reserveAvailableQuantity(cropLock.getBatchId(), cropLock.getQuantity());
        if (reserved != 1) {
            throw new BadRequestException("Not enough available quantity for crop batch " + cropLock.getBatchId());
        }
        return repository.save(cropLock);
    }

    @Transactional
    public CropLock update(Long id, CropLock request) {
        CropLock cropLock = getById(id);
        if (cropLock.getStatus() == CropLockStatus.ACTIVE) {
            restore(cropLock);
        }
        validateLock(request);
        if (request.getStatus() == CropLockStatus.ACTIVE) {
            int reserved = cropBatchRepository.reserveAvailableQuantity(request.getBatchId(), request.getQuantity());
            if (reserved != 1) {
                throw new BadRequestException("Not enough available quantity for crop batch " + request.getBatchId());
            }
        }
        cropLock.setBatchId(request.getBatchId());
        cropLock.setBuyerId(request.getBuyerId());
        cropLock.setQuantity(request.getQuantity());
        cropLock.setStatus(request.getStatus());
        cropLock.setExpiredAt(request.getExpiredAt());
        return repository.save(cropLock);
    }

    @Transactional
    public void delete(Long id) {
        CropLock cropLock = getById(id);
        if (!cropLock.getBuyerId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Buyers can only delete their own crop locks");
        }
        if (cropLock.getStatus() == CropLockStatus.ACTIVE) {
            restore(cropLock);
        }
        repository.delete(cropLock);
    }

    @Transactional
    public List<CropLock> convertOwnedActiveLocks(List<Long> lockIds) {
        if (lockIds == null || lockIds.isEmpty()) {
            throw new BadRequestException("Checkout must include crop locks");
        }
        expireActiveLocks();
        List<CropLock> locks = repository.findByIdInAndBuyerIdAndStatus(lockIds, currentUser.getId(), CropLockStatus.ACTIVE);
        if (locks.size() != lockIds.size()) {
            throw new BadRequestException("Some crop locks are missing, expired, or not owned by this buyer");
        }
        locks.forEach(lock -> lock.setStatus(CropLockStatus.CONVERTED));
        repository.saveAll(locks);
        return locks;
    }

    @Transactional
    public void releaseOwnedLocks(List<Long> lockIds) {
        if (lockIds == null || lockIds.isEmpty()) return;
        List<CropLock> locks = repository.findByIdInAndBuyerIdAndStatus(lockIds, currentUser.getId(), CropLockStatus.ACTIVE);
        locks.forEach(lock -> {
            restore(lock);
            lock.setStatus(CropLockStatus.EXPIRED);
        });
        repository.saveAll(locks);
    }

    private void expireActiveLocks() {
        List<CropLock> expired = repository.findByStatusAndExpiredAtBefore(CropLockStatus.ACTIVE, LocalDateTime.now());
        expired.forEach(lock -> {
            restore(lock);
            lock.setStatus(CropLockStatus.EXPIRED);
        });
        if (!expired.isEmpty()) {
            repository.saveAll(expired);
        }
    }

    private void restore(CropLock lock) {
        cropBatchRepository.restoreQuantity(lock.getBatchId(), lock.getQuantity());
    }

    private void validateLock(CropLock cropLock) {
        if (cropLock == null) {
            throw new BadRequestException("Crop lock request is required");
        }
        if (cropLock.getBatchId() == null) {
            throw new BadRequestException("Crop lock batchId is required");
        }
        BigDecimal quantity = cropLock.getQuantity();
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Crop lock quantity must be greater than zero");
        }
        if (cropLock.getExpiredAt() == null || !cropLock.getExpiredAt().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("Crop lock expiredAt must be in the future");
        }
    }
}
