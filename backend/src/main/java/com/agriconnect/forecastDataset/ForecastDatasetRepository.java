package com.agriconnect.forecastDataset;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ForecastDatasetRepository extends JpaRepository<ForecastDatasetRecord, Long> {
}
