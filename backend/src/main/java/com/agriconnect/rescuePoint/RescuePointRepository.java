package com.agriconnect.rescuePoint;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RescuePointRepository extends JpaRepository<RescuePoint, Long> {
    List<RescuePoint> findByProvinceIgnoreCase(String province);
    List<RescuePoint> findByStatus(RescuePointStatus status);
}
