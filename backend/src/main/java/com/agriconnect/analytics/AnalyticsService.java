package com.agriconnect.analytics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.agriconnect.analytics.AnalyticsDtos.CongestionRiskRow;
import com.agriconnect.analytics.AnalyticsDtos.ForecastInventoryPoint;
import com.agriconnect.analytics.AnalyticsDtos.ForecastInventoryResponse;
import com.agriconnect.analytics.AnalyticsDtos.OverviewResponse;
import com.agriconnect.analytics.AnalyticsDtos.ProvinceStat;
import com.agriconnect.analytics.AnalyticsDtos.RescueRateRow;
import com.agriconnect.analytics.AnalyticsDtos.RiskLevel;
import com.agriconnect.analytics.AnalyticsDtos.SupplyCapacityRow;
import com.agriconnect.crop.Crop;
import com.agriconnect.crop.CropRepository;
import com.agriconnect.cropBatch.CropBatch;
import com.agriconnect.cropBatch.CropBatchRepository;
import com.agriconnect.order.Order;
import com.agriconnect.order.OrderRepository;
import com.agriconnect.order.OrderStatus;
import com.agriconnect.orderItem.OrderItem;
import com.agriconnect.orderItem.OrderItemRepository;
import com.agriconnect.rescuePoint.RescuePoint;
import com.agriconnect.rescuePoint.RescuePointRepository;
import com.agriconnect.rescueRegistration.RescueRegistration;
import com.agriconnect.rescueRegistration.RescueRegistrationRepository;
import com.agriconnect.rescueRegistration.RescueRegistrationStatus;
import com.agriconnect.shipment.Shipment;
import com.agriconnect.shipment.ShipmentRepository;
import com.agriconnect.shipment.ShipmentStatus;

@Service
public class AnalyticsService {
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final int DEFAULT_FORECAST_DAYS = 7;

    private final CropBatchRepository cropBatchRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RescueRegistrationRepository rescueRegistrationRepository;
    private final RescuePointRepository rescuePointRepository;
    private final ShipmentRepository shipmentRepository;
    private final CropRepository cropRepository;

    public AnalyticsService(
            CropBatchRepository cropBatchRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            RescueRegistrationRepository rescueRegistrationRepository,
            RescuePointRepository rescuePointRepository,
            ShipmentRepository shipmentRepository,
            CropRepository cropRepository) {
        this.cropBatchRepository = cropBatchRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.rescueRegistrationRepository = rescueRegistrationRepository;
        this.rescuePointRepository = rescuePointRepository;
        this.shipmentRepository = shipmentRepository;
        this.cropRepository = cropRepository;
    }

    public OverviewResponse overview() {
        Snapshot snapshot = loadSnapshot();
        BigDecimal totalProduction = sum(snapshot.batches(), CropBatch::getInitialQuantity);
        BigDecimal currentInventory = currentInventory(snapshot.batches());
        BigDecimal sold = soldQuantity(snapshot);
        BigDecimal rescuing = rescuingQuantity(snapshot);
        BigDecimal inTransit = inTransitQuantity(snapshot);
        BigDecimal averageConsumption = averageDailyConsumption(snapshot);
        BigDecimal incomingHarvest = averageDailyHarvest(snapshot, null).multiply(BigDecimal.valueOf(DEFAULT_FORECAST_DAYS));
        BigDecimal availableSupply = currentInventory.add(incomingHarvest).subtract(averageConsumption.multiply(BigDecimal.valueOf(DEFAULT_FORECAST_DAYS))).max(ZERO);
        List<ForecastInventoryPoint> forecastPoints = List.of(
                forecastPoint(snapshot, 7),
                forecastPoint(snapshot, 14),
                forecastPoint(snapshot, 30));
        BigDecimal riskScore = average(
                provinceStats(snapshot).stream().map(ProvinceStat::congestionRiskScore).toList());

        return new OverviewResponse(
                totalProduction,
                currentInventory,
                sold,
                rescuing,
                inTransit,
                rescueSuccessRate(snapshot),
                averageConsumption,
                coverageDays(currentInventory, averageConsumption),
                incomingHarvest,
                availableSupply,
                shipmentCompletionRate(snapshot.shipments()),
                averageDeliveryTime(snapshot.shipments()),
                riskScore,
                riskLevel(riskScore),
                forecastPoints);
    }

    public List<ProvinceStat> provinceStats() {
        Snapshot snapshot = loadSnapshot();
        return provinceStats(snapshot);
    }

    private List<ProvinceStat> provinceStats(Snapshot snapshot) {
        return snapshot.batches().stream()
                .map(batch -> blankToUnknown(batch.getProvince()))
                .distinct()
                .sorted()
                .map(province -> provinceStat(snapshot, province))
                .toList();
    }

    public List<RescueRateRow> rescueRates(String groupBy) {
        Snapshot snapshot = loadSnapshot();
        String normalized = groupBy == null ? "province" : groupBy.toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "crop" -> rescueRatesByCrop(snapshot);
            case "rescuepoint" -> rescueRatesByRescuePoint(snapshot);
            case "province" -> rescueRatesByProvince(snapshot);
            default -> rescueRatesByProvince(snapshot);
        };
    }

    public List<SupplyCapacityRow> supplyCapacity(LocalDate startDate, LocalDate endDate, String province) {
        Snapshot snapshot = loadSnapshot();
        LocalDate start = startDate != null ? startDate : LocalDate.now();
        LocalDate end = endDate != null ? endDate : start.plusDays(DEFAULT_FORECAST_DAYS - 1L);
        int days = daysBetween(start, end);
        String query = province == null ? "" : province.trim().toLowerCase(Locale.ROOT);

        return snapshot.batches().stream()
                .map(batch -> blankToUnknown(batch.getProvince()))
                .distinct()
                .filter(name -> query.isEmpty() || name.toLowerCase(Locale.ROOT).contains(query))
                .sorted()
                .map(name -> supplyCapacityForProvince(snapshot, name, days))
                .toList();
    }

    public List<CongestionRiskRow> congestionRisk() {
        Snapshot snapshot = loadSnapshot();
        Map<String, List<CropBatch>> groups = snapshot.batches().stream()
                .collect(Collectors.groupingBy(batch -> blankToUnknown(batch.getProvince()) + "::" + cropName(snapshot, batch.getCropId())));
        return groups.entrySet().stream()
                .map(entry -> congestionRiskForGroup(snapshot, entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(CongestionRiskRow::riskScore).reversed())
                .toList();
    }

    public ForecastInventoryResponse forecastInventory(int days) {
        Snapshot snapshot = loadSnapshot();
        int safeDays = days == 14 || days == 30 ? days : 7;
        ForecastInventoryPoint point = forecastPoint(snapshot, safeDays);
        return new ForecastInventoryResponse(
                safeDays,
                point.currentInventory(),
                averageDailyHarvest(snapshot, null),
                point.expectedHarvest(),
                averageDailyConsumption(snapshot),
                point.expectedConsumption(),
                point.forecastInventory(),
                List.of(forecastPoint(snapshot, 7), forecastPoint(snapshot, 14), forecastPoint(snapshot, 30)));
    }

    private ProvinceStat provinceStat(Snapshot snapshot, String province) {
        List<CropBatch> batches = snapshot.batches().stream()
                .filter(batch -> blankToUnknown(batch.getProvince()).equals(province))
                .toList();
        BigDecimal total = sum(batches, CropBatch::getInitialQuantity);
        BigDecimal inventory = currentInventory(batches);
        BigDecimal rescuing = rescuingQuantity(snapshot, batches);
        BigDecimal consumed = soldQuantity(snapshot, batches);
        BigDecimal inTransit = inTransitQuantity(snapshot, batches);
        BigDecimal consumptionRate = averageDailyConsumption(snapshot, batches);
        BigDecimal harvestIncoming = averageDailyHarvest(snapshot, batches).multiply(BigDecimal.valueOf(DEFAULT_FORECAST_DAYS));
        BigDecimal availableSupply = inventory.add(harvestIncoming).subtract(consumptionRate.multiply(BigDecimal.valueOf(DEFAULT_FORECAST_DAYS))).max(ZERO);
        BigDecimal riskScore = riskScore(snapshot, batches, inventory, harvestIncoming, consumptionRate);
        return new ProvinceStat(
                province,
                total,
                inventory,
                rescuing,
                consumed,
                inTransit,
                consumptionRate,
                rescueSuccessRate(snapshot, batches),
                coverageDays(inventory.add(rescuing), consumptionRate),
                harvestIncoming,
                availableSupply,
                riskScore,
                riskLevel(riskScore));
    }

    private SupplyCapacityRow supplyCapacityForProvince(Snapshot snapshot, String province, int days) {
        List<CropBatch> batches = snapshot.batches().stream()
                .filter(batch -> blankToUnknown(batch.getProvince()).equals(province))
                .toList();
        BigDecimal dailyHarvest = averageDailyHarvest(snapshot, batches);
        BigDecimal immediate = currentInventory(batches).add(rescuingQuantity(snapshot, batches));
        BigDecimal incoming = dailyHarvest.multiply(BigDecimal.valueOf(days));
        BigDecimal consumption = averageDailyConsumption(snapshot, batches).multiply(BigDecimal.valueOf(days));
        BigDecimal totalSupply = immediate.add(incoming);
        return new SupplyCapacityRow(
                province,
                days,
                dailyHarvest,
                immediate,
                incoming,
                consumption,
                totalSupply,
                totalSupply.subtract(consumption).max(ZERO));
    }

    private CongestionRiskRow congestionRiskForGroup(Snapshot snapshot, String key, List<CropBatch> batches) {
        String[] parts = key.split("::", 2);
        String province = parts[0];
        String cropName = parts.length > 1 ? parts[1] : "Unknown crop";
        BigDecimal inventory = currentInventory(batches);
        BigDecimal consumption = averageDailyConsumption(snapshot, batches);
        BigDecimal incoming = averageDailyHarvest(snapshot, batches).multiply(BigDecimal.valueOf(DEFAULT_FORECAST_DAYS));
        BigDecimal rescueRate = rescueSuccessRate(snapshot, batches);
        BigDecimal score = riskScore(snapshot, batches, inventory, incoming, consumption);
        Integer storageDays = batches.stream()
                .map(batch -> snapshot.cropsById().get(batch.getCropId()))
                .filter(crop -> crop != null && crop.getStorageDays() != null)
                .map(Crop::getStorageDays)
                .max(Integer::compareTo)
                .orElse(7);
        LocalDate earliestExpiry = batches.stream()
                .map(CropBatch::getExpiryDate)
                .filter(date -> date != null && !date.isBefore(LocalDate.now()))
                .min(LocalDate::compareTo)
                .orElse(null);
        return new CongestionRiskRow(
                province,
                cropName,
                inventory,
                incoming,
                consumption,
                storageDays,
                earliestExpiry,
                rescueRate,
                score,
                riskLevel(score),
                recommendation(score, province, cropName));
    }

    private List<RescueRateRow> rescueRatesByProvince(Snapshot snapshot) {
        return snapshot.batches().stream()
                .map(batch -> blankToUnknown(batch.getProvince()))
                .distinct()
                .sorted()
                .map(province -> {
                    List<CropBatch> batches = snapshot.batches().stream()
                            .filter(batch -> blankToUnknown(batch.getProvince()).equals(province))
                            .toList();
                    return rescueRateRow("province", province, snapshot, batches);
                })
                .toList();
    }

    private List<RescueRateRow> rescueRatesByCrop(Snapshot snapshot) {
        return snapshot.cropsById().values().stream()
                .sorted(Comparator.comparing(Crop::getName))
                .map(crop -> {
                    List<CropBatch> batches = snapshot.batches().stream()
                            .filter(batch -> crop.getId().equals(batch.getCropId()))
                            .toList();
                    return rescueRateRow("crop", crop.getName(), snapshot, batches);
                })
                .filter(row -> row.totalQuantity().compareTo(ZERO) > 0)
                .toList();
    }

    private List<RescueRateRow> rescueRatesByRescuePoint(Snapshot snapshot) {
        Map<Long, List<RescueRegistration>> byPoint = snapshot.approvedRescueRegistrations().stream()
                .collect(Collectors.groupingBy(RescueRegistration::getRescuePointId));
        return byPoint.entrySet().stream()
                .map(entry -> {
                    RescuePoint point = snapshot.rescuePointsById().get(entry.getKey());
                    String name = point == null ? "Rescue point #" + entry.getKey() : point.getName();
                    List<CropBatch> batches = entry.getValue().stream()
                            .map(registration -> snapshot.batchesById().get(registration.getBatchId()))
                            .filter(batch -> batch != null)
                            .toList();
                    return rescueRateRow("rescuePoint", name, snapshot, batches);
                })
                .sorted(Comparator.comparing(RescueRateRow::name))
                .toList();
    }

    private RescueRateRow rescueRateRow(String group, String name, Snapshot snapshot, List<CropBatch> batches) {
        List<CropBatch> rescueBatches = batches.stream()
                .filter(batch -> snapshot.approvedRescueBatchIds().contains(batch.getId()))
                .toList();
        BigDecimal total = sum(rescueBatches, CropBatch::getInitialQuantity);
        BigDecimal rescued = soldQuantity(snapshot, rescueBatches);
        return new RescueRateRow(group, name, rescued, total, percent(rescued, total));
    }

    private ForecastInventoryPoint forecastPoint(Snapshot snapshot, int days) {
        BigDecimal currentInventory = currentInventory(snapshot.batches());
        BigDecimal expectedHarvest = averageDailyHarvest(snapshot, null).multiply(BigDecimal.valueOf(days));
        BigDecimal expectedConsumption = averageDailyConsumption(snapshot).multiply(BigDecimal.valueOf(days));
        return new ForecastInventoryPoint(
                days,
                currentInventory,
                expectedHarvest,
                expectedConsumption,
                currentInventory.add(expectedHarvest).subtract(expectedConsumption).max(ZERO));
    }

    private BigDecimal riskScore(
            Snapshot snapshot,
            List<CropBatch> batches,
            BigDecimal currentInventory,
            BigDecimal incomingHarvest,
            BigDecimal averageDailyConsumption) {
        int maxStorageDays = batches.stream()
                .map(batch -> snapshot.cropsById().get(batch.getCropId()))
                .filter(crop -> crop != null && crop.getStorageDays() != null)
                .map(Crop::getStorageDays)
                .max(Integer::compareTo)
                .orElse(7);
        BigDecimal coverage = coverageDays(currentInventory.add(incomingHarvest), averageDailyConsumption);
        BigDecimal inventoryPressure = coverage
                .divide(BigDecimal.valueOf(Math.max(1, maxStorageDays)), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(35))
                .min(BigDecimal.valueOf(35));
        BigDecimal harvestPressure = incomingHarvest
                .divide(currentInventory.add(BigDecimal.ONE), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(20))
                .min(BigDecimal.valueOf(20));
        long daysToExpiry = batches.stream()
                .map(CropBatch::getExpiryDate)
                .filter(date -> date != null && !date.isBefore(LocalDate.now()))
                .map(date -> ChronoUnit.DAYS.between(LocalDate.now(), date))
                .min(Long::compareTo)
                .orElse(30L);
        BigDecimal expiryPressure = daysToExpiry <= 3
                ? BigDecimal.valueOf(25)
                : daysToExpiry <= 7 ? BigDecimal.valueOf(15) : daysToExpiry <= 14 ? BigDecimal.valueOf(8) : ZERO;
        BigDecimal rescueFailure = BigDecimal.valueOf(100)
                .subtract(rescueSuccessRate(snapshot, batches))
                .multiply(new BigDecimal("0.20"))
                .max(ZERO);
        return inventoryPressure.add(harvestPressure).add(expiryPressure).add(rescueFailure)
                .min(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private RiskLevel riskLevel(BigDecimal score) {
        if (score.compareTo(BigDecimal.valueOf(70)) >= 0) return RiskLevel.HIGH;
        if (score.compareTo(BigDecimal.valueOf(40)) >= 0) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    private String recommendation(BigDecimal score, String province, String cropName) {
        RiskLevel level = riskLevel(score);
        return switch (level) {
            case HIGH -> "Prioritize rescue points and outbound shipments for " + cropName + " in " + province + ".";
            case MEDIUM -> "Monitor storage coverage and prepare buyer outreach for " + cropName + " in " + province + ".";
            case LOW -> "Supply is stable for " + cropName + " in " + province + ".";
        };
    }

    private BigDecimal currentInventory(List<CropBatch> batches) {
        return sum(batches, CropBatch::getCurrentQuantity);
    }

    private BigDecimal rescuingQuantity(Snapshot snapshot) {
        return rescuingQuantity(snapshot, snapshot.batches());
    }

    private BigDecimal rescuingQuantity(Snapshot snapshot, List<CropBatch> batches) {
        return sum(batches.stream()
                .filter(batch -> snapshot.approvedRescueBatchIds().contains(batch.getId()))
                .toList(), CropBatch::getCurrentQuantity);
    }

    private BigDecimal soldQuantity(Snapshot snapshot) {
        return soldQuantity(snapshot, snapshot.batches());
    }

    private BigDecimal soldQuantity(Snapshot snapshot, List<CropBatch> batches) {
        Set<Long> batchIds = batches.stream().map(CropBatch::getId).collect(Collectors.toSet());
        return sum(snapshot.visibleOrderItems().stream()
                .filter(item -> batchIds.contains(item.getBatchId()))
                .toList(), OrderItem::getQuantity);
    }

    private BigDecimal inTransitQuantity(Snapshot snapshot) {
        return inTransitQuantity(snapshot, snapshot.batches());
    }

    private BigDecimal inTransitQuantity(Snapshot snapshot, List<CropBatch> batches) {
        Set<Long> batchIds = batches.stream().map(CropBatch::getId).collect(Collectors.toSet());
        Set<Long> inTransitOrderIds = snapshot.shipments().stream()
                .filter(shipment -> shipment.getStatus() != ShipmentStatus.DELIVERED && shipment.getStatus() != ShipmentStatus.CANCELLED)
                .map(Shipment::getOrderId)
                .collect(Collectors.toSet());
        return sum(snapshot.visibleOrderItems().stream()
                .filter(item -> inTransitOrderIds.contains(item.getOrderId()))
                .filter(item -> batchIds.contains(item.getBatchId()))
                .toList(), OrderItem::getQuantity);
    }

    private BigDecimal averageDailyConsumption(Snapshot snapshot) {
        return averageDailyConsumption(snapshot, snapshot.batches());
    }

    private BigDecimal averageDailyConsumption(Snapshot snapshot, List<CropBatch> batches) {
        BigDecimal sold = soldQuantity(snapshot, batches);
        LocalDateTime firstOrder = snapshot.visibleOrders().stream()
                .map(order -> order.getOrderDate() != null ? order.getOrderDate() : order.getCreatedAt())
                .filter(date -> date != null)
                .min(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());
        long days = Math.max(1, ChronoUnit.DAYS.between(firstOrder.toLocalDate(), LocalDate.now()) + 1);
        return sold.divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal averageDailyHarvest(Snapshot snapshot, List<CropBatch> subset) {
        List<CropBatch> batches = subset == null ? snapshot.batches() : subset;
        if (batches.isEmpty()) return ZERO;
        LocalDate min = batches.stream()
                .map(CropBatch::getHarvestDate)
                .filter(date -> date != null)
                .min(LocalDate::compareTo)
                .orElse(LocalDate.now());
        LocalDate max = batches.stream()
                .map(CropBatch::getHarvestDate)
                .filter(date -> date != null)
                .max(LocalDate::compareTo)
                .orElse(LocalDate.now());
        long days = Math.max(1, ChronoUnit.DAYS.between(min, max) + 1);
        return sum(batches, CropBatch::getInitialQuantity).divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal rescueSuccessRate(Snapshot snapshot) {
        return rescueSuccessRate(snapshot, snapshot.batches());
    }

    private BigDecimal rescueSuccessRate(Snapshot snapshot, List<CropBatch> batches) {
        List<CropBatch> rescueBatches = batches.stream()
                .filter(batch -> snapshot.approvedRescueBatchIds().contains(batch.getId()))
                .toList();
        BigDecimal total = sum(rescueBatches, CropBatch::getInitialQuantity);
        BigDecimal rescued = soldQuantity(snapshot, rescueBatches);
        return percent(rescued, total);
    }

    private BigDecimal shipmentCompletionRate(List<Shipment> shipments) {
        if (shipments.isEmpty()) return ZERO;
        long delivered = shipments.stream().filter(shipment -> shipment.getStatus() == ShipmentStatus.DELIVERED).count();
        return BigDecimal.valueOf(delivered)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(shipments.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal averageDeliveryTime(List<Shipment> shipments) {
        List<BigDecimal> deliveryDays = shipments.stream()
                .filter(shipment -> shipment.getShippedAt() != null && shipment.getDeliveredAt() != null)
                .map(shipment -> BigDecimal.valueOf(Duration.between(shipment.getShippedAt(), shipment.getDeliveredAt()).toHours())
                        .divide(BigDecimal.valueOf(24), 2, RoundingMode.HALF_UP))
                .toList();
        return average(deliveryDays);
    }

    private BigDecimal coverageDays(BigDecimal inventory, BigDecimal averageDailyConsumption) {
        if (averageDailyConsumption.compareTo(ZERO) <= 0) return inventory.compareTo(ZERO) > 0 ? BigDecimal.valueOf(999) : ZERO;
        return inventory.divide(averageDailyConsumption, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal percent(BigDecimal numerator, BigDecimal denominator) {
        if (denominator.compareTo(ZERO) <= 0) return ZERO;
        return numerator.multiply(BigDecimal.valueOf(100)).divide(denominator, 2, RoundingMode.HALF_UP).min(BigDecimal.valueOf(100));
    }

    private BigDecimal average(List<BigDecimal> values) {
        if (values.isEmpty()) return ZERO;
        return values.stream().reduce(ZERO, BigDecimal::add).divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private <T> BigDecimal sum(List<T> items, Function<T, BigDecimal> extractor) {
        BigDecimal total = ZERO;
        for (T item : items) {
            BigDecimal value = extractor.apply(item);
            if (value != null) total = total.add(value);
        }
        return total;
    }

    private int daysBetween(LocalDate start, LocalDate end) {
        if (end.isBefore(start)) return 0;
        return Math.toIntExact(ChronoUnit.DAYS.between(start, end) + 1);
    }

    private String cropName(Snapshot snapshot, Long cropId) {
        Crop crop = snapshot.cropsById().get(cropId);
        return crop == null ? "Crop #" + cropId : crop.getName();
    }

    private String blankToUnknown(String value) {
        return value == null || value.isBlank() ? "Unknown" : value;
    }

    private Snapshot loadSnapshot() {
        List<CropBatch> batches = cropBatchRepository.findAll();
        List<Order> orders = orderRepository.findAll();
        Map<Long, Order> ordersById = mapById(orders, Order::getId);
        List<Order> visibleOrders = orders.stream()
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .toList();
        Set<Long> visibleOrderIds = visibleOrders.stream().map(Order::getId).collect(Collectors.toSet());
        List<OrderItem> visibleItems = orderItemRepository.findAll().stream()
                .filter(item -> visibleOrderIds.contains(item.getOrderId()))
                .toList();
        List<RescueRegistration> rescueRegistrations = rescueRegistrationRepository.findAll();
        List<RescueRegistration> approvedRescueRegistrations = rescueRegistrations.stream()
                .filter(registration -> registration.getStatus() == RescueRegistrationStatus.APPROVED)
                .toList();
        Set<Long> approvedRescueBatchIds = approvedRescueRegistrations.stream()
                .map(RescueRegistration::getBatchId)
                .collect(Collectors.toCollection(HashSet::new));

        return new Snapshot(
                batches,
                mapById(batches, CropBatch::getId),
                orders,
                visibleOrders,
                ordersById,
                visibleItems,
                approvedRescueRegistrations,
                approvedRescueBatchIds,
                mapById(rescuePointRepository.findAll(), RescuePoint::getId),
                shipmentRepository.findAll(),
                mapById(cropRepository.findAll(), Crop::getId));
    }

    private <T> Map<Long, T> mapById(List<T> items, Function<T, Long> idExtractor) {
        return items.stream()
                .filter(item -> idExtractor.apply(item) != null)
                .collect(Collectors.toMap(idExtractor, Function.identity(), (first, duplicate) -> first));
    }

    private record Snapshot(
            List<CropBatch> batches,
            Map<Long, CropBatch> batchesById,
            List<Order> orders,
            List<Order> visibleOrders,
            Map<Long, Order> ordersById,
            List<OrderItem> visibleOrderItems,
            List<RescueRegistration> approvedRescueRegistrations,
            Set<Long> approvedRescueBatchIds,
            Map<Long, RescuePoint> rescuePointsById,
            List<Shipment> shipments,
            Map<Long, Crop> cropsById) {}
}
