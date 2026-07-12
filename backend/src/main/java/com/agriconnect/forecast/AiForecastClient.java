package com.agriconnect.forecast;

import com.agriconnect.common.BadRequestException;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Service
public class AiForecastClient {
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String serviceUrl;

    public AiForecastClient(@Value("${ai.forecast-service-url:http://localhost:8001}") String serviceUrl) {
        this.serviceUrl = serviceUrl.trim().endsWith("/")
                ? serviceUrl.trim().substring(0, serviceUrl.trim().length() - 1)
                : serviceUrl.trim();
        this.restClient = RestClient.builder()
                .baseUrl(this.serviceUrl)
                .build();
        this.objectMapper = new ObjectMapper().findAndRegisterModules();
    }

    public BatchForecastResponse predictBatch(List<ForecastRequestItem> items) {
        if (items == null || items.isEmpty()) {
            throw new BadRequestException("No forecast rows were provided to the AI forecast service.");
        }

        List<Map<String, Object>> payloadItems = items.stream()
                .map(item -> Map.<String, Object>of(
                        "province", item.province(),
                        "crop_name", item.cropName(),
                        "year", item.year(),
                        "month", item.month(),
                        "sold_quantity", item.soldQuantity(),
                        "average_price", item.averagePrice()))
                .toList();
        Map<String, Object> requestBody = Map.of("items", payloadItems);

        try {
            String responseBody = restClient.post()
                    .uri("/predict-batch")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null || responseBody.isBlank()) {
                throw new BadRequestException("AI forecast service returned an empty response.");
            }

            return objectMapper.readValue(responseBody, BatchForecastResponse.class);
        } catch (RestClientResponseException exception) {
            throw new BadRequestException("AI forecast service returned " + exception.getStatusCode().value()
                    + " for " + items.size() + " rows: " + exception.getResponseBodyAsString());
        } catch (JsonProcessingException exception) {
            throw new BadRequestException("AI forecast service returned invalid JSON: " + exception.getOriginalMessage());
        } catch (RestClientException exception) {
            throw new BadRequestException("Could not read AI forecast service response from " + serviceUrl + ": "
                    + exception.getMessage());
        }
    }

    public BatchForecastResponse predictDefaultDataset() {
        try {
            String responseBody = restClient.post()
                    .uri("/predict-default-dataset")
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null || responseBody.isBlank()) {
                throw new BadRequestException("AI forecast service returned an empty response.");
            }

            return objectMapper.readValue(responseBody, BatchForecastResponse.class);
        } catch (RestClientResponseException exception) {
            throw new BadRequestException("AI forecast service returned " + exception.getStatusCode().value()
                    + ": " + exception.getResponseBodyAsString());
        } catch (JsonProcessingException exception) {
            throw new BadRequestException("AI forecast service returned invalid JSON: " + exception.getOriginalMessage());
        } catch (RestClientException exception) {
            throw new BadRequestException("Could not read AI forecast service response from " + serviceUrl + ": "
                    + exception.getMessage());
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
