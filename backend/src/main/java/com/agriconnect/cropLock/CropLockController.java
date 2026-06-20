package com.agriconnect.cropLock;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/crop-locks")
public class CropLockController {
    private final CropLockService service;

    public CropLockController(CropLockService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<CropLock>> getAll(
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) Long buyerId,
            @RequestParam(required = false) CropLockStatus status) {
        return ResponseEntity.ok(service.getAll(batchId, buyerId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CropLock> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<CropLock> create(@RequestBody CropLock cropLock) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(cropLock));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CropLock> update(@PathVariable Long id, @RequestBody CropLock cropLock) {
        return ResponseEntity.ok(service.update(id, cropLock));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
