-- Add nationality (ISO 3166-1 Alpha-2 country code) to center.
-- Existing centers default to Spain ('ES').
ALTER TABLE center
  ADD COLUMN IF NOT EXISTS nationality VARCHAR(2) NOT NULL DEFAULT 'ES';
