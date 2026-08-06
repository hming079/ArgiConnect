package com.agriconnect.logistics;

import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

@RestController
class AnalyticsExportController {
    private final JdbcClient db;

    AnalyticsExportController(JdbcClient d) {
        db = d;
    }

    @GetMapping("/internal/analytics/shipments")
    List<Map<String, Object>> rows(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return db.sql(
                "select id as \"shipmentId\",order_id as \"orderId\",status from shipments order by id limit :s offset :o")
                .param("s", size).param("o", page * size).query().listOfRows();
    }
}
