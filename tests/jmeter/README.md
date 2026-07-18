# JMeter verification

Run against seeded data through the public Gateway only. Obtain a buyer JWT and create one active crop lock before the duplicate-checkout scenario.

```powershell
jmeter -n -t tests/jmeter/agriconnect-microservices.jmx `
  -JGATEWAY_HOST=localhost -JGATEWAY_PORT=8080 `
  -JTOKEN=<buyer-access-token> `
  -JBATCH_ID=<batch-with-at-least-100-units> `
  -JLOCK_ID=<active-lock-id> `
  -JDUP_KEY=jmeter-duplicate-order-001 `
  -l tests/jmeter/results/agriconnect-jmeter.jtl `
  -e -o tests/jmeter/results/report
```

For the last thread group, stop only logistics-service before execution:

```powershell
docker compose stop logistics-service
```

After the run, restart it and verify that one shipment is eventually created for the confirmed order and that the relevant RabbitMQ DLQ remains empty:

```powershell
docker compose start logistics-service
docker compose exec rabbitmq rabbitmqctl list_queues name messages consumers
```

The concurrency group accepts successful reservations and explicit `409` inventory conflicts. After it completes, query the crop batch and verify the quantity invariant in PostgreSQL or via the internal diagnostic workflow documented in the migration plan.
