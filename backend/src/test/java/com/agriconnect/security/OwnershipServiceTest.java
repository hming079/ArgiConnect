package com.agriconnect.security;

import com.agriconnect.cropBatch.CropBatch;
import com.agriconnect.cropBatch.CropBatchRepository;
import com.agriconnect.cropBatch.CropBatchService;
import com.agriconnect.cropLock.CropLock;
import com.agriconnect.cropLock.CropLockRepository;
import com.agriconnect.cropLock.CropLockService;
import com.agriconnect.order.Order;
import com.agriconnect.order.OrderRepository;
import com.agriconnect.order.OrderService;
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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
    void buyerIdIsTakenFromAuthenticatedUser() {
        Order request = new Order();
        request.setBuyerId(999L);
        when(currentUser.getId()).thenReturn(6L);
        when(orderRepository.save(request)).thenReturn(request);

        OrderService service = new OrderService(orderRepository, currentUser);
        Order saved = service.create(request);

        assertEquals(6L, saved.getBuyerId());
        verify(orderRepository).save(request);
    }

    @Test
    void buyerCannotReadAnotherBuyersOrder() {
        Order order = new Order();
        order.setBuyerId(7L);
        when(currentUser.getRole()).thenReturn(Role.BUYER);
        when(currentUser.getId()).thenReturn(6L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        OrderService service = new OrderService(orderRepository, currentUser);

        assertThrows(AccessDeniedException.class, () -> service.getAccessibleById(1L));
    }

    @Test
    void buyerCannotDeleteAnotherBuyersLock() {
        CropLock lock = new CropLock();
        lock.setBuyerId(7L);
        when(currentUser.getId()).thenReturn(6L);
        when(cropLockRepository.findById(1L)).thenReturn(Optional.of(lock));

        CropLockService service = new CropLockService(cropLockRepository, currentUser);

        assertThrows(AccessDeniedException.class, () -> service.delete(1L));
    }

    @Test
    void logisticsCannotUpdateUnassignedShipment() {
        Shipment shipment = new Shipment();
        shipment.setLogisticsUserId(9L);
        when(currentUser.getId()).thenReturn(8L);
        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));

        ShipmentService service = new ShipmentService(shipmentRepository, currentUser);

        assertThrows(AccessDeniedException.class,
                () -> service.updateStatus(1L, ShipmentStatus.IN_TRANSIT));
    }
}
