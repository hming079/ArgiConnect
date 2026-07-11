package com.agriconnect.order.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CreateOrderRequest {
    private BigDecimal totalAmount;
    private LocalDateTime orderDate;

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }
}
