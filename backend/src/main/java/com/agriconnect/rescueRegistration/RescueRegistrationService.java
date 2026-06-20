package com.agriconnect.rescueRegistration;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class RescueRegistrationService {

    private final RescueRegistrationRepository repository;

    public RescueRegistrationService(RescueRegistrationRepository repository) {
        this.repository = repository;
    }

    public List<RescueRegistration> getAll(Long batchId, Long rescuePointId, RescueRegistrationStatus status) {
        if (batchId != null) return repository.findByBatchId(batchId);
        if (rescuePointId != null) return repository.findByRescuePointId(rescuePointId);
        if (status != null) return repository.findByStatus(status);
        return repository.findAll();
    }

    public RescueRegistration getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rescue registration not found with id: " + id));
    }

    public RescueRegistration create(RescueRegistration registration) {
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

    public RescueRegistration review(Long id, RescueRegistrationStatus status, Long approvedBy) {
        if (status == RescueRegistrationStatus.PENDING) {
            throw new IllegalArgumentException("Review status must be APPROVED or REJECTED");
        }

        RescueRegistration registration = getById(id);
        registration.setStatus(status);
        registration.setApprovedBy(approvedBy);
        registration.setApprovedAt(LocalDateTime.now());
        return repository.save(registration);
    }

    public void delete(Long id) {
        repository.delete(getById(id));
    }
}
