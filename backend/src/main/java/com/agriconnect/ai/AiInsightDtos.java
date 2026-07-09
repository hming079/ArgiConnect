package com.agriconnect.ai;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class AiInsightDtos {
    private AiInsightDtos() {}

    public record AiInsightRequest(
            String scope,
            Integer forecastDays,
            String province,
            Long cropId) {}

    public record AiInsightResponse(
            String provider,
            String model,
            boolean generatedByAi,
            LocalDateTime generatedAt,
            String executiveSummary,
            List<RiskInsight> risks,
            List<ActionRecommendation> recommendations,
            List<SourceMetric> sourceMetrics,
            String disclaimer) {}

    public record RiskInsight(
            String title,
            String severity,
            String detail,
            BigDecimal confidence) {}

    public record ActionRecommendation(
            String title,
            String priority,
            String action,
            String expectedImpact) {}

    public record SourceMetric(
            String label,
            String value,
            String unit) {}
}
