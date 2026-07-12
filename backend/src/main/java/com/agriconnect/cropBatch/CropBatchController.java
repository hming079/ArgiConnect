package com.agriconnect.cropBatch;

import com.agriconnect.cropBatch.dto.CreateCropBatchRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@SecurityRequirement(name = "bearerAuth")
public class CropBatchController {
    
    private final CropBatchService cropBatchService;

    public CropBatchController(CropBatchService cropBatchService){
        this.cropBatchService = cropBatchService;
    }

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<CropBatch>> getAllCropBatches(
            @RequestParam(required = false) Long cropId,
            @RequestParam(required = false) Long farmerId,
            @RequestParam(required = false) CropBatchStatus status,
            @RequestParam(required = false) String province,
            @RequestParam(defaultValue = "false") boolean excludeExpired,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(cropBatchService.getAllCropBatches(cropId, farmerId, status, province, excludeExpired, page, size));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CropBatch> getCropBatchById(@PathVariable Long id) {
        return ResponseEntity.ok(cropBatchService.getCropBatchById(id));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('FARMER')")
    @Operation(summary = "List my crop batches", description = "Required role: FARMER")
    public ResponseEntity<Page<CropBatch>> getMyCropBatches(
            @RequestParam(required = false) Long cropId,
            @RequestParam(required = false) CropBatchStatus status,
            @RequestParam(required = false) String province,
            @RequestParam(defaultValue = "false") boolean excludeExpired,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(cropBatchService.getMyCropBatches(cropId, status, province, excludeExpired, page, size));
    }

    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<Page<CropBatch>> getMyCropBatches() {
        return ResponseEntity.ok(cropBatchService.getMyCropBatches(null, null, null, false, 0, 20));
    }

    @PostMapping
    @PreAuthorize("hasRole('FARMER')")
    @Operation(summary = "Create my crop batch", description = "Required role: FARMER; farmerId comes from JWT identity")
    public ResponseEntity<CropBatch> createCropBatch(@RequestBody CreateCropBatchRequest request) {
        CropBatch cropBatch = new CropBatch();
        if (request != null) {
            cropBatch.setCropId(request.getCropId());
            cropBatch.setInitialQuantity(request.getInitialQuantity());
            cropBatch.setCurrentQuantity(request.getCurrentQuantity());
            cropBatch.setUnitPrice(request.getUnitPrice());
            cropBatch.setUnit(request.getUnit());
            cropBatch.setHarvestDate(request.getHarvestDate());
            cropBatch.setExpiryDate(request.getExpiryDate());
            cropBatch.setProvince(request.getProvince());
            cropBatch.setDistrict(request.getDistrict());
            cropBatch.setWard(request.getWard());
            cropBatch.setAddressDetail(request.getAddressDetail());
        }
        CropBatch createdCropBatch = cropBatchService.createCropBatch(cropBatch);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCropBatch);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FARMER')")
    @Operation(summary = "Update my crop batch", description = "Required role: FARMER; ownership is enforced")
    public ResponseEntity<CropBatch> updateCropBatch(@PathVariable Long id, @RequestBody CropBatch cropBatch) {
        return ResponseEntity.ok(cropBatchService.updateCropBatch(id, cropBatch));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FARMER')")
    @Operation(summary = "Delete my crop batch", description = "Required role: FARMER; ownership is enforced")
    public ResponseEntity<Void> deleteCropBatch(@PathVariable Long id) {
        cropBatchService.deleteCropBatch(id);
        return ResponseEntity.noContent().build();
    }
    
}
