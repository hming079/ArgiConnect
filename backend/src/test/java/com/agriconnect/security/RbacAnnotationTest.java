package com.agriconnect.security;

import com.agriconnect.crop.CropController;
import com.agriconnect.crop.Crop;
import com.agriconnect.cropBatch.CropBatch;
import com.agriconnect.cropBatch.CropBatchController;
import com.agriconnect.cropLock.CropLockController;
import com.agriconnect.order.OrderController;
import com.agriconnect.order.dto.CheckoutRequest;
import com.agriconnect.order.dto.OrderStatusUpdateRequest;
import com.agriconnect.rescueRegistration.RescueRegistrationController;
import com.agriconnect.shipment.ShipmentController;
import com.agriconnect.shipment.ShipmentStatus;
import com.agriconnect.user.UserController;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RbacAnnotationTest {

    @Test
    void cropMutationsRequireAdmin() throws Exception {
        assertRule(CropController.class, "createCrop", "hasRole('ADMIN')", Crop.class);
        assertRule(CropController.class, "updateCrop", "hasRole('ADMIN')", Long.class, Crop.class);
        assertRule(CropController.class, "deleteCrop", "hasRole('ADMIN')", Long.class);
    }

    @Test
    void farmerEndpointsRequireFarmer() throws Exception {
        assertRule(CropBatchController.class, "getMyCropBatches", "hasRole('FARMER')");
        assertRule(CropBatchController.class, "createCropBatch", "hasRole('FARMER')", CropBatch.class);
        assertRule(RescueRegistrationController.class, "create", "hasRole('FARMER')",
                com.agriconnect.rescueRegistration.RescueRegistration.class);
    }

    @Test
    void buyerEndpointsRequireBuyer() throws Exception {
        assertRule(OrderController.class, "getMyOrders", "hasRole('BUYER')");
        assertRule(OrderController.class, "checkout", "hasRole('BUYER')", CheckoutRequest.class);
        assertRule(OrderController.class, "updateStatus", "isAuthenticated()", Long.class, OrderStatusUpdateRequest.class);
        assertRule(CropLockController.class, "delete", "hasRole('BUYER')", Long.class);
    }

    @Test
    void logisticsEndpointsRequireLogistics() throws Exception {
        assertRule(ShipmentController.class, "getMyShipments", "isAuthenticated()");
        assertRule(ShipmentController.class, "updateStatus", "isAuthenticated()",
                Long.class, ShipmentStatus.class);
    }

    @Test
    void rescueReviewRequiresAdmin() throws Exception {
        assertRule(RescueRegistrationController.class, "approve", "hasRole('ADMIN')", Long.class);
        assertRule(RescueRegistrationController.class, "reject", "hasRole('ADMIN')", Long.class);
    }

    @Test
    void userListRequiresAdmin() throws Exception {
        assertRule(UserController.class, "getAllProfiles", "hasRole('ADMIN')");
    }

    private void assertRule(Class<?> type, String method, String expected, Class<?>... parameterTypes)
            throws Exception {
        PreAuthorize annotation = type.getMethod(method, parameterTypes).getAnnotation(PreAuthorize.class);
        assertEquals(expected, annotation.value());
    }
}
