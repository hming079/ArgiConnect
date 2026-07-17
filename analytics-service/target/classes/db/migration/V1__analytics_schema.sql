CREATE TABLE IF NOT EXISTS service_metadata (id SMALLINT PRIMARY KEY DEFAULT 1, schema_version VARCHAR(30) NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT INTO service_metadata(id,schema_version) VALUES(1,'strangler-proxy-v1') ON CONFLICT(id) DO UPDATE SET schema_version=excluded.schema_version,updated_at=CURRENT_TIMESTAMP;
