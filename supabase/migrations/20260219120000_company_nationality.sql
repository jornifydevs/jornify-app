-- Add nationality (ISO 3166-1 Alpha-2 country code) to company.
-- Existing companies default to Spain ('ES').
ALTER TABLE company
  ADD COLUMN IF NOT EXISTS nationality VARCHAR(2) NOT NULL DEFAULT 'ES';
