package com.agriconnect.inventoryRisk;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Component;

import com.agriconnect.crop.Crop;
import com.agriconnect.cropBatch.CropBatch;
import com.agriconnect.inventoryRisk.InventoryRiskResponse.RiskLevel;

@Component
public class InventoryRiskCalculator {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal LARGE_DAYS_TO_SELL_OUT = BigDecimal.valueOf(999);

    public InventoryRiskResponse calculate(CropBatch batch, Crop crop, BigDecimal estimatedDailySales) {
        LocalDate today = LocalDate.now();
        LocalDate harvestDate = batch.getHarvestDate();
        LocalDate expiryDate = resolveExpiryDate(batch, crop);
        Long daysUntilExpiry = expiryDate == null ? null : ChronoUnit.DAYS.between(today, expiryDate);

        BigDecimal initialQuantity = positiveOrZero(batch.getInitialQuantity());
        BigDecimal currentQuantity = positiveOrZero(batch.getCurrentQuantity());
        BigDecimal safeDailySales = positiveOrZero(estimatedDailySales);
        BigDecimal daysToSellOut = estimateDaysToSellOut(currentQuantity, safeDailySales);

        // The final score is a weighted rule-based forecast:
        // expiry pressure 40%, sell-out timing 35%, remaining inventory ratio 25%.
        BigDecimal expiryPressure = expiryPressure(daysUntilExpiry);
        BigDecimal sellOutRisk = sellOutRisk(daysUntilExpiry, daysToSellOut, safeDailySales);
        BigDecimal remainingRisk = remainingQuantityRisk(currentQuantity, initialQuantity);
        BigDecimal riskScore = expiryPressure.multiply(new BigDecimal("0.40"))
                .add(sellOutRisk.multiply(new BigDecimal("0.35")))
                .add(remainingRisk.multiply(new BigDecimal("0.25")))
                .max(ZERO)
                .min(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);

        RiskLevel riskLevel = riskLevel(riskScore);
        return new InventoryRiskResponse(
                batch.getId(),
                crop == null ? "Crop #" + batch.getCropId() : crop.getName(),
                blankToUnknown(batch.getProvince()),
                currentQuantity,
                initialQuantity,
                harvestDate,
                expiryDate,
                daysUntilExpiry,
                safeDailySales.setScale(2, RoundingMode.HALF_UP),
                daysToSellOut.setScale(2, RoundingMode.HALF_UP),
                riskScore,
                riskLevel,
                explanation(riskLevel, daysUntilExpiry, currentQuantity, initialQuantity, daysToSellOut, safeDailySales));
    }

    private LocalDate resolveExpiryDate(CropBatch batch, Crop crop) {
        if (batch.getExpiryDate() != null) return batch.getExpiryDate();
        if (batch.getHarvestDate() == null) return null;
        int storageDays = crop != null && crop.getStorageDays() != null ? crop.getStorageDays() : 7;
        return batch.getHarvestDate().plusDays(Math.max(1, storageDays));
    }

    private BigDecimal estimateDaysToSellOut(BigDecimal currentQuantity, BigDecimal estimatedDailySales) {
        if (currentQuantity.compareTo(ZERO) <= 0) return ZERO;
        if (estimatedDailySales.compareTo(ZERO) <= 0) return LARGE_DAYS_TO_SELL_OUT;
        return currentQuantity.divide(estimatedDailySales, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal expiryPressure(Long daysUntilExpiry) {
        if (daysUntilExpiry == null || daysUntilExpiry <= 0) return BigDecimal.valueOf(100);
        if (daysUntilExpiry <= 2) return BigDecimal.valueOf(95);
        if (daysUntilExpiry <= 5) return BigDecimal.valueOf(80);
        if (daysUntilExpiry <= 10) return BigDecimal.valueOf(60);
        if (daysUntilExpiry <= 20) return BigDecimal.valueOf(35);
        return BigDecimal.valueOf(10);
    }

    private BigDecimal sellOutRisk(Long daysUntilExpiry, BigDecimal estimatedDaysToSellOut, BigDecimal estimatedDailySales) {
        if (estimatedDailySales.compareTo(ZERO) <= 0) return BigDecimal.valueOf(100);
        if (daysUntilExpiry == null || daysUntilExpiry <= 0) return BigDecimal.valueOf(100);

        BigDecimal expiryDays = BigDecimal.valueOf(daysUntilExpiry);
        if (estimatedDaysToSellOut.compareTo(expiryDays.multiply(new BigDecimal("1.5"))) >= 0) return BigDecimal.valueOf(100);
        if (estimatedDaysToSellOut.compareTo(expiryDays) >= 0) return BigDecimal.valueOf(80);
        if (estimatedDaysToSellOut.compareTo(expiryDays.multiply(new BigDecimal("0.7"))) >= 0) return BigDecimal.valueOf(50);
        return BigDecimal.valueOf(20);
    }

    private BigDecimal remainingQuantityRisk(BigDecimal currentQuantity, BigDecimal initialQuantity) {
        if (initialQuantity.compareTo(ZERO) <= 0) return currentQuantity.compareTo(ZERO) > 0 ? BigDecimal.valueOf(100) : ZERO;
        BigDecimal ratio = currentQuantity.divide(initialQuantity, 4, RoundingMode.HALF_UP);
        if (ratio.compareTo(new BigDecimal("0.90")) >= 0) return BigDecimal.valueOf(100);
        if (ratio.compareTo(new BigDecimal("0.70")) >= 0) return BigDecimal.valueOf(80);
        if (ratio.compareTo(new BigDecimal("0.50")) >= 0) return BigDecimal.valueOf(60);
        if (ratio.compareTo(new BigDecimal("0.30")) >= 0) return BigDecimal.valueOf(40);
        return BigDecimal.valueOf(20);
    }

    private RiskLevel riskLevel(BigDecimal riskScore) {
        // HIGH means urgent intervention; MEDIUM should be watched; LOW is currently manageable.
        if (riskScore.compareTo(BigDecimal.valueOf(80)) >= 0) return RiskLevel.HIGH;
        if (riskScore.compareTo(BigDecimal.valueOf(60)) >= 0) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    private String explanation(
            RiskLevel riskLevel,
            Long daysUntilExpiry,
            BigDecimal currentQuantity,
            BigDecimal initialQuantity,
            BigDecimal estimatedDaysToSellOut,
            BigDecimal estimatedDailySales) {
        BigDecimal remainingPercent = initialQuantity.compareTo(ZERO) <= 0
                ? ZERO
                : currentQuantity.multiply(BigDecimal.valueOf(100)).divide(initialQuantity, 0, RoundingMode.HALF_UP);
        String expiryText = daysUntilExpiry == null
                ? "the expiry date cannot be estimated"
                : daysUntilExpiry <= 0 ? "the batch is expired" : "the batch expires in " + daysUntilExpiry + " days";
        return title(riskLevel.name()) + " risk because " + expiryText
                + ", " + remainingPercent + "% of inventory is still available"
                + ", estimated daily sales are " + estimatedDailySales.setScale(2, RoundingMode.HALF_UP) + " kg"
                + ", and estimated sell-out time is " + estimatedDaysToSellOut.setScale(2, RoundingMode.HALF_UP) + " days.";
    }

    private BigDecimal positiveOrZero(BigDecimal value) {
        if (value == null || value.compareTo(ZERO) < 0) return ZERO;
        return value;
    }

    private String blankToUnknown(String value) {
        return value == null || value.isBlank() ? "Unknown" : value;
    }

    private String title(String value) {
        return value.charAt(0) + value.substring(1).toLowerCase();
    }
}
