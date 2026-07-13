package com.agriconnect.rescueRegistration;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface RescueRegistrationRepository extends JpaRepository<RescueRegistration, Long>, JpaSpecificationExecutor<RescueRegistration> {
    List<RescueRegistration> findByBatchId(Long batchId);
    List<RescueRegistration> findByRescuePointId(Long rescuePointId);
    List<RescueRegistration> findByStatus(RescueRegistrationStatus status);
    List<RescueRegistration> findByBatchIdIn(List<Long> batchIds);

}
