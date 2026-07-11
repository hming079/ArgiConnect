package com.agriconnect.inventoryRisk;

import java.math.BigDecimal;

public record InventoryRiskSummaryResponse(
        long totalBatches,
        long highRiskCount,
        long mediumRiskCount,
        long lowRiskCount,
        BigDecimal averageRiskScore,
        String topRiskProvince,
        String topRiskCropName) {
}
