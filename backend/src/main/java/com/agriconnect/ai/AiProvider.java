package com.agriconnect.ai;

import com.agriconnect.ai.AiInsightDtos.AiInsightResponse;
import java.util.Map;

public interface AiProvider {
    AiInsightResponse generateInsights(Map<String, Object> context);
}
