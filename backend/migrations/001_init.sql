-- VisioBin Database Schema
-- Migration 001: Initial Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABEL: bins (Unit Tempat Sampah VisioBin)
-- ============================================
CREATE TABLE IF NOT EXISTS bins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    location        VARCHAR(255),
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    max_volume_cm   FLOAT NOT NULL DEFAULT 50.0,
    max_weight_kg   FLOAT NOT NULL DEFAULT 20.0,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABEL: sensor_readings (Data Telemetri Sensor)
-- ============================================
CREATE TABLE IF NOT EXISTS sensor_readings (
    id                      BIGSERIAL PRIMARY KEY,
    bin_id                  UUID NOT NULL REFERENCES bins(id) ON DELETE CASCADE,
    distance_organic_cm     FLOAT,
    distance_inorganic_cm   FLOAT,
    weight_organic_kg       FLOAT,
    weight_inorganic_kg     FLOAT,
    gas_amonia_ppm          FLOAT,
    volume_organic_pct      FLOAT,
    volume_inorganic_pct    FLOAT,
    recorded_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sensor_readings_bin_id ON sensor_readings(bin_id);
CREATE INDEX idx_sensor_readings_recorded_at ON sensor_readings(recorded_at DESC);
CREATE INDEX idx_sensor_readings_bin_time ON sensor_readings(bin_id, recorded_at DESC);

-- ============================================
-- TABEL: classification_logs (History Klasifikasi AI)
-- ============================================
CREATE TABLE IF NOT EXISTS classification_logs (
    id                  BIGSERIAL PRIMARY KEY,
    bin_id              UUID NOT NULL REFERENCES bins(id) ON DELETE CASCADE,
    predicted_class     VARCHAR(20) NOT NULL,
    confidence          FLOAT,
    inference_time_ms   INT,
    classified_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_classification_logs_bin_id ON classification_logs(bin_id);
CREATE INDEX idx_classification_logs_classified_at ON classification_logs(classified_at DESC);

-- ============================================
-- TABEL: alerts (Notifikasi & Peringatan)
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id          BIGSERIAL PRIMARY KEY,
    bin_id      UUID NOT NULL REFERENCES bins(id) ON DELETE CASCADE,
    alert_type  VARCHAR(50) NOT NULL,
    message     TEXT,
    severity    VARCHAR(20) NOT NULL DEFAULT 'info',
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_bin_id ON alerts(bin_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- ============================================
-- TABEL: users (Admin & Petugas Operasional)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    full_name       VARCHAR(100),
    role            VARCHAR(20) NOT NULL DEFAULT 'operator',
    fcm_token       TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SEED DATA: Default Admin & Sample Bin
-- ============================================
-- Password: admin123 (bcrypt hash)
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES (
    'admin',
    'admin@visiobin.local',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Administrator',
    'admin'
) ON CONFLICT (username) DO NOTHING;

INSERT INTO bins (name, location, max_volume_cm, max_weight_kg, status)
VALUES
    ('VisioBin-01 Gedung Q Lt.1', 'Lorong utama lantai 1 Gedung Q JTIK', 50.0, 20.0, 'active'),
    ('VisioBin-02 Gedung Q Lt.2', 'Dekat tangga lantai 2 Gedung Q JTIK', 50.0, 20.0, 'active')
ON CONFLICT DO NOTHING;
