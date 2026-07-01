package com.agriconnect.analytics;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final AnalyticsService service;

    public AnalyticsController(AnalyticsService service) {
        this.service = service;
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'BUYER', 'LOGISTICS')")
    public AnalyticsDtos.OverviewResponse overview() {
        return service.overview();
    }

    @GetMapping("/province-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'BUYER', 'LOGISTICS')")
    public List<AnalyticsDtos.ProvinceStat> provinceStats() {
        return service.provinceStats();
    }

    @GetMapping("/rescue-rates")
    @PreAuthorize("hasAnyRole('ADMIN', 'BUYER', 'LOGISTICS')")
    public List<AnalyticsDtos.RescueRateRow> rescueRates(
            @RequestParam(defaultValue = "province") String groupBy) {
        return service.rescueRates(groupBy);
    }

    @GetMapping("/supply-capacity")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOGISTICS')")
    public List<AnalyticsDtos.SupplyCapacityRow> supplyCapacity(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            @RequestParam(required = false) String province) {
        return service.supplyCapacity(startDate, endDate, province);
    }

    @GetMapping("/congestion-risk")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOGISTICS')")
    public List<AnalyticsDtos.CongestionRiskRow> congestionRisk() {
        return service.congestionRisk();
    }

    @GetMapping("/forecast-inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'BUYER', 'LOGISTICS')")
    public AnalyticsDtos.ForecastInventoryResponse forecastInventory(
            @RequestParam(defaultValue = "7") int days) {
        return service.forecastInventory(days);
    }
}
