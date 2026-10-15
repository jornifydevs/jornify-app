-- Migration: add_invitation_codes
-- Adds invitation_code table so admins can generate single-use codes
-- that workers must provide during registration.

CREATE TABLE invitation_code (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'used')),
  created_by  UUID NOT NULL,
  used_by     UUID,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast look-up by code (used during registration validation)
CREATE INDEX invitation_code_code_idx ON invitation_code (code);

-- Index for admin listing by company
CREATE INDEX invitation_code_company_idx ON invitation_code (company_id, created_at DESC);
