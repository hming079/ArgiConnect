package com.agriconnect.cropBatch;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;

import com.agriconnect.common.ResourceNotFoundException;
import com.agriconnect.security.CurrentUser;
import com.agriconnect.user.User;
import com.agriconnect.user.UserRepository;

@Service
public class CropBatchService {
    
    private final CropBatchRepository cropBatchRepository;
    private final CurrentUser currentUser;
    private final UserRepository userRepository;

    public CropBatchService(CropBatchRepository cropBatchRepository, CurrentUser currentUser, UserRepository userRepository){
        this.cropBatchRepository = cropBatchRepository;
        this.currentUser = currentUser;
        this.userRepository = userRepository;
    }

    public List<CropBatch> getAllCropBatches(){
        return addFarmerNames(cropBatchRepository.findAll());
    }

    public List<CropBatch> getCropBatchesByCropId(Long cropId) {
        return addFarmerNames(cropBatchRepository.findByCropId(cropId));
    }

    public List<CropBatch> getCropBatchesByFarmerId(Long farmerId) {
        return addFarmerNames(cropBatchRepository.findByFarmerId(farmerId));
    }

    public List<CropBatch> getMyCropBatches() {
        return addFarmerNames(cropBatchRepository.findByFarmerId(currentUser.getId()));
    }

    public List<CropBatch> getCropBatchesByStatus(CropBatchStatus status) {
        return addFarmerNames(cropBatchRepository.findByStatus(status));
    }

    public CropBatch getCropBatchById(Long id) {
        return cropBatchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop batch not found with id: " + id));
    }

    public CropBatch createCropBatch(CropBatch cropBatch) {
        cropBatch.setId(null);
        cropBatch.setFarmerId(currentUser.getId());
        if (cropBatch.getCurrentQuantity() == null) {
            cropBatch.setCurrentQuantity(cropBatch.getInitialQuantity());
        }
        if (cropBatch.getUnitPrice() == null) {
            cropBatch.setUnitPrice(BigDecimal.ZERO);
        }
        if (cropBatch.getStatus() == null) {
            cropBatch.setStatus(CropBatchStatus.available);
        }
        syncQuantityStatus(cropBatch);
        return cropBatchRepository.save(cropBatch);
    }

    public CropBatch updateCropBatch(Long id, CropBatch request) {
        CropBatch cropBatch = getCropBatchById(id);
        verifyOwner(cropBatch);

        cropBatch.setCropId(request.getCropId());
        cropBatch.setInitialQuantity(request.getInitialQuantity());
        cropBatch.setCurrentQuantity(request.getCurrentQuantity() == null
                ? request.getInitialQuantity()
                : request.getCurrentQuantity());
        cropBatch.setUnitPrice(request.getUnitPrice() == null ? BigDecimal.ZERO : request.getUnitPrice());
        cropBatch.setUnit(request.getUnit());
        cropBatch.setHarvestDate(request.getHarvestDate());
        cropBatch.setExpiryDate(request.getExpiryDate());
        cropBatch.setProvince(request.getProvince());
        cropBatch.setDistrict(request.getDistrict());
        cropBatch.setWard(request.getWard());
        cropBatch.setAddressDetail(request.getAddressDetail());
        cropBatch.setStatus(request.getStatus());
        syncQuantityStatus(cropBatch);

        return cropBatchRepository.save(cropBatch);
    }

    public void deleteCropBatch(Long id) {
        CropBatch cropBatch = getCropBatchById(id);
        verifyOwner(cropBatch);
        cropBatchRepository.delete(cropBatch);
    }

    private void verifyOwner(CropBatch cropBatch) {
        if (!cropBatch.getFarmerId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Farmers can only access their own crop batches");
        }
    }

    private List<CropBatch> addFarmerNames(List<CropBatch> batches) {
        List<Long> farmerIds = batches.stream().map(CropBatch::getFarmerId).distinct().toList();
        Map<Long, User> farmers = userRepository.findAllById(farmerIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        batches.forEach(batch -> {
            User farmer = farmers.get(batch.getFarmerId());
            batch.setFarmerName(farmer == null ? "Unknown farmer" : farmer.getFullName());
        });
        return batches;
    }

    private void syncQuantityStatus(CropBatch cropBatch) {
        if (cropBatch.getStatus() == CropBatchStatus.expired || cropBatch.getStatus() == CropBatchStatus.cancelled) {
            return;
        }
        if (cropBatch.getCurrentQuantity() != null && cropBatch.getCurrentQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            cropBatch.setStatus(CropBatchStatus.sold_out);
            return;
        }
        if (cropBatch.getStatus() == null || cropBatch.getStatus() == CropBatchStatus.sold_out) {
            cropBatch.setStatus(CropBatchStatus.available);
        }
    }

}
