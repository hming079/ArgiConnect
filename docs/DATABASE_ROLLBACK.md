# Database cutover and rollback

1. Stop public writes or place the Gateway in maintenance mode.
2. Back up the single PostgreSQL database.
3. Start new services once so Flyway creates owned schemas.
4. Run `docker/migrate-phase2-3.sql`, verify all four row counts.
5. Run `docker/migrate-phase4-5.sql`, verify all four row counts.
6. Run analytics backfill and compare dashboard totals.
7. Change Gateway routes only after verification.

Rollback during the compatibility window means stopping writes, reconciling records created after cutover back into core through an approved script/API, and reversing Gateway routes. Never simply route writes back to stale core tables. The migration scripts do not delete or modify core source rows, so the pre-cutover backup and tables remain available. Automatic destructive rollback is intentionally not provided.
