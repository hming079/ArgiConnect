package com.agriconnect.rescueRegistration;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RescueRegistrationRepository extends JpaRepository<RescueRegistration, Long> {
    List<RescueRegistration> findByBatchId(Long batchId);
    List<RescueRegistration> findByRescuePointId(Long rescuePointId);
    List<RescueRegistration> findByStatus(RescueRegistrationStatus status);
}
