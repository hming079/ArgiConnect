package com.agriconnect.ai;

import com.agriconnect.ai.AiInsightDtos.AiInsightRequest;
import com.agriconnect.ai.AiInsightDtos.AiInsightResponse;
import com.agriconnect.analytics.AnalyticsDtos.CongestionRiskRow;
import com.agriconnect.analytics.AnalyticsDtos.ProvinceStat;
import com.agriconnect.analytics.AnalyticsDtos.SupplyCapacityRow;
import com.agriconnect.analytics.AnalyticsService;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AiInsightService {
    private final AnalyticsService analyticsService;
    private final AiProperties properties;
    private final OpenAiProvider openAiProvider;
    private final MockAiProvider mockAiProvider;

    public AiInsightService(
            AnalyticsService analyticsService,
            AiProperties properties,
            OpenAiProvider openAiProvider,
            MockAiProvider mockAiProvider) {
        this.analyticsService = analyticsService;
        this.properties = properties;
        this.openAiProvider = openAiProvider;
        this.mockAiProvider = mockAiProvider;
    }

    public AiInsightResponse generateInsights(AiInsightRequest request) {
        Map<String, Object> context = buildContext(request);
        if (!canUseExternalProvider()) {
            return mockAiProvider.generateInsights(context);
        }

        try {
            return openAiProvider.generateInsights(context);
        } catch (RuntimeException exception) {
            if (properties.isFallbackOnError()) {
                return mockAiProvider.generateInsights(context);
            }
            throw exception;
        }
    }

    private Map<String, Object> buildContext(AiInsightRequest request) {
        int forecastDays = normalizeForecastDays(request == null ? null : request.forecastDays());
        String province = request == null ? null : request.province();
        Long cropId = request == null ? null : request.cropId();
        int maxRows = Math.max(1, properties.getMaxInputRows());

        List<ProvinceStat> provinceStats = analyticsService.provinceStats().stream()
                .sorted(Comparator.comparing(ProvinceStat::congestionRiskScore).reversed())
                .limit(maxRows)
                .toList();
        List<CongestionRiskRow> congestionRisks = analyticsService.congestionRisk().stream()
                .limit(maxRows)
                .toList();
        List<SupplyCapacityRow> supplyCapacity = analyticsService.supplyCapacity(
                LocalDate.now(),
                LocalDate.now().plusDays(forecastDays - 1L),
                province,
                cropId).stream()
                .sorted(Comparator.comparing(SupplyCapacityRow::netAvailableKg).reversed())
                .limit(maxRows)
                .toList();

        return Map.of(
                "scope", normalizeScope(request == null ? null : request.scope()),
                "overview", analyticsService.overview(),
                "provinceStats", provinceStats,
                "congestionRisks", congestionRisks,
                "forecast", analyticsService.forecastInventory(forecastDays),
                "supplyCapacity", supplyCapacity);
    }

    private boolean canUseExternalProvider() {
        return properties.isEnabled()
                && "openai".equalsIgnoreCase(properties.getProvider())
                && properties.getApiKey() != null
                && !properties.getApiKey().isBlank();
    }

    private int normalizeForecastDays(Integer value) {
        if (value != null && (value == 7 || value == 14 || value == 30)) {
            return value;
        }
        return 30;
    }

    private String normalizeScope(String scope) {
        if (scope == null || scope.isBlank()) {
            return "coordination";
        }
        return scope.toLowerCase(Locale.ROOT);
    }
}
