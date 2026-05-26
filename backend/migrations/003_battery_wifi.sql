-- Migration 003: Add battery_pct and wifi_rssi_dbm to sensor_readings
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS battery_pct INT DEFAULT 100;
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS wifi_rssi_dbm INT DEFAULT -50;
