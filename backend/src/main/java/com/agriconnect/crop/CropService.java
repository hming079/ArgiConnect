package com.agriconnect.crop;

import java.util.List;

import org.springframework.stereotype.Service;
import com.agriconnect.common.ResourceNotFoundException;

@Service
public class CropService {

    private final CropRepository cropRepository;

    public CropService(CropRepository cropRepository) {
        this.cropRepository = cropRepository;
    }

    public List<Crop> getAllCrops() {
        return cropRepository.findAll();
    }

    public Crop getCropById(Long id) {
        return cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with id: " + id));
    }

    public Crop createCrop(Crop crop) {
        return cropRepository.save(crop);
    }

    public Crop updateCrop(Long id, Crop request) {
        Crop crop = getCropById(id);

        crop.setName(request.getName());
        crop.setDescription(request.getDescription());
        crop.setStorageDays(request.getStorageDays());
        crop.setDefaultUnit(request.getDefaultUnit());

        return cropRepository.save(crop);
    }

    public void deleteCrop(Long id) {
        Crop crop = getCropById(id);
        cropRepository.delete(crop);
    }

}
