package com.agriconnect.forecastDataset;

import com.agriconnect.common.BadRequestException;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ForecastDatasetService {
    private final ForecastDatasetRepository repository;

    public ForecastDatasetService(ForecastDatasetRepository repository) {
        this.repository = repository;
    }

    public List<ForecastDatasetRecord> getAll(String province, String cropName, Integer year, Integer month) {
        String provinceQuery = normalizeFilter(province);
        String cropQuery = normalizeFilter(cropName);
        return repository.findAll().stream()
                .filter(item -> provinceQuery == null || item.getProvince().toLowerCase().contains(provinceQuery))
                .filter(item -> cropQuery == null || item.getCropName().toLowerCase().contains(cropQuery))
                .filter(item -> year == null || year.equals(item.getYear()))
                .filter(item -> month == null || month.equals(item.getMonth()))
                .sorted(Comparator
                        .comparing(ForecastDatasetRecord::getYear)
                        .thenComparing(ForecastDatasetRecord::getMonth)
                        .thenComparing(ForecastDatasetRecord::getProvince)
                        .thenComparing(ForecastDatasetRecord::getCropName))
                .toList();
    }

    @Transactional
    public ImportResult importCsv() {
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
            List<ForecastDatasetRecord> records = new ArrayList<>();
            for (int index = 1; index < lines.size(); index++) {
                if (!lines.get(index).isBlank()) {
                    records.add(toRecord(headers, parseCsvLine(lines.get(index))));
                }
            }

            repository.deleteAllInBatch();
            repository.saveAll(records);
            return new ImportResult(records.size(), csvPath.toString());
        } catch (IOException exception) {
            throw new BadRequestException("Could not read cleaned AI dataset: " + exception.getMessage());
        }
    }

    @Transactional
    public ClearResult clear() {
        long deletedRows = repository.count();
        repository.deleteAllInBatch();
        return new ClearResult(deletedRows);
    }

    private ForecastDatasetRecord toRecord(Map<String, Integer> headers, List<String> values) {
        ForecastDatasetRecord record = new ForecastDatasetRecord();
        record.setProvince(value(headers, values, "province"));
        record.setCropName(value(headers, values, "crop_name"));
        record.setYear(Integer.valueOf(value(headers, values, "year")));
        record.setMonth(Integer.valueOf(value(headers, values, "month")));
        record.setHarvestQuantity(new BigDecimal(value(headers, values, "harvest_quantity")));
        record.setSoldQuantity(new BigDecimal(value(headers, values, "sold_quantity")));
        record.setAveragePrice(new BigDecimal(value(headers, values, "average_price")));
        return record;
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
            throw new BadRequestException("Forecast dataset CSV is missing required value: " + column);
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
}
