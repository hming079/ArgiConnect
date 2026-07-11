package com.agriconnect.forecast;

import com.agriconnect.common.BadRequestException;
import com.agriconnect.forecastDataset.ForecastDatasetRecord;
import com.agriconnect.forecastDataset.ForecastDatasetRepository;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ForecastResultService {
    private final ForecastResultRepository repository;
    private final ForecastDatasetRepository datasetRepository;
    private final AiForecastClient aiForecastClient;

    public ForecastResultService(
            ForecastResultRepository repository,
            ForecastDatasetRepository datasetRepository,
            AiForecastClient aiForecastClient) {
        this.repository = repository;
        this.datasetRepository = datasetRepository;
        this.aiForecastClient = aiForecastClient;
    }

    public List<ForecastResult> getAll(String province, String cropName, Integer year, Integer month) {
        String provinceQuery = normalizeFilter(province);
        String cropQuery = normalizeFilter(cropName);
        return repository.findAll().stream()
                .filter(item -> provinceQuery == null || item.getProvince().toLowerCase().contains(provinceQuery))
                .filter(item -> cropQuery == null || item.getCropName().toLowerCase().contains(cropQuery))
                .filter(item -> year == null || year.equals(item.getYear()))
                .filter(item -> month == null || month.equals(item.getMonth()))
                .sorted(Comparator.comparing(ForecastResult::getCreatedAt).reversed())
                .toList();
    }

    @Transactional
    public ImportResult importCsv() {
        Path csvPath = resolveForecastCsv();
        if (!Files.exists(csvPath)) {
            throw new BadRequestException("Forecast CSV not found at: " + csvPath);
        }

        try {
            List<String> lines = Files.readAllLines(csvPath);
            if (lines.size() <= 1) {
                return new ImportResult(0, csvPath.toString());
            }

            Map<String, Integer> headers = headerIndex(lines.get(0));
            List<ForecastResult> results = new ArrayList<>();
            for (int index = 1; index < lines.size(); index++) {
                if (lines.get(index).isBlank()) {
                    continue;
                }
                List<String> values = parseCsvLine(lines.get(index));
                results.add(toForecastResult(headers, values));
            }
            Set<String> modelNames = results.stream()
                    .map(ForecastResult::getModelName)
                    .collect(Collectors.toSet());
            modelNames.forEach(repository::deleteByModelName);
            repository.saveAll(results);
            return new ImportResult(results.size(), csvPath.toString());
        } catch (IOException exception) {
            throw new BadRequestException("Could not read forecast CSV: " + exception.getMessage());
        }
    }

    @Transactional
    public ClearResult clear() {
        long deletedRows = repository.count();
        repository.deleteAllInBatch();
        return new ClearResult(deletedRows);
    }

    @Transactional
    public GenerateResult generateWithAiService() {
        List<ForecastDatasetRecord> datasetRows = datasetRepository.findAll();
        if (datasetRows.isEmpty()) {
            throw new BadRequestException("No backend AI dataset found. Import dataset before generating AI forecasts.");
        }

        List<AiForecastClient.ForecastRequestItem> requestItems = datasetRows.stream()
                .map(row -> new AiForecastClient.ForecastRequestItem(
                        row.getProvince(),
                        row.getCropName(),
                        row.getYear(),
                        row.getMonth(),
                        row.getSoldQuantity(),
                        row.getAveragePrice()))
                .toList();

        AiForecastClient.BatchForecastResponse response = aiForecastClient.predictBatch(requestItems);
        List<ForecastResult> results = response.predictions().stream()
                .map(this::toForecastResult)
                .toList();

        String modelName = response.modelName() == null || response.modelName().isBlank()
                ? "AIServiceModel"
                : response.modelName();
        repository.deleteByModelName(modelName);
        repository.saveAll(results);
        return new GenerateResult(results.size(), aiForecastClient.getServiceUrl(), modelName);
    }

    @Transactional
    public ImportResult importDataset() {
        Path csvPath = resolveDatasetCsv();
        if (!Files.exists(csvPath)) {
            throw new BadRequestException("Cleaned AI dataset not found at: " + csvPath);
        }

        try {
            List<String> lines = Files.readAllLines(csvPath);
            if (lines.size() <= 1) {
                return new ImportResult(0, csvPath.toString());
            }

            Map<String, Integer> headers = headerIndex(lines.get(0));
            List<ForecastResult> results = new ArrayList<>();
            for (int index = 1; index < lines.size(); index++) {
                if (lines.get(index).isBlank()) {
                    continue;
                }
                List<String> values = parseCsvLine(lines.get(index));
                results.add(toDatasetForecastResult(headers, values));
            }

            repository.deleteByModelName("HistoricalDataset");
            repository.saveAll(results);
            return new ImportResult(results.size(), csvPath.toString());
        } catch (IOException exception) {
            throw new BadRequestException("Could not read cleaned AI dataset: " + exception.getMessage());
        }
    }

    private ForecastResult toForecastResult(Map<String, Integer> headers, List<String> values) {
        ForecastResult result = new ForecastResult();
        result.setProvince(value(headers, values, "province"));
        result.setCropName(value(headers, values, "crop_name"));
        result.setYear(Integer.valueOf(value(headers, values, "year")));
        result.setMonth(Integer.valueOf(value(headers, values, "month")));
        result.setPredictedQuantity(new BigDecimal(value(headers, values, "predicted_quantity")));
        result.setModelName(valueOrDefault(headers, values, "model_name", "RandomForestRegressor"));
        return result;
    }

    private ForecastResult toDatasetForecastResult(Map<String, Integer> headers, List<String> values) {
        ForecastResult result = new ForecastResult();
        result.setProvince(value(headers, values, "province"));
        result.setCropName(value(headers, values, "crop_name"));
        result.setYear(Integer.valueOf(value(headers, values, "year")));
        result.setMonth(Integer.valueOf(value(headers, values, "month")));
        result.setPredictedQuantity(new BigDecimal(value(headers, values, "harvest_quantity")));
        result.setModelName("HistoricalDataset");
        return result;
    }

    private ForecastResult toForecastResult(AiForecastClient.ForecastPrediction prediction) {
        ForecastResult result = new ForecastResult();
        result.setProvince(prediction.province());
        result.setCropName(prediction.cropName());
        result.setYear(prediction.year());
        result.setMonth(prediction.month());
        result.setPredictedQuantity(prediction.predictedQuantity());
        result.setModelName(prediction.modelName());
        return result;
    }

    private Path resolveForecastCsv() {
        Path projectRootPath = Path.of("ai", "data", "forecast_result.csv");
        if (Files.exists(projectRootPath)) {
            return projectRootPath.toAbsolutePath().normalize();
        }
        return Path.of("..", "ai", "data", "forecast_result.csv").toAbsolutePath().normalize();
    }

    private Path resolveDatasetCsv() {
        Path projectRootPath = Path.of("ai", "data", "cleaned_agri_forecast_dataset.csv");
        if (Files.exists(projectRootPath)) {
            return projectRootPath.toAbsolutePath().normalize();
        }
        return Path.of("..", "ai", "data", "cleaned_agri_forecast_dataset.csv").toAbsolutePath().normalize();
    }

    private Map<String, Integer> headerIndex(String headerLine) {
        List<String> headers = parseCsvLine(headerLine);
        Map<String, Integer> index = new HashMap<>();
        for (int i = 0; i < headers.size(); i++) {
            index.put(headers.get(i).trim(), i);
        }
        return index;
    }

    private String value(Map<String, Integer> headers, List<String> values, String column) {
        Integer index = headers.get(column);
        if (index == null || index >= values.size() || values.get(index).isBlank()) {
            throw new BadRequestException("Forecast CSV is missing required value: " + column);
        }
        return values.get(index).trim();
    }

    private String valueOrDefault(Map<String, Integer> headers, List<String> values, String column, String fallback) {
        Integer index = headers.get(column);
        if (index == null || index >= values.size() || values.get(index).isBlank()) {
            return fallback;
        }
        return values.get(index).trim();
    }

    private String normalizeFilter(String value) {
        return value == null || value.isBlank() ? null : value.trim().toLowerCase();
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                quoted = !quoted;
            } else if (ch == ',' && !quoted) {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(ch);
            }
        }
        values.add(current.toString());
        return values;
    }

    public record ImportResult(int importedRows, String sourcePath) {}
    public record ClearResult(long deletedRows) {}
    public record GenerateResult(int importedRows, String sourcePath, String modelName) {}
}
