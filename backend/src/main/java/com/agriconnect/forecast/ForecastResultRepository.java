package com.agriconnect.forecast;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ForecastResultRepository extends JpaRepository<ForecastResult, Long> {
    void deleteByModelName(String modelName);
}
