package com.agriconnect.inventoryRisk;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.agriconnect.inventoryRisk.InventoryRiskResponse.RiskLevel;

@RestController
@RequestMapping("/api/inventory-risk-forecast")
public class InventoryRiskForecastController {
    private final InventoryRiskForecastService service;

    public InventoryRiskForecastController(InventoryRiskForecastService service) {
        this.service = service;
    }

    @GetMapping
    public List<InventoryRiskResponse> getAll(
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String cropName,
            @RequestParam(required = false) RiskLevel riskLevel) {
        return service.forecastAll(province, cropName, riskLevel);
    }

    @GetMapping("/summary")
    public InventoryRiskSummaryResponse summary() {
        return service.summary();
    }
}
