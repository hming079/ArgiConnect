package com.agriconnect.inventoryRisk;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InventoryRiskResponse(
        Long batchId,
        String cropName,
        String province,
        BigDecimal currentQuantity,
        BigDecimal initialQuantity,
        LocalDate harvestDate,
        LocalDate expiryDate,
        Long daysUntilExpiry,
        BigDecimal estimatedDailySales,
        BigDecimal estimatedDaysToSellOut,
        BigDecimal riskScore,
        RiskLevel riskLevel,
        String explanation) {

    public enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH
    }
}
