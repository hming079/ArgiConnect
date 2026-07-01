package com.agriconnect.order;

import java.util.List;
import java.math.BigDecimal;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import com.agriconnect.common.BadRequestException;
import com.agriconnect.common.ResourceNotFoundException;
import com.agriconnect.cropBatch.CropBatch;
import com.agriconnect.cropBatch.CropBatchRepository;
import com.agriconnect.cropBatch.CropBatchStatus;
import com.agriconnect.cropLock.CropLock;
import com.agriconnect.cropLock.CropLockService;
import com.agriconnect.order.dto.CheckoutRequest;
import com.agriconnect.orderItem.OrderItem;
import com.agriconnect.orderItem.OrderItemRepository;
import com.agriconnect.orderItem.OrderItemService;
import com.agriconnect.security.CurrentUser;
import com.agriconnect.shipment.Shipment;
import com.agriconnect.shipment.ShipmentRepository;
import com.agriconnect.shipment.ShipmentStatus;
import com.agriconnect.user.Role;
import com.agriconnect.user.User;
import com.agriconnect.user.UserRepository;

@Service
public class OrderService {
    private final OrderRepository repository;
    private final CurrentUser currentUser;
    private final OrderItemService orderItemService;
    private final OrderItemRepository orderItemRepository;
    private final CropBatchRepository cropBatchRepository;
    private final CropLockService cropLockService;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;

    public OrderService(
            OrderRepository repository,
            CurrentUser currentUser,
            OrderItemService orderItemService,
            OrderItemRepository orderItemRepository,
            CropBatchRepository cropBatchRepository,
            CropLockService cropLockService,
            ShipmentRepository shipmentRepository,
            UserRepository userRepository) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.orderItemService = orderItemService;
        this.orderItemRepository = orderItemRepository;
        this.cropBatchRepository = cropBatchRepository;
        this.cropLockService = cropLockService;
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
    }

    public List<Order> getAll(Long buyerId, OrderStatus status) {
        List<Order> orders = switch (currentUser.getRole()) {
            case ADMIN, LOGISTICS -> repository.findAll();
            case BUYER -> repository.findByBuyerId(currentUser.getId());
            case FARMER -> repository.findAll().stream()
                    .filter(this::isCurrentFarmerOrder)
                    .toList();
        };

        return orders.stream()
                .filter(order -> buyerId == null || buyerId.equals(order.getBuyerId()))
                .filter(order -> status == null || status == order.getStatus())
                .toList();
    }

    public Order getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    public List<Order> getMyOrders() {
        return repository.findByBuyerId(currentUser.getId());
    }

    public Order getAccessibleById(Long id) {
        Order order = getById(id);
        if (currentUser.getRole() != Role.ADMIN && !order.getBuyerId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Buyers can only access their own orders");
        }
        return order;
    }

    public Order create(Order order) {
        if (order == null) {
            throw new BadRequestException("Order request is required");
        }
        order.setId(null);
        order.setBuyerId(currentUser.getId());
        order.setStatus(OrderStatus.PENDING);
        return repository.save(order);
    }

    @Transactional
    public Order checkout(CheckoutRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Checkout must include at least one item");
        }
        if (request.getDeliveryAddress() == null || request.getDeliveryAddress().isBlank()) {
            throw new BadRequestException("Delivery address is required");
        }
        List<CropLock> locks = cropLockService.convertOwnedActiveLocks(request.getCropLockIds());
        assertLocksCoverItems(request.getItems(), locks);

        Order order = new Order();
        order.setTotalAmount(request.getTotalAmount());
        order.setStatus(OrderStatus.PENDING);
        order.setOrderDate(request.getOrderDate());
        Order saved = create(order);

        for (CheckoutRequest.Item requestItem : request.getItems()) {
            OrderItem item = new OrderItem();
            item.setOrderId(saved.getId());
            item.setBatchId(requestItem.getBatchId());
            item.setQuantity(requestItem.getQuantity());
            item.setUnitPrice(requestItem.getUnitPrice());
            orderItemService.create(item);
        }

        createShipmentForCheckout(saved, request);
        return saved;
    }

    @Transactional
    public Order updateStatus(Long id, OrderStatus nextStatus) {
        if (nextStatus == null) {
            throw new BadRequestException("Order status is required");
        }

        Order order = getById(id);
        assertCanChangeStatus(order, nextStatus);
        assertValidTransition(order.getStatus(), nextStatus);

        if (nextStatus == OrderStatus.CANCELLED) {
            restoreOrderQuantities(order);
        }

        order.setStatus(nextStatus);
        return repository.save(order);
    }

    public Order update(Long id, Order request) {
        if (request == null) {
            throw new BadRequestException("Order request is required");
        }
        Order order = getById(id);
        order.setBuyerId(request.getBuyerId());
        order.setTotalAmount(request.getTotalAmount());
        order.setOrderDate(request.getOrderDate());
        return repository.save(order);
    }

    public void delete(Long id) { repository.delete(getById(id)); }

    private void assertCanChangeStatus(Order order, OrderStatus nextStatus) {
        Role role = currentUser.getRole();
        boolean allowed = switch (nextStatus) {
            case PENDING -> false;
            case CONFIRMED -> role == Role.ADMIN || (role == Role.FARMER && isCurrentFarmerOrder(order));
            case PACKING -> (role == Role.FARMER && isCurrentFarmerOrder(order)) || role == Role.LOGISTICS;
            case SHIPPING, DELIVERED -> role == Role.LOGISTICS;
            case CANCELLED -> role == Role.ADMIN || (role == Role.BUYER && order.getBuyerId().equals(currentUser.getId()));
        };
        if (!allowed) {
            throw new AccessDeniedException("This role cannot change order to " + nextStatus);
        }
    }

    private void assertValidTransition(OrderStatus currentStatus, OrderStatus nextStatus) {
        boolean valid = switch (currentStatus) {
            case PENDING -> nextStatus == OrderStatus.CONFIRMED || nextStatus == OrderStatus.CANCELLED;
            case CONFIRMED -> nextStatus == OrderStatus.PACKING || nextStatus == OrderStatus.CANCELLED;
            case PACKING -> nextStatus == OrderStatus.SHIPPING;
            case SHIPPING -> nextStatus == OrderStatus.DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };
        if (!valid) {
            throw new BadRequestException("Invalid order status transition from " + currentStatus + " to " + nextStatus);
        }
    }

    private boolean isCurrentFarmerOrder(Order order) {
        Long farmerId = currentUser.getId();
        return orderItemRepository.findByOrderId(order.getId()).stream()
                .anyMatch(item -> cropBatchRepository.findById(item.getBatchId())
                        .map(batch -> farmerId.equals(batch.getFarmerId()))
                        .orElse(false));
    }

    private void restoreOrderQuantities(Order order) {
        for (OrderItem item : orderItemRepository.findByOrderId(order.getId())) {
            CropBatch batch = cropBatchRepository.findById(item.getBatchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Crop batch not found with id: " + item.getBatchId()));
            batch.setCurrentQuantity(batch.getCurrentQuantity().add(item.getQuantity()));
            syncQuantityStatus(batch);
            cropBatchRepository.save(batch);
        }
    }

    private void assertLocksCoverItems(List<CheckoutRequest.Item> items, List<CropLock> locks) {
        Map<Long, BigDecimal> itemQuantities = items.stream()
                .collect(Collectors.toMap(
                        CheckoutRequest.Item::getBatchId,
                        CheckoutRequest.Item::getQuantity,
                        BigDecimal::add));
        Map<Long, BigDecimal> lockQuantities = locks.stream()
                .collect(Collectors.toMap(
                        CropLock::getBatchId,
                        CropLock::getQuantity,
                        BigDecimal::add));
        if (!itemQuantities.keySet().equals(lockQuantities.keySet())) {
            throw new BadRequestException("Crop locks must match checkout items");
        }
        itemQuantities.forEach((batchId, quantity) -> {
            BigDecimal locked = lockQuantities.get(batchId);
            if (locked == null || locked.compareTo(quantity) != 0) {
                throw new BadRequestException("Crop lock quantity does not match checkout item for batch " + batchId);
            }
        });
    }

    private void createShipmentForCheckout(Order order, CheckoutRequest request) {
        Shipment shipment = new Shipment();
        shipment.setOrderId(order.getId());
        shipment.setLogisticsUserId(defaultLogisticsUserId());
        shipment.setPickupAddress(buildPickupAddress(request.getItems()));
        shipment.setDeliveryAddress(request.getDeliveryAddress().trim());
        shipment.setStatus(ShipmentStatus.PENDING);
        shipment.setShippedAt(null);
        shipment.setDeliveredAt(null);
        shipmentRepository.save(shipment);
    }

    private Long defaultLogisticsUserId() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.LOGISTICS)
                .filter(User::isActive)
                .map(User::getId)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("No active logistics user is available for shipment"));
    }

    private String buildPickupAddress(List<CheckoutRequest.Item> items) {
        String address = items.stream()
                .map(item -> cropBatchRepository.findById(item.getBatchId())
                        .orElseThrow(() -> new ResourceNotFoundException("Crop batch not found with id: " + item.getBatchId())))
                .map(this::formatBatchAddress)
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .collect(Collectors.joining(" | "));
        if (address.isBlank()) {
            throw new BadRequestException("Pickup address is missing for checkout items");
        }
        return address;
    }

    private String formatBatchAddress(CropBatch batch) {
        if (batch.getAddressDetail() != null && !batch.getAddressDetail().isBlank()
                && java.util.stream.Stream.of(batch.getWard(), batch.getDistrict(), batch.getProvince())
                        .filter(value -> value != null && !value.isBlank())
                        .anyMatch(part -> batch.getAddressDetail().contains(part))) {
            return batch.getAddressDetail();
        }
        return java.util.stream.Stream.of(batch.getAddressDetail(), batch.getWard(), batch.getDistrict(), batch.getProvince())
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(", "));
    }

    private void syncQuantityStatus(CropBatch batch) {
        if (batch.getStatus() == CropBatchStatus.expired || batch.getStatus() == CropBatchStatus.cancelled) {
            return;
        }
        if (batch.getCurrentQuantity().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            batch.setStatus(CropBatchStatus.sold_out);
            return;
        }
        if (batch.getStatus() == null || batch.getStatus() == CropBatchStatus.sold_out) {
            batch.setStatus(CropBatchStatus.available);
        }
    }
}
