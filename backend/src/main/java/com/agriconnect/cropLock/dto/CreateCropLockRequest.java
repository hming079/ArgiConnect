package com.agriconnect.cropLock.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CreateCropLockRequest {
    private Long batchId;
    private BigDecimal quantity;
    private LocalDateTime expiredAt;

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }

    public void setExpiredAt(LocalDateTime expiredAt) {
        this.expiredAt = expiredAt;
    }
}
