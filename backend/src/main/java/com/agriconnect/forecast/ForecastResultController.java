package com.agriconnect.forecast;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/forecasts")
@SecurityRequirement(name = "bearerAuth")
public class ForecastResultController {
    private final ForecastResultService service;

    public ForecastResultController(ForecastResultService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LOGISTICS')")
    public List<ForecastResult> getAll(
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String cropName,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return service.getAll(province, cropName, year, month);
    }

    @PostMapping("/import-csv")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Import local AI forecast CSV", description = "Reads ai/data/forecast_result.csv for local demo use")
    public ForecastResultService.ImportResult importCsv() {
        return service.importCsv();
    }

    @PostMapping("/generate-ai")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Generate forecasts with the local AI service", description = "Sends backend dataset rows to the FastAPI AI service and saves predictions")
    public ForecastResultService.GenerateResult generateAiForecast() {
        return service.generateWithAiService();
    }

    @PostMapping("/import-dataset")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Import cleaned AI dataset", description = "Reads ai/data/cleaned_agri_forecast_dataset.csv as historical baseline rows")
    public ForecastResultService.ImportResult importDataset() {
        return service.importDataset();
    }

    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Clear forecast results", description = "Deletes all imported forecast result rows")
    public ForecastResultService.ClearResult clear() {
        return service.clear();
    }
}
