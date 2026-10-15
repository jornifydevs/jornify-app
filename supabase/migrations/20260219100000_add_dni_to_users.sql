-- Migration: add_dni_to_users
-- Adds an optional dni column to the users table so that the DNI captured
-- during worker registration (stored in Supabase auth user_metadata) can be
-- persisted and surfaced in the admin assignment panel without requiring the
-- service role key to read auth metadata.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS dni TEXT;
