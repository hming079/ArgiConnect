package com.agriconnect.analytics;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.agriconnect.security.CurrentUser;
import com.agriconnect.user.Role;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final AnalyticsService service;
    private final CurrentUser currentUser;

    public AnalyticsController(AnalyticsService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
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
        if (currentUser.getRole() == Role.BUYER && groupBy != null && !"province".equalsIgnoreCase(groupBy)) {
            throw new AccessDeniedException("Buyers can only access province-level rescue rates");
        }
        return service.rescueRates(groupBy);
    }

    @GetMapping("/supply-capacity")
    @PreAuthorize("hasAnyRole('ADMIN', 'BUYER', 'LOGISTICS')")
    public List<AnalyticsDtos.SupplyCapacityRow> supplyCapacity(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) Long cropId) {
        return service.supplyCapacity(startDate, endDate, province, cropId);
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
