package com.agriconnect.cropBatch;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class CropBatchService {
    
    private final CropBatchRepository cropBatchRepository;

    public CropBatchService(CropBatchRepository cropBatchRepository){
        this.cropBatchRepository = cropBatchRepository;
    }

    public List<CropBatch> getAllCropBatches(){
        return cropBatchRepository.findAll();
    }

    public List<CropBatch> getCropBatchesByCropId(Long cropId) {
        return cropBatchRepository.findByCropId(cropId);
    }

    public List<CropBatch> getCropBatchesByFarmerId(Long farmerId) {
        return cropBatchRepository.findByFarmerId(farmerId);
    }

    public List<CropBatch> getCropBatchesByStatus(CropBatchStatus status) {
        return cropBatchRepository.findByStatus(status);
    }

    public CropBatch getCropBatchById(Long id) {
        return cropBatchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Crop batch not found with id: " + id));
    }

    public CropBatch createCropBatch(CropBatch cropBatch) {
        return cropBatchRepository.save(cropBatch);
    }

    public CropBatch updateCropBatch(Long id, CropBatch request) {
        CropBatch cropBatch = getCropBatchById(id);

        cropBatch.setCropId(request.getCropId());
        cropBatch.setFarmerId(request.getFarmerId());
        cropBatch.setQuantity(request.getQuantity());
        cropBatch.setUnit(request.getUnit());
        cropBatch.setHarvestDate(request.getHarvestDate());
        cropBatch.setExpiryDate(request.getExpiryDate());
        cropBatch.setProvince(request.getProvince());
        cropBatch.setDistrict(request.getDistrict());
        cropBatch.setLocation(request.getLocation());
        cropBatch.setStatus(request.getStatus());

        return cropBatchRepository.save(cropBatch);
    }

    public void deleteCropBatch(Long id) {
        CropBatch cropBatch = getCropBatchById(id);
        cropBatchRepository.delete(cropBatch);
    }

}
