package com.agriconnect.rescuePoint;

import java.util.List;

import org.springframework.stereotype.Service;
import com.agriconnect.common.ResourceNotFoundException;

@Service
public class RescuePointService {

    private final RescuePointRepository rescuePointRepository;

    public RescuePointService(RescuePointRepository rescuePointRepository) {
        this.rescuePointRepository = rescuePointRepository;
    }

    public List<RescuePoint> getAll(String province, RescuePointStatus status) {
        if (province != null) return rescuePointRepository.findByProvinceIgnoreCase(province);
        if (status != null) return rescuePointRepository.findByStatus(status);
        return rescuePointRepository.findAll();
    }

    public RescuePoint getById(Long id) {
        return rescuePointRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rescue point not found with id: " + id));
    }

    public RescuePoint create(RescuePoint rescuePoint) {
        rescuePoint.setId(null);
        return rescuePointRepository.save(rescuePoint);
    }

    public RescuePoint update(Long id, RescuePoint request) {
        RescuePoint rescuePoint = getById(id);
        rescuePoint.setName(request.getName());
        rescuePoint.setProvince(request.getProvince());
        rescuePoint.setAddress(request.getAddress());
        rescuePoint.setStatus(request.getStatus());
        return rescuePointRepository.save(rescuePoint);
    }

    public void delete(Long id) {
        rescuePointRepository.delete(getById(id));
    }
}
