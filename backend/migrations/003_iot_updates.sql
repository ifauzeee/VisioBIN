-- Migration 003: IoT Updates (API Key & Heartbeat)

-- Add api_key and last_seen to bins table
ALTER TABLE bins ADD COLUMN IF NOT EXISTS api_key VARCHAR(100) UNIQUE;
ALTER TABLE bins ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Generate initial API Keys for existing bins
UPDATE bins SET api_key = 'vbin-' || substr(md5(random()::text), 1, 16) WHERE api_key IS NULL;

-- Ensure api_key is NOT NULL for future inserts (optional, but good for consistency)
-- ALTER TABLE bins ALTER COLUMN api_key SET NOT NULL;

-- Index for faster API key lookups
CREATE INDEX IF NOT EXISTS idx_bins_api_key ON bins(api_key);
CREATE INDEX IF NOT EXISTS idx_bins_last_seen ON bins(last_seen);
