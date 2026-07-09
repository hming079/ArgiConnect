package com.agriconnect.ai;

import com.agriconnect.ai.AiInsightDtos.AiInsightResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class OpenAiProvider implements AiProvider {
    private final AiProperties properties;
    private final ObjectMapper objectMapper;

    public OpenAiProvider(AiProperties properties) {
        this.properties = properties;
        this.objectMapper = new ObjectMapper().findAndRegisterModules();
    }

    @Override
    @SuppressWarnings("unchecked")
    public AiInsightResponse generateInsights(Map<String, Object> context) {
        Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content", systemPrompt()),
                        Map.of(
                                "role", "user",
                                "content", toJson(context))));

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(properties.getTimeoutMs()))
                .build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                .timeout(Duration.ofMillis(properties.getTimeoutMs()))
                .header("Authorization", "Bearer " + properties.getApiKey())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(toJson(body)))
                .build();

        Map<String, Object> response;
        try {
            HttpResponse<String> httpResponse = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (httpResponse.statusCode() < 200 || httpResponse.statusCode() >= 300) {
                throw new IllegalStateException("AI provider returned HTTP " + httpResponse.statusCode());
            }
            response = objectMapper.readValue(httpResponse.body(), Map.class);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not call AI provider", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("AI provider call was interrupted", exception);
        }

        String content = extractContent(response);
        return parseResponse(content);
    }

    private String systemPrompt() {
        return """
                You are an agricultural supply-chain decision-support assistant for AgriConnect.
                Use only the JSON data provided by the application. Return valid JSON with these fields:
                provider, model, generatedByAi, generatedAt, executiveSummary, risks, recommendations, sourceMetrics, disclaimer.
                risks must contain title, severity, detail, confidence. recommendations must contain title, priority, action, expectedImpact.
                Do not claim that an operational change was performed. Keep recommendations practical and concise.
                """;
    }

    private String toJson(Map<String, Object> context) {
        try {
            return objectMapper.writeValueAsString(context);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize AI insight context", exception);
        }
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map<String, Object> response) {
        if (response == null) {
            throw new IllegalStateException("AI provider returned an empty response");
        }
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new IllegalStateException("AI provider response did not include choices");
        }
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        Object content = message == null ? null : message.get("content");
        if (content == null) {
            throw new IllegalStateException("AI provider response did not include message content");
        }
        return content.toString();
    }

    private AiInsightResponse parseResponse(String content) {
        try {
            return objectMapper.readValue(stripCodeFence(content), AiInsightResponse.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("AI provider returned invalid insight JSON", exception);
        }
    }

    private String stripCodeFence(String value) {
        String trimmed = value.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```(?:json)?\\s*", "");
            trimmed = trimmed.replaceFirst("\\s*```$", "");
        }
        return trimmed;
    }
}
