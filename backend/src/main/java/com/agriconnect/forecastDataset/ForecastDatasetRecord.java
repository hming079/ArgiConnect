package com.agriconnect.forecastDataset;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "forecast_dataset_records")
public class ForecastDatasetRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String province;

    @Column(name = "crop_name", nullable = false, length = 100)
    private String cropName;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    private Integer month;

    @Column(name = "harvest_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal harvestQuantity;

    @Column(name = "sold_quantity", nullable = false, precision = 12, scale = 2)
    private BigDecimal soldQuantity;

    @Column(name = "average_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal averagePrice;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }
    public String getCropName() { return cropName; }
    public void setCropName(String cropName) { this.cropName = cropName; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }
    public BigDecimal getHarvestQuantity() { return harvestQuantity; }
    public void setHarvestQuantity(BigDecimal harvestQuantity) { this.harvestQuantity = harvestQuantity; }
    public BigDecimal getSoldQuantity() { return soldQuantity; }
    public void setSoldQuantity(BigDecimal soldQuantity) { this.soldQuantity = soldQuantity; }
    public BigDecimal getAveragePrice() { return averagePrice; }
    public void setAveragePrice(BigDecimal averagePrice) { this.averagePrice = averagePrice; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
