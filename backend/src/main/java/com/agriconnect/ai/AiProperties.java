package com.agriconnect.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "ai")
public class AiProperties {
    private boolean enabled = false;
    private String provider = "mock";
    private String apiKey = "";
    private String model = "gpt-4o-mini";
    private int timeoutMs = 10000;
    private int maxInputRows = 8;
    private boolean fallbackOnError = true;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public int getTimeoutMs() {
        return timeoutMs;
    }

    public void setTimeoutMs(int timeoutMs) {
        this.timeoutMs = timeoutMs;
    }

    public int getMaxInputRows() {
        return maxInputRows;
    }

    public void setMaxInputRows(int maxInputRows) {
        this.maxInputRows = maxInputRows;
    }

    public boolean isFallbackOnError() {
        return fallbackOnError;
    }

    public void setFallbackOnError(boolean fallbackOnError) {
        this.fallbackOnError = fallbackOnError;
    }
}
