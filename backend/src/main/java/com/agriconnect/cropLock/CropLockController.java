package com.agriconnect.cropLock;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/crop-locks")
@SecurityRequirement(name = "bearerAuth")
public class CropLockController {
    private final CropLockService service;

    public CropLockController(CropLockService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CropLock>> getAll(
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) Long buyerId,
            @RequestParam(required = false) CropLockStatus status) {
        return ResponseEntity.ok(service.getAll(batchId, buyerId, status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CropLock> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('BUYER')")
    @Operation(summary = "Create crop lock", description = "Required role: BUYER; buyerId comes from JWT identity")
    public ResponseEntity<CropLock> create(@RequestBody CropLock cropLock) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(cropLock));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CropLock> update(@PathVariable Long id, @RequestBody CropLock cropLock) {
        return ResponseEntity.ok(service.update(id, cropLock));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('BUYER')")
    @Operation(summary = "Delete crop lock", description = "Required role: BUYER; ownership is enforced")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
