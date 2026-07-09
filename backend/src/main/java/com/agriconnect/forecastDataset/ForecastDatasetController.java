package com.agriconnect.forecastDataset;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/forecast-dataset")
@SecurityRequirement(name = "bearerAuth")
public class ForecastDatasetController {
    private final ForecastDatasetService service;

    public ForecastDatasetController(ForecastDatasetService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ForecastDatasetRecord> getAll(
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String cropName,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return service.getAll(province, cropName, year, month);
    }

    @PostMapping("/import-csv")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Import cleaned AI training dataset", description = "Reads ai/data/cleaned_agri_forecast_dataset.csv into backend")
    public ForecastDatasetService.ImportResult importCsv() {
        return service.importCsv();
    }

    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Clear AI training dataset", description = "Deletes all backend-owned AI training dataset rows")
    public ForecastDatasetService.ClearResult clear() {
        return service.clear();
    }
}
