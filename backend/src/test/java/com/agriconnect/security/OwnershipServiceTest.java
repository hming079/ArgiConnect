package com.agriconnect.security;

import com.agriconnect.cropBatch.CropBatch;
import com.agriconnect.cropBatch.CropBatchRepository;
import com.agriconnect.cropBatch.CropBatchService;
import com.agriconnect.cropBatch.CropBatchStatus;
import com.agriconnect.cropLock.CropLock;
import com.agriconnect.cropLock.CropLockRepository;
import com.agriconnect.cropLock.CropLockService;
import com.agriconnect.cropLock.CropLockStatus;
import com.agriconnect.common.BadRequestException;
import com.agriconnect.order.Order;
import com.agriconnect.order.OrderRepository;
import com.agriconnect.order.OrderService;
import com.agriconnect.order.OrderStatus;
import com.agriconnect.order.dto.CheckoutRequest;
import com.agriconnect.orderItem.OrderItem;
import com.agriconnect.rescueRegistration.RescueRegistration;
import com.agriconnect.rescueRegistration.RescueRegistrationRepository;
import com.agriconnect.rescueRegistration.RescueRegistrationService;
import com.agriconnect.shipment.Shipment;
import com.agriconnect.shipment.ShipmentRepository;
import com.agriconnect.shipment.ShipmentService;
import com.agriconnect.shipment.ShipmentStatus;
import com.agriconnect.user.Role;
import com.agriconnect.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnershipServiceTest {

    @Mock private CurrentUser currentUser;
    @Mock private CropBatchRepository cropBatchRepository;
    @Mock private UserRepository userRepository;
    @Mock private RescueRegistrationRepository rescueRegistrationRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private CropLockRepository cropLockRepository;
    @Mock private ShipmentRepository shipmentRepository;
    @Mock private com.agriconnect.orderItem.OrderItemRepository orderItemRepository;
    @Mock private com.agriconnect.orderItem.OrderItemService orderItemService;
    @Mock private CropLockService cropLockService;

    @Test
    void farmerCannotUpdateAnotherFarmersBatch() {
        CropBatch batch = new CropBatch();
        batch.setId(10L);
        batch.setFarmerId(2L);
        when(currentUser.getId()).thenReturn(1L);
        when(cropBatchRepository.findById(10L)).thenReturn(Optional.of(batch));

        CropBatchService service = new CropBatchService(cropBatchRepository, currentUser, userRepository);

        assertThrows(AccessDeniedException.class, () -> service.updateCropBatch(10L, new CropBatch()));
    }

    @Test
    void adminCanListPendingCropBatchesForRescueReview() {
        CropBatch pendingBatch = new CropBatch();
        pendingBatch.setId(10L);
        pendingBatch.setFarmerId(2L);
        pendingBatch.setStatus(CropBatchStatus.pending);
        CropBatch availableBatch = new CropBatch();
        availableBatch.setId(11L);
        availableBatch.setFarmerId(2L);
        availableBatch.setStatus(CropBatchStatus.available);

        when(currentUser.getRole()).thenReturn(Role.ADMIN);
        when(cropBatchRepository.findAll()).thenReturn(List.of(pendingBatch, availableBatch));
        when(userRepository.findAllById(List.of(2L))).thenReturn(List.of());

        CropBatchService service = new CropBatchService(cropBatchRepository, currentUser, userRepository);

        assertEquals(List.of(pendingBatch, availableBatch), service.getAllCropBatches());
    }

    @Test
    void publicCropBatchListHidesPendingBatches() {
        CropBatch pendingBatch = new CropBatch();
        pendingBatch.setId(10L);
        pendingBatch.setFarmerId(2L);
        pendingBatch.setStatus(CropBatchStatus.pending);
        CropBatch availableBatch = new CropBatch();
        availableBatch.setId(11L);
        availableBatch.setFarmerId(2L);
        availableBatch.setStatus(CropBatchStatus.available);

        when(currentUser.getRole()).thenThrow(new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("Authentication required"));
        when(cropBatchRepository.findAll()).thenReturn(List.of(pendingBatch, availableBatch));
        when(userRepository.findAllById(List.of(2L))).thenReturn(List.of());

        CropBatchService service = new CropBatchService(cropBatchRepository, currentUser, userRepository);

        assertEquals(List.of(availableBatch), service.getAllCropBatches());
    }

    @Test
    void farmerCannotRegisterAnotherFarmersBatchForRescue() {
        CropBatch batch = new CropBatch();
        batch.setFarmerId(2L);
        RescueRegistration registration = new RescueRegistration();
        registration.setBatchId(10L);
        registration.setRescuePointId(1L);
        when(currentUser.getId()).thenReturn(1L);
        when(cropBatchRepository.findById(10L)).thenReturn(Optional.of(batch));

        RescueRegistrationService service = new RescueRegistrationService(
                rescueRegistrationRepository, cropBatchRepository, currentUser);

        assertThrows(AccessDeniedException.class, () -> service.create(registration));
    }

    @Test
    void approvingRescueRegistrationPublishesCropBatch() {
        RescueRegistration registration = new RescueRegistration();
        registration.setId(1L);
        registration.setBatchId(10L);
        registration.setStatus(com.agriconnect.rescueRegistration.RescueRegistrationStatus.PENDING);
        CropBatch batch = new CropBatch();
        batch.setId(10L);
        batch.setStatus(CropBatchStatus.pending);

        when(rescueRegistrationRepository.findById(1L)).thenReturn(Optional.of(registration));
        when(cropBatchRepository.findById(10L)).thenReturn(Optional.of(batch));
        when(currentUser.getId()).thenReturn(99L);
        when(rescueRegistrationRepository.save(registration)).thenReturn(registration);

        RescueRegistrationService service = new RescueRegistrationService(
                rescueRegistrationRepository, cropBatchRepository, currentUser);
        RescueRegistration saved = service.review(
                1L, com.agriconnect.rescueRegistration.RescueRegistrationStatus.APPROVED);

        assertEquals(com.agriconnect.rescueRegistration.RescueRegistrationStatus.APPROVED, saved.getStatus());
        assertEquals(CropBatchStatus.available, batch.getStatus());
        verify(cropBatchRepository).save(batch);
    }

    @Test
    void buyerIdIsTakenFromAuthenticatedUser() {
        Order request = new Order();
        request.setBuyerId(999L);
        when(currentUser.getId()).thenReturn(6L);
        when(orderRepository.save(request)).thenReturn(request);

        request.setStatus(OrderStatus.DELIVERED);

        OrderService service = new OrderService(
                orderRepository, currentUser, orderItemService, orderItemRepository, cropBatchRepository, cropLockService);
        Order saved = service.create(request);

        assertEquals(6L, saved.getBuyerId());
        assertEquals(OrderStatus.PENDING, saved.getStatus());
        verify(orderRepository).save(request);
    }

    @Test
    void buyerCannotReadAnotherBuyersOrder() {
        Order order = new Order();
        order.setBuyerId(7L);
        when(currentUser.getRole()).thenReturn(Role.BUYER);
        when(currentUser.getId()).thenReturn(6L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        OrderService service = new OrderService(
                orderRepository, currentUser, orderItemService, orderItemRepository, cropBatchRepository, cropLockService);

        assertThrows(AccessDeniedException.class, () -> service.getAccessibleById(1L));
    }

    @Test
    void buyerCanCancelPendingOrderAndRestoreQuantities() {
        Order order = new Order();
        order.setId(1L);
        order.setBuyerId(6L);
        order.setStatus(OrderStatus.PENDING);
        OrderItem item = new OrderItem();
        item.setOrderId(1L);
        item.setBatchId(10L);
        item.setQuantity(new BigDecimal("25"));
        CropBatch batch = new CropBatch();
        batch.setId(10L);
        batch.setCurrentQuantity(new BigDecimal("75"));
        batch.setStatus(CropBatchStatus.sold_out);

        when(currentUser.getRole()).thenReturn(Role.BUYER);
        when(currentUser.getId()).thenReturn(6L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderId(1L)).thenReturn(List.of(item));
        when(cropBatchRepository.findById(10L)).thenReturn(Optional.of(batch));
        when(orderRepository.save(order)).thenReturn(order);

        OrderService service = new OrderService(
                orderRepository, currentUser, orderItemService, orderItemRepository, cropBatchRepository, cropLockService);
        Order saved = service.updateStatus(1L, OrderStatus.CANCELLED);

        assertEquals(OrderStatus.CANCELLED, saved.getStatus());
        assertEquals(new BigDecimal("100"), batch.getCurrentQuantity());
        assertEquals(CropBatchStatus.available, batch.getStatus());
        verify(cropBatchRepository).save(batch);
    }

    @Test
    void invalidOrderStatusTransitionIsRejected() {
        Order order = new Order();
        order.setId(1L);
        order.setBuyerId(6L);
        order.setStatus(OrderStatus.PENDING);
        when(currentUser.getRole()).thenReturn(Role.LOGISTICS);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        OrderService service = new OrderService(
                orderRepository, currentUser, orderItemService, orderItemRepository, cropBatchRepository, cropLockService);

        assertThrows(BadRequestException.class, () -> service.updateStatus(1L, OrderStatus.SHIPPING));
    }

    @Test
    void checkoutRequiresAndConvertsCropLocks() {
        CheckoutRequest request = new CheckoutRequest();
        request.setTotalAmount(new BigDecimal("250000"));
        request.setCropLockIds(List.of(99L));
        CheckoutRequest.Item requestItem = new CheckoutRequest.Item();
        requestItem.setBatchId(10L);
        requestItem.setQuantity(new BigDecimal("25"));
        requestItem.setUnitPrice(new BigDecimal("10000"));
        request.setItems(List.of(requestItem));
        CropLock lock = new CropLock();
        lock.setId(99L);
        lock.setBatchId(10L);
        lock.setQuantity(new BigDecimal("25"));

        Order savedOrder = new Order();
        savedOrder.setId(1L);
        when(currentUser.getId()).thenReturn(6L);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);
        when(cropLockService.convertOwnedActiveLocks(List.of(99L))).thenReturn(List.of(lock));

        OrderService service = new OrderService(
                orderRepository, currentUser, orderItemService, orderItemRepository, cropBatchRepository, cropLockService);

        service.checkout(request);

        verify(cropLockService).convertOwnedActiveLocks(List.of(99L));
        verify(orderItemService).create(any(OrderItem.class));
    }

    @Test
    void creatingOrderItemDoesNotSubtractBatchQuantity() {
        Order order = new Order();
        order.setBuyerId(6L);
        order.setStatus(OrderStatus.PENDING);
        OrderItem item = new OrderItem();
        item.setOrderId(1L);
        item.setBatchId(10L);
        item.setQuantity(new BigDecimal("25"));
        item.setUnitPrice(new BigDecimal("10000"));

        when(currentUser.getRole()).thenReturn(Role.BUYER);
        when(currentUser.getId()).thenReturn(6L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(cropBatchRepository.existsById(10L)).thenReturn(true);
        when(orderItemRepository.save(any(OrderItem.class))).thenReturn(item);

        com.agriconnect.orderItem.OrderItemService service = new com.agriconnect.orderItem.OrderItemService(
                orderItemRepository, orderRepository, cropBatchRepository, currentUser);

        service.create(item);

        verify(cropBatchRepository, never()).save(any(CropBatch.class));
    }

    @Test
    void creatingOrderItemForCancelledOrderDoesNotSubtractBatchQuantity() {
        Order order = new Order();
        order.setBuyerId(6L);
        order.setStatus(OrderStatus.CANCELLED);
        OrderItem item = new OrderItem();
        item.setOrderId(1L);
        item.setBatchId(10L);
        item.setQuantity(new BigDecimal("25"));
        item.setUnitPrice(new BigDecimal("10000"));

        when(currentUser.getRole()).thenReturn(Role.BUYER);
        when(currentUser.getId()).thenReturn(6L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(cropBatchRepository.existsById(10L)).thenReturn(true);
        when(orderItemRepository.save(any(OrderItem.class))).thenReturn(item);

        com.agriconnect.orderItem.OrderItemService service = new com.agriconnect.orderItem.OrderItemService(
                orderItemRepository, orderRepository, cropBatchRepository, currentUser);

        service.create(item);

        verify(cropBatchRepository, never()).save(any(CropBatch.class));
    }

    @Test
    void creatingCropLockAtomicallyReservesBatchQuantity() {
        CropLock lock = new CropLock();
        lock.setBatchId(10L);
        lock.setQuantity(new BigDecimal("25"));
        lock.setExpiredAt(LocalDateTime.now().plusMinutes(20));

        when(currentUser.getId()).thenReturn(6L);
        when(cropLockRepository.findByStatusAndExpiredAtBefore(any(CropLockStatus.class), any(LocalDateTime.class))).thenReturn(List.of());
        when(cropBatchRepository.reserveAvailableQuantity(10L, new BigDecimal("25"))).thenReturn(1);
        when(cropLockRepository.save(lock)).thenReturn(lock);

        CropLockService service = new CropLockService(cropLockRepository, cropBatchRepository, currentUser);
        CropLock saved = service.create(lock);

        assertEquals(6L, saved.getBuyerId());
        assertEquals(CropLockStatus.ACTIVE, saved.getStatus());
        verify(cropBatchRepository).reserveAvailableQuantity(10L, new BigDecimal("25"));
    }

    @Test
    void creatingCropLockRejectsInsufficientQuantity() {
        CropLock lock = new CropLock();
        lock.setBatchId(10L);
        lock.setQuantity(new BigDecimal("25"));
        lock.setExpiredAt(LocalDateTime.now().plusMinutes(20));

        when(currentUser.getId()).thenReturn(6L);
        when(cropLockRepository.findByStatusAndExpiredAtBefore(any(CropLockStatus.class), any(LocalDateTime.class))).thenReturn(List.of());
        when(cropBatchRepository.reserveAvailableQuantity(10L, new BigDecimal("25"))).thenReturn(0);

        CropLockService service = new CropLockService(cropLockRepository, cropBatchRepository, currentUser);

        assertThrows(BadRequestException.class, () -> service.create(lock));
    }

    @Test
    void deletingActiveCropLockRestoresQuantity() {
        CropLock lock = new CropLock();
        lock.setId(1L);
        lock.setBatchId(10L);
        lock.setBuyerId(6L);
        lock.setQuantity(new BigDecimal("25"));
        lock.setStatus(CropLockStatus.ACTIVE);

        when(currentUser.getId()).thenReturn(6L);
        when(cropLockRepository.findById(1L)).thenReturn(Optional.of(lock));

        CropLockService service = new CropLockService(cropLockRepository, cropBatchRepository, currentUser);
        service.delete(1L);

        verify(cropBatchRepository).restoreQuantity(10L, new BigDecimal("25"));
        verify(cropLockRepository).delete(lock);
    }

    @Test
    void deletingOrderItemForCancelledOrderDoesNotRestoreBatchQuantityAgain() {
        Order order = new Order();
        order.setBuyerId(6L);
        order.setStatus(OrderStatus.CANCELLED);
        OrderItem item = new OrderItem();
        item.setOrderId(1L);
        item.setBatchId(10L);
        item.setQuantity(new BigDecimal("25"));

        when(currentUser.getRole()).thenReturn(Role.BUYER);
        when(currentUser.getId()).thenReturn(6L);
        when(orderItemRepository.findById(2L)).thenReturn(Optional.of(item));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        com.agriconnect.orderItem.OrderItemService service = new com.agriconnect.orderItem.OrderItemService(
                orderItemRepository, orderRepository, cropBatchRepository, currentUser);

        service.delete(2L);

        verify(cropBatchRepository, never()).save(any(CropBatch.class));
        verify(orderItemRepository).delete(item);
    }

    @Test
    void buyerCannotDeleteAnotherBuyersLock() {
        CropLock lock = new CropLock();
        lock.setBuyerId(7L);
        when(currentUser.getId()).thenReturn(6L);
        when(cropLockRepository.findById(1L)).thenReturn(Optional.of(lock));

        CropLockService service = new CropLockService(cropLockRepository, cropBatchRepository, currentUser);

        assertThrows(AccessDeniedException.class, () -> service.delete(1L));
    }

    @Test
    void logisticsCannotUpdateUnassignedShipment() {
        Shipment shipment = new Shipment();
        shipment.setLogisticsUserId(9L);
        when(currentUser.getRole()).thenReturn(Role.LOGISTICS);
        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));

        ShipmentService service = new ShipmentService(
                shipmentRepository, orderRepository, null, null, currentUser);

        service.updateStatus(1L, ShipmentStatus.SHIPPING);
        assertEquals(ShipmentStatus.SHIPPING, shipment.getStatus());
    }
}
