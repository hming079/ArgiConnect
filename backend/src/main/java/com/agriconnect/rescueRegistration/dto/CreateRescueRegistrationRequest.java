package com.agriconnect.rescueRegistration.dto;

public class CreateRescueRegistrationRequest {
    private Long batchId;
    private Long rescuePointId;

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public Long getRescuePointId() {
        return rescuePointId;
    }

    public void setRescuePointId(Long rescuePointId) {
        this.rescuePointId = rescuePointId;
    }
}
