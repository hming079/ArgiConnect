package com.agriconnect.forecast;

import com.agriconnect.common.BadRequestException;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiForecastClient {
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String serviceUrl;

    public AiForecastClient(@Value("${ai.forecast-service-url:http://localhost:8001}") String serviceUrl) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper().findAndRegisterModules();
        this.serviceUrl = serviceUrl.endsWith("/") ? serviceUrl.substring(0, serviceUrl.length() - 1) : serviceUrl;
    }

    public BatchForecastResponse predictBatch(List<ForecastRequestItem> items) {
        try {
            String requestBody = objectMapper.writeValueAsString(new BatchForecastRequest(items));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(serviceUrl + "/predict-batch"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new BadRequestException("AI forecast service returned " + response.statusCode() + ": " + response.body());
            }
            return objectMapper.readValue(response.body(), BatchForecastResponse.class);
        } catch (JsonProcessingException exception) {
            throw new BadRequestException("Could not build AI forecast request: " + exception.getMessage());
        } catch (IOException exception) {
            throw new BadRequestException("AI forecast service is not reachable at " + serviceUrl + ". Start FastAPI first.");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("AI forecast request was interrupted.");
        }
    }

    public String getServiceUrl() {
        return serviceUrl;
    }

    public record ForecastRequestItem(
            String province,
            @JsonProperty("crop_name") String cropName,
            Integer year,
            Integer month,
            @JsonProperty("sold_quantity") BigDecimal soldQuantity,
            @JsonProperty("average_price") BigDecimal averagePrice) {}

    public record ForecastPrediction(
            String province,
            @JsonProperty("crop_name") String cropName,
            Integer year,
            Integer month,
            @JsonProperty("sold_quantity") BigDecimal soldQuantity,
            @JsonProperty("average_price") BigDecimal averagePrice,
            @JsonProperty("predicted_quantity") BigDecimal predictedQuantity,
            @JsonProperty("model_name") String modelName) {}

    public record BatchForecastRequest(List<ForecastRequestItem> items) {}

    public record BatchForecastResponse(
            @JsonProperty("model_name") String modelName,
            List<ForecastPrediction> predictions) {}
}
