package com.agriconnect.crop;

import static org.assertj.core.api.Assertions.assertThat;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;

class InventoryConcurrencyTest {
    private JdbcTemplate jdbc;
    private InventoryService service;

    @BeforeEach void setup() {
        JdbcDataSource dataSource = new JdbcDataSource();
        dataSource.setURL("jdbc:h2:mem:inventory;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000");
        jdbc = new JdbcTemplate(dataSource);
        jdbc.execute("drop all objects");
        jdbc.execute("create table crop_batches(id bigint primary key, available_quantity numeric(12,2), reserved_quantity numeric(12,2), sold_quantity numeric(12,2), initial_quantity numeric(12,2), status varchar(30), version bigint, updated_at timestamp)");
        jdbc.execute("create table inventory_reservations(id uuid primary key, request_id uuid unique, order_reference varchar(100), crop_batch_id bigint, buyer_id bigint, quantity numeric(12,2), status varchar(30), expires_at timestamp with time zone, created_at timestamp with time zone default current_timestamp, updated_at timestamp with time zone default current_timestamp)");
        jdbc.execute("create table inventory_movements(id uuid primary key, reservation_id uuid, crop_batch_id bigint, movement_type varchar(30), quantity numeric(12,2), created_at timestamp with time zone default current_timestamp)");
        jdbc.update("insert into crop_batches values(1,100,0,0,100,'available',0,current_timestamp)");
        service = new InventoryService(JdbcClient.create(dataSource));
    }

    @Test void concurrentReservationsCannotOversell() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(20);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        var tasks = java.util.stream.IntStream.range(0, 20).mapToObj(i -> (Callable<Void>) () -> {
            start.await();
            try {
                service.reserve(new ReservationRequest(UUID.randomUUID(), "test-" + i, 1L, (long)i, new BigDecimal("10"), Instant.now().plusSeconds(60)));
                successes.incrementAndGet();
            } catch (DomainException expected) {
                assertThat(expected.code).isEqualTo("INSUFFICIENT_INVENTORY");
            }
            return null;
        }).toList();
        var futures = tasks.stream().map(pool::submit).toList();
        start.countDown();
        for (Future<Void> future : futures) future.get(10, TimeUnit.SECONDS);
        pool.shutdownNow();

        var quantities = jdbc.queryForMap("select initial_quantity,available_quantity,reserved_quantity,sold_quantity from crop_batches where id=1");
        assertThat(successes.get()).isEqualTo(10);
        assertThat((BigDecimal) quantities.get("AVAILABLE_QUANTITY")).isEqualByComparingTo("0");
        assertThat((BigDecimal) quantities.get("RESERVED_QUANTITY")).isEqualByComparingTo("100");
        assertThat((BigDecimal) quantities.get("INITIAL_QUANTITY")).isEqualByComparingTo(
                ((BigDecimal) quantities.get("AVAILABLE_QUANTITY")).add((BigDecimal) quantities.get("RESERVED_QUANTITY")).add((BigDecimal) quantities.get("SOLD_QUANTITY")));
    }
}
