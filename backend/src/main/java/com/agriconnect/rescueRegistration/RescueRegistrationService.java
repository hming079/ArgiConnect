package com.agriconnect.rescueRegistration;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import com.agriconnect.common.PageUtils;
import com.agriconnect.common.ResourceNotFoundException;
import com.agriconnect.cropBatch.CropBatch;
import com.agriconnect.cropBatch.CropBatchRepository;
import com.agriconnect.cropBatch.CropBatchStatus;
import com.agriconnect.security.CurrentUser;
import com.agriconnect.user.Role;
import com.agriconnect.user.User;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;

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

    public List<RescueRegistration> getVisibleRegistrations(Long batchId, Long rescuePointId, RescueRegistrationStatus status) {
        if (currentUser.getRole() == Role.ADMIN) {
            return getAll(batchId, rescuePointId, status);
        }

        if (status != null && status != RescueRegistrationStatus.APPROVED) {
            return List.of();
        }

        return repository.findByStatus(RescueRegistrationStatus.APPROVED).stream()
                .filter(registration -> batchId == null || registration.getBatchId().equals(batchId))
                .filter(registration -> rescuePointId == null || registration.getRescuePointId().equals(rescuePointId))
                .toList();
    }

    public Page<RescueRegistration> getVisibleRegistrations(
            Long batchId,
            Long rescuePointId,
            RescueRegistrationStatus status,
            Long cropId,
            String farmerName,
            String quantitySort,
            int page,
            int size) {
        RescueRegistrationStatus visibleStatus = currentUser.getRole() == Role.ADMIN
                ? status
                : RescueRegistrationStatus.APPROVED;
        String normalizedName = farmerName == null || farmerName.isBlank() ? null : farmerName.trim();
        String normalizedSort = "ASC".equalsIgnoreCase(quantitySort) || "DESC".equalsIgnoreCase(quantitySort)
                ? quantitySort.toUpperCase()
                : "NONE";
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        Specification<RescueRegistration> specification = (root, query, builder) -> {
            Root<CropBatch> batch = query.from(CropBatch.class);
            Root<User> farmer = query.from(User.class);
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("batchId"), batch.get("id")));
            predicates.add(builder.equal(batch.get("farmerId"), farmer.get("id")));
            if (batchId != null) predicates.add(builder.equal(root.get("batchId"), batchId));
            if (rescuePointId != null) predicates.add(builder.equal(root.get("rescuePointId"), rescuePointId));
            if (visibleStatus != null) predicates.add(builder.equal(root.get("status"), visibleStatus));
            if (cropId != null) predicates.add(builder.equal(batch.get("cropId"), cropId));
            if (normalizedName != null) {
                predicates.add(builder.like(
                        builder.lower(farmer.get("fullName")),
                        "%" + normalizedName.toLowerCase() + "%"));
            }
            if (!Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {
                if ("ASC".equals(normalizedSort)) query.orderBy(builder.asc(batch.get("currentQuantity")), builder.desc(root.get("submittedAt")), builder.desc(root.get("id")));
                else if ("DESC".equals(normalizedSort)) query.orderBy(builder.desc(batch.get("currentQuantity")), builder.desc(root.get("submittedAt")), builder.desc(root.get("id")));
                else query.orderBy(builder.desc(root.get("submittedAt")), builder.desc(root.get("id")));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        return repository.findAll(specification, PageRequest.of(safePage, safeSize));
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

    public Page<RescueRegistration> getMyRegistrations(int page, int size) {
        return PageUtils.toPage(getMyRegistrations(), page, size);
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

    @Transactional
    public RescueRegistration review(Long id, RescueRegistrationStatus status) {
        if (status == RescueRegistrationStatus.PENDING) {
            throw new IllegalArgumentException("Review status must be APPROVED or REJECTED");
        }

        RescueRegistration registration = getById(id);
        if (status == RescueRegistrationStatus.APPROVED) {
            CropBatch batch = cropBatchRepository.findById(registration.getBatchId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Crop batch not found with id: " + registration.getBatchId()));
            batch.setStatus(CropBatchStatus.available);
            cropBatchRepository.save(batch);
        }

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
