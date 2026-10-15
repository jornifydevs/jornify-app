-- Migration: company_nif_unique
-- Adds a unique constraint on the company.nif column to enforce at the database
-- level that no two companies can share the same NIF.
-- The application layer already validates this via /api/auth/check-nif before
-- registration, but the DB constraint is the authoritative safety net.

ALTER TABLE company
  ADD CONSTRAINT company_nif_unique UNIQUE (nif);
