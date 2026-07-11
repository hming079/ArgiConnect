package com.agriconnect.inventoryRisk;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.agriconnect.crop.Crop;
import com.agriconnect.crop.CropRepository;
import com.agriconnect.cropBatch.CropBatch;
import com.agriconnect.cropBatch.CropBatchRepository;
import com.agriconnect.cropBatch.CropBatchStatus;
import com.agriconnect.inventoryRisk.InventoryRiskResponse.RiskLevel;
import com.agriconnect.order.Order;
import com.agriconnect.order.OrderRepository;
import com.agriconnect.order.OrderStatus;
import com.agriconnect.orderItem.OrderItem;
import com.agriconnect.orderItem.OrderItemRepository;

@Service
public class InventoryRiskForecastService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal SAFE_DEFAULT_DAILY_SALES = BigDecimal.valueOf(10);

    private final CropBatchRepository cropBatchRepository;
    private final CropRepository cropRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final InventoryRiskCalculator calculator;

    public InventoryRiskForecastService(
            CropBatchRepository cropBatchRepository,
            CropRepository cropRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            InventoryRiskCalculator calculator) {
        this.cropBatchRepository = cropBatchRepository;
        this.cropRepository = cropRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.calculator = calculator;
    }

    public InventoryRiskResponse forecastRisk(CropBatch cropBatch) {
        Snapshot snapshot = loadSnapshot();
        Crop crop = snapshot.cropsById().get(cropBatch.getCropId());
        return calculator.calculate(cropBatch, crop, estimateDailySales(cropBatch, snapshot));
    }

    public List<InventoryRiskResponse> forecastAll(String province, String cropName, RiskLevel riskLevel) {
        Snapshot snapshot = loadSnapshot();
        String provinceQuery = normalize(province);
        String cropQuery = normalize(cropName);

        return snapshot.batches().stream()
                .filter(this::isActiveBatch)
                .map(batch -> calculator.calculate(batch, snapshot.cropsById().get(batch.getCropId()), estimateDailySales(batch, snapshot)))
                .filter(row -> provinceQuery.isEmpty() || normalize(row.province()).contains(provinceQuery))
                .filter(row -> cropQuery.isEmpty() || normalize(row.cropName()).contains(cropQuery))
                .filter(row -> riskLevel == null || row.riskLevel() == riskLevel)
                .sorted(Comparator.comparing(InventoryRiskResponse::riskScore).reversed())
                .toList();
    }

    public InventoryRiskSummaryResponse summary() {
        List<InventoryRiskResponse> rows = forecastAll(null, null, null);
        long high = rows.stream().filter(row -> row.riskLevel() == RiskLevel.HIGH).count();
        long medium = rows.stream().filter(row -> row.riskLevel() == RiskLevel.MEDIUM).count();
        long low = rows.stream().filter(row -> row.riskLevel() == RiskLevel.LOW).count();
        BigDecimal averageRisk = rows.isEmpty()
                ? ZERO
                : rows.stream()
                        .map(InventoryRiskResponse::riskScore)
                        .reduce(ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(rows.size()), 2, RoundingMode.HALF_UP);
        String topProvince = topGroup(rows, InventoryRiskResponse::province);
        String topCropName = topGroup(rows, InventoryRiskResponse::cropName);
        return new InventoryRiskSummaryResponse(rows.size(), high, medium, low, averageRisk, topProvince, topCropName);
    }

    private BigDecimal estimateDailySales(CropBatch batch, Snapshot snapshot) {
        // Prefer direct sales history for this batch: sold quantity / days since harvest.
        BigDecimal directRate = averageDailySalesForBatches(List.of(batch), snapshot);
        if (directRate.compareTo(ZERO) > 0) return directRate;

        // If the batch has no sales yet, fall back to same crop and province.
        List<CropBatch> similarBatches = snapshot.batches().stream()
                .filter(other -> other.getId() != null && !other.getId().equals(batch.getId()))
                .filter(other -> other.getCropId() != null && other.getCropId().equals(batch.getCropId()))
                .filter(other -> normalize(other.getProvince()).equals(normalize(batch.getProvince())))
                .toList();
        BigDecimal similarRate = averageDailySalesForBatches(similarBatches, snapshot);
        if (similarRate.compareTo(ZERO) > 0) return similarRate;

        // Final safe default keeps the rule-based module usable before the app has much order history.
        return SAFE_DEFAULT_DAILY_SALES;
    }

    private BigDecimal averageDailySalesForBatches(List<CropBatch> batches, Snapshot snapshot) {
        if (batches.isEmpty()) return ZERO;
        Set<Long> batchIds = batches.stream().map(CropBatch::getId).collect(Collectors.toSet());
        BigDecimal sold = snapshot.visibleOrderItems().stream()
                .filter(item -> batchIds.contains(item.getBatchId()))
                .map(OrderItem::getQuantity)
                .filter(quantity -> quantity != null && quantity.compareTo(ZERO) > 0)
                .reduce(ZERO, BigDecimal::add);
        if (sold.compareTo(ZERO) <= 0) return ZERO;

        LocalDate firstHarvestDate = batches.stream()
                .map(CropBatch::getHarvestDate)
                .filter(date -> date != null && !date.isAfter(LocalDate.now()))
                .min(LocalDate::compareTo)
                .orElse(LocalDate.now());
        long daysSinceHarvest = Math.max(1, ChronoUnit.DAYS.between(firstHarvestDate, LocalDate.now()) + 1);
        return sold.divide(BigDecimal.valueOf(daysSinceHarvest), 2, RoundingMode.HALF_UP);
    }

    private Snapshot loadSnapshot() {
        List<CropBatch> batches = cropBatchRepository.findAll();
        List<Crop> crops = cropRepository.findAll();
        List<Order> visibleOrders = orderRepository.findAll().stream()
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .toList();
        Set<Long> visibleOrderIds = visibleOrders.stream().map(Order::getId).collect(Collectors.toSet());
        List<OrderItem> visibleOrderItems = orderItemRepository.findAll().stream()
                .filter(item -> visibleOrderIds.contains(item.getOrderId()))
                .toList();
        return new Snapshot(
                batches,
                crops.stream()
                        .filter(crop -> crop.getId() != null)
                        .collect(Collectors.toMap(Crop::getId, Function.identity(), (first, duplicate) -> first)),
                visibleOrderItems);
    }

    private boolean isActiveBatch(CropBatch batch) {
        return batch.getStatus() == CropBatchStatus.available
                && batch.getCurrentQuantity() != null
                && batch.getCurrentQuantity().compareTo(ZERO) > 0;
    }

    private String topGroup(List<InventoryRiskResponse> rows, Function<InventoryRiskResponse, String> classifier) {
        return rows.stream()
                .collect(Collectors.groupingBy(classifier, Collectors.averagingDouble(row -> row.riskScore().doubleValue())))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private record Snapshot(
            List<CropBatch> batches,
            Map<Long, Crop> cropsById,
            List<OrderItem> visibleOrderItems) {
    }
}
