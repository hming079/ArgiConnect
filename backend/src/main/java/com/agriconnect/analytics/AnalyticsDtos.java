package com.agriconnect.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class AnalyticsDtos {
    private AnalyticsDtos() {}

    public enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH
    }

    public record OverviewResponse(
            BigDecimal totalProductionQuantity,
            BigDecimal currentInventoryQuantity,
            BigDecimal soldQuantity,
            BigDecimal rescuingQuantity,
            BigDecimal inTransitQuantity,
            BigDecimal rescueSuccessRate,
            BigDecimal averageDailyConsumption,
            BigDecimal inventoryCoverageDays,
            BigDecimal harvestIncomingQuantity,
            BigDecimal availableSupply,
            BigDecimal shipmentCompletionRate,
            BigDecimal averageDeliveryTime,
            BigDecimal congestionRiskScore,
            RiskLevel congestionRiskLevel,
            List<ForecastInventoryPoint> forecastInventory) {}

    public record ProvinceStat(
            String province,
            BigDecimal totalKg,
            BigDecimal inventoryKg,
            BigDecimal rescuingKg,
            BigDecimal consumedKg,
            BigDecimal inTransitKg,
            BigDecimal consumptionRateKgPerDay,
            BigDecimal rescueSuccessRate,
            BigDecimal inventoryCoverageDays,
            BigDecimal harvestIncomingKg,
            BigDecimal availableSupplyKg,
            BigDecimal congestionRiskScore,
            RiskLevel congestionRiskLevel) {}

    public record RescueRateRow(
            String group,
            String name,
            BigDecimal rescuedQuantity,
            BigDecimal totalQuantity,
            BigDecimal rate) {}

    public record SupplyCapacityRow(
            String province,
            int days,
            BigDecimal dailyHarvestKg,
            BigDecimal immediateKg,
            BigDecimal incomingHarvestKg,
            BigDecimal expectedConsumptionKg,
            BigDecimal totalSupplyKg,
            BigDecimal netAvailableKg) {}

    public record CongestionRiskRow(
            String province,
            String cropName,
            BigDecimal currentInventory,
            BigDecimal incomingHarvest,
            BigDecimal averageDailyConsumption,
            Integer maxStorageDays,
            LocalDate earliestExpiryDate,
            BigDecimal rescueSuccessRate,
            BigDecimal riskScore,
            RiskLevel riskLevel,
            String recommendation) {}

    public record ForecastInventoryResponse(
            int days,
            BigDecimal currentInventory,
            BigDecimal averageDailyHarvest,
            BigDecimal expectedHarvest,
            BigDecimal averageDailyConsumption,
            BigDecimal expectedConsumption,
            BigDecimal forecastInventory,
            List<ForecastInventoryPoint> points) {}

    public record ForecastInventoryPoint(
            int days,
            BigDecimal currentInventory,
            BigDecimal expectedHarvest,
            BigDecimal expectedConsumption,
            BigDecimal forecastInventory) {}
}
