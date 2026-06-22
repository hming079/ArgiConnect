package com.agriconnect.rescueRegistration;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;

import com.agriconnect.common.ResourceNotFoundException;
import com.agriconnect.cropBatch.CropBatch;
import com.agriconnect.cropBatch.CropBatchRepository;
import com.agriconnect.security.CurrentUser;

@Service
public class RescueRegistrationService {

    private final RescueRegistrationRepository repository;
    private final CropBatchRepository cropBatchRepository;
    private final CurrentUser currentUser;

    public RescueRegistrationService(
            RescueRegistrationRepository repository,
            CropBatchRepository cropBatchRepository,
            CurrentUser currentUser) {
        this.repository = repository;
        this.cropBatchRepository = cropBatchRepository;
        this.currentUser = currentUser;
    }

    public List<RescueRegistration> getAll(Long batchId, Long rescuePointId, RescueRegistrationStatus status) {
        if (batchId != null) return repository.findByBatchId(batchId);
        if (rescuePointId != null) return repository.findByRescuePointId(rescuePointId);
        if (status != null) return repository.findByStatus(status);
        return repository.findAll();
    }

    public RescueRegistration getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue registration not found with id: " + id));
    }

    public List<RescueRegistration> getMyRegistrations() {
        List<Long> batchIds = cropBatchRepository.findByFarmerId(currentUser.getId()).stream()
                .map(CropBatch::getId)
                .toList();
        return batchIds.isEmpty() ? List.of() : repository.findByBatchIdIn(batchIds);
    }

    public RescueRegistration create(RescueRegistration registration) {
        CropBatch batch = cropBatchRepository.findById(registration.getBatchId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Crop batch not found with id: " + registration.getBatchId()));
        if (!batch.getFarmerId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Farmers can only register their own crop batches");
        }

        registration.setId(null);
        registration.setStatus(RescueRegistrationStatus.PENDING);
        registration.setApprovedBy(null);
        registration.setApprovedAt(null);
        return repository.save(registration);
    }

    public RescueRegistration update(Long id, RescueRegistration request) {
        RescueRegistration registration = getById(id);
        registration.setBatchId(request.getBatchId());
        registration.setRescuePointId(request.getRescuePointId());
        return repository.save(registration);
    }

    public RescueRegistration updateMy(Long id, RescueRegistration request) {
        RescueRegistration registration = getOwnedPending(id);
        registration.setRescuePointId(request.getRescuePointId());
        return repository.save(registration);
    }

    public RescueRegistration review(Long id, RescueRegistrationStatus status) {
        if (status == RescueRegistrationStatus.PENDING) {
            throw new IllegalArgumentException("Review status must be APPROVED or REJECTED");
        }

        RescueRegistration registration = getById(id);
        registration.setStatus(status);
        registration.setApprovedBy(currentUser.getId());
        registration.setApprovedAt(LocalDateTime.now());
        return repository.save(registration);
    }

    public void delete(Long id) {
        repository.delete(getById(id));
    }

    public void deleteMy(Long id) {
        repository.delete(getOwnedPending(id));
    }

    private RescueRegistration getOwnedPending(Long id) {
        RescueRegistration registration = getById(id);
        CropBatch batch = cropBatchRepository.findById(registration.getBatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Crop batch not found with id: " + registration.getBatchId()));
        if (!batch.getFarmerId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Farmers can only manage their own rescue registrations");
        }
        if (registration.getStatus() != RescueRegistrationStatus.PENDING) {
            throw new AccessDeniedException("Only pending rescue registrations can be changed");
        }
        return registration;
    }
}
