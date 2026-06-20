package com.agriconnect.cropBatch;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/crop-batches")
public class CropBatchController {
    
    private final CropBatchService cropBatchService;

    public CropBatchController(CropBatchService cropBatchService){
        this.cropBatchService = cropBatchService;
    }

    @GetMapping
    public ResponseEntity<List<CropBatch>> getAllCropBatches(
            @RequestParam(required = false) Long cropId,
            @RequestParam(required = false) Long farmerId,
            @RequestParam(required = false) CropBatchStatus status) {
        if (cropId != null) {
            return ResponseEntity.ok(cropBatchService.getCropBatchesByCropId(cropId));
        }

        if (farmerId != null) {
            return ResponseEntity.ok(cropBatchService.getCropBatchesByFarmerId(farmerId));
        }

        if (status != null) {
            return ResponseEntity.ok(cropBatchService.getCropBatchesByStatus(status));
        }

        return ResponseEntity.ok(cropBatchService.getAllCropBatches());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CropBatch> getCropBatchById(@PathVariable Long id) {
        return ResponseEntity.ok(cropBatchService.getCropBatchById(id));
    }

    @PostMapping
    public ResponseEntity<CropBatch> createCropBatch(@RequestBody CropBatch cropBatch) {
        CropBatch createdCropBatch = cropBatchService.createCropBatch(cropBatch);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCropBatch);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CropBatch> updateCropBatch(@PathVariable Long id, @RequestBody CropBatch cropBatch) {
        return ResponseEntity.ok(cropBatchService.updateCropBatch(id, cropBatch));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCropBatch(@PathVariable Long id) {
        cropBatchService.deleteCropBatch(id);
        return ResponseEntity.noContent().build();
    }
    
}
