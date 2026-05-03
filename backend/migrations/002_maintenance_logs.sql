-- VisioBin Database Schema
-- Migration 002: Maintenance Logs

-- ============================================
-- TABEL: maintenance_logs (Riwayat Perawatan)
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id              BIGSERIAL PRIMARY KEY,
    bin_id          UUID NOT NULL REFERENCES bins(id) ON DELETE CASCADE,
    action_type     VARCHAR(50) NOT NULL,
    notes           TEXT,
    performed_by    UUID REFERENCES users(id),
    performed_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_maintenance_logs_bin_id ON maintenance_logs(bin_id);
CREATE INDEX idx_maintenance_logs_performed_at ON maintenance_logs(performed_at DESC);
