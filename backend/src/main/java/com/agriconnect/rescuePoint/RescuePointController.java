package com.agriconnect.rescuePoint;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;

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
@RequestMapping("/api/rescue-points")
@SecurityRequirement(name = "bearerAuth")
public class RescuePointController {

    private final RescuePointService rescuePointService;

    public RescuePointController(RescuePointService rescuePointService) {
        this.rescuePointService = rescuePointService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RescuePoint>> getAll(
            @RequestParam(required = false) String province,
            @RequestParam(required = false) RescuePointStatus status) {
        return ResponseEntity.ok(rescuePointService.getAll(province, status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RescuePoint> getById(@PathVariable Long id) {
        return ResponseEntity.ok(rescuePointService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RescuePoint> create(@RequestBody RescuePoint rescuePoint) {
        return ResponseEntity.status(HttpStatus.CREATED).body(rescuePointService.create(rescuePoint));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RescuePoint> update(@PathVariable Long id, @RequestBody RescuePoint rescuePoint) {
        return ResponseEntity.ok(rescuePointService.update(id, rescuePoint));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        rescuePointService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
