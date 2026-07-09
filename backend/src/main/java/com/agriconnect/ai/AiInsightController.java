package com.agriconnect.ai;

import com.agriconnect.ai.AiInsightDtos.AiInsightRequest;
import com.agriconnect.ai.AiInsightDtos.AiInsightResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/insights")
@SecurityRequirement(name = "bearerAuth")
public class AiInsightController {
    private final AiInsightService service;

    public AiInsightController(AiInsightService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LOGISTICS')")
    @Operation(summary = "Generate AI coordination insights", description = "Required role: ADMIN or LOGISTICS")
    public AiInsightResponse generateInsights(@RequestBody(required = false) AiInsightRequest request) {
        return service.generateInsights(request);
    }
}
