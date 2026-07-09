package com.agriconnect.ai;

import com.agriconnect.ai.AiInsightDtos.ActionRecommendation;
import com.agriconnect.ai.AiInsightDtos.AiInsightResponse;
import com.agriconnect.ai.AiInsightDtos.RiskInsight;
import com.agriconnect.ai.AiInsightDtos.SourceMetric;
import com.agriconnect.analytics.AnalyticsDtos.CongestionRiskRow;
import com.agriconnect.analytics.AnalyticsDtos.OverviewResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class MockAiProvider {
    @SuppressWarnings("unchecked")
    public AiInsightResponse generateInsights(Map<String, Object> context) {
        OverviewResponse overview = (OverviewResponse) context.get("overview");
        List<CongestionRiskRow> risks = (List<CongestionRiskRow>) context.getOrDefault("congestionRisks", List.of());
        List<CongestionRiskRow> topRisks = risks.stream().limit(3).toList();

        String summary = "Current inventory is " + kg(overview.currentInventoryQuantity())
                + " kg with " + kg(overview.rescuingQuantity())
                + " kg in rescue flow. Overall congestion risk is "
                + overview.congestionRiskLevel() + " (" + overview.congestionRiskScore() + "/100).";

        List<RiskInsight> riskInsights = topRisks.stream()
                .map(row -> new RiskInsight(
                        row.province() + " - " + row.cropName(),
                        row.riskLevel().name(),
                        row.recommendation(),
                        confidence(row.riskScore())))
                .toList();

        List<ActionRecommendation> recommendations = topRisks.stream()
                .map(row -> new ActionRecommendation(
                        "Prioritize " + row.cropName() + " in " + row.province(),
                        row.riskLevel().name(),
                        row.recommendation(),
                        "Reduce inventory pressure and improve rescue throughput for the selected province."))
                .toList();

        return new AiInsightResponse(
                "mock",
                "rule-based",
                false,
                LocalDateTime.now(),
                summary,
                riskInsights,
                recommendations,
                List.of(
                        new SourceMetric("Current inventory", kg(overview.currentInventoryQuantity()), "kg"),
                        new SourceMetric("Rescuing quantity", kg(overview.rescuingQuantity()), "kg"),
                        new SourceMetric("Rescue success rate", overview.rescueSuccessRate().toPlainString(), "%"),
                        new SourceMetric("Congestion risk", overview.congestionRiskScore().toPlainString(), "/100")),
                "AI recommendations are decision support only. Confirm operational actions before changing orders, shipments, or rescue workflows.");
    }

    private String kg(BigDecimal value) {
        return value == null ? "0" : value.setScale(0, java.math.RoundingMode.HALF_UP).toPlainString();
    }

    private BigDecimal confidence(BigDecimal riskScore) {
        if (riskScore == null) {
            return BigDecimal.valueOf(0.60);
        }
        return riskScore.divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP)
                .max(BigDecimal.valueOf(0.55))
                .min(BigDecimal.valueOf(0.92));
    }
}
