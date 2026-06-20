package com.agriconnect.cropLock;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "crop_locks")
public class CropLock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_id", nullable = false)
    private Long batchId;

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CropLockStatus status = CropLockStatus.ACTIVE;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    @PrePersist
    public void onCreate() {
        if (lockedAt == null) lockedAt = LocalDateTime.now();
        if (status == null) status = CropLockStatus.ACTIVE;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public CropLockStatus getStatus() { return status; }
    public void setStatus(CropLockStatus status) { this.status = status; }
    public LocalDateTime getLockedAt() { return lockedAt; }
    public void setLockedAt(LocalDateTime lockedAt) { this.lockedAt = lockedAt; }
    public LocalDateTime getExpiredAt() { return expiredAt; }
    public void setExpiredAt(LocalDateTime expiredAt) { this.expiredAt = expiredAt; }
}
