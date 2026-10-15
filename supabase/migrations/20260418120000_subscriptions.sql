-- ═══════════════════════════════════════════════════════════════════════════════
-- JORNIFY — Subscriptions (Lemon Squeezy)
-- Una suscripción por empresa. El webhook de LS hace upsert por ls_subscription_id.
-- Las escrituras solo ocurren desde el webhook (service_role), nunca desde el cliente.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE subscription (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID        NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  ls_subscription_id   TEXT        NOT NULL UNIQUE,
  ls_customer_id       TEXT        NOT NULL,
  variant_id           TEXT        NOT NULL,
  status               TEXT        NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active','on_trial','past_due','paused','cancelled','expired')),
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX subscription_company_id_idx ON subscription(company_id);

ALTER TABLE subscription ENABLE ROW LEVEL SECURITY;

-- Admin y super_admin pueden leer la suscripción de su empresa
CREATE POLICY "subscription_select_admin" ON subscription
  FOR SELECT TO authenticated
  USING (
    (company_id = get_my_company_id() AND get_my_role() = 'admin')
    OR get_my_role() = 'super_admin'
  );

-- Las escrituras solo las hace el service_role (webhook) — no se exponen a clientes

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscription_updated_at
  BEFORE UPDATE ON subscription
  FOR EACH ROW EXECUTE FUNCTION update_subscription_updated_at();
