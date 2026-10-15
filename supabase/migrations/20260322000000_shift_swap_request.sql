-- Tabla de solicitudes de cambio de turno entre trabajadores del mismo centro
CREATE TABLE shift_swap_request (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id          UUID NOT NULL REFERENCES worker(id) ON DELETE CASCADE,
  target_id             UUID NOT NULL REFERENCES worker(id) ON DELETE CASCADE,
  requester_workday_id  UUID NOT NULL REFERENCES workday(id) ON DELETE CASCADE,
  target_workday_id     UUID NOT NULL REFERENCES workday(id) ON DELETE CASCADE,
  center_id             UUID NOT NULL REFERENCES center(id),
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','awaiting_admin','approved','rejected','cancelled')),
  requester_note        TEXT,
  admin_note            TEXT,
  reviewed_by           UUID REFERENCES users(id),
  reviewed_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_swap CHECK (requester_id != target_id),
  CONSTRAINT different_workdays CHECK (requester_workday_id != target_workday_id)
);

-- Indices para queries frecuentes
CREATE INDEX idx_ssr_requester ON shift_swap_request(requester_id);
CREATE INDEX idx_ssr_target     ON shift_swap_request(target_id);
CREATE INDEX idx_ssr_center     ON shift_swap_request(center_id);
CREATE INDEX idx_ssr_status     ON shift_swap_request(status);

-- Evita que un workday tenga dos swaps pendientes al mismo tiempo
CREATE UNIQUE INDEX uniq_pending_requester_workday
  ON shift_swap_request(requester_workday_id) WHERE status = 'pending';
CREATE UNIQUE INDEX uniq_pending_target_workday
  ON shift_swap_request(target_workday_id) WHERE status = 'pending';

-- Trigger para updated_at
CREATE TRIGGER shift_swap_request_updated_at
  BEFORE UPDATE ON shift_swap_request
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE shift_swap_request ENABLE ROW LEVEL SECURITY;

-- Worker: ve swaps donde es solicitante o destinatario
CREATE POLICY "ssr_select_own" ON shift_swap_request
  FOR SELECT TO authenticated
  USING (
    requester_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
    OR target_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
  );

-- Worker: solo puede crear swaps en su propio centro
CREATE POLICY "ssr_insert_own" ON shift_swap_request
  FOR INSERT TO authenticated
  WITH CHECK (
    requester_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
    AND center_id IN (SELECT center_id FROM worker WHERE user_id = auth.uid())
  );

-- Worker (solicitante): puede cancelar su solicitud si está pending
CREATE POLICY "ssr_cancel_own" ON shift_swap_request
  FOR UPDATE TO authenticated
  USING (
    requester_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (status = 'cancelled');

-- Worker (destinatario): puede responder si está pending → awaiting_admin o rejected
CREATE POLICY "ssr_respond_as_target" ON shift_swap_request
  FOR UPDATE TO authenticated
  USING (
    target_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (status IN ('awaiting_admin', 'rejected'));

-- Admin: ve todos los swaps de sus centros
CREATE POLICY "ssr_select_admin" ON shift_swap_request
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'admin'
    AND center_id IN (SELECT id FROM center WHERE company_id = get_my_company_id())
  );

-- Admin: aprueba o rechaza swaps en awaiting_admin
CREATE POLICY "ssr_review_admin" ON shift_swap_request
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'admin'
    AND center_id IN (SELECT id FROM center WHERE company_id = get_my_company_id())
    AND status = 'awaiting_admin'
  )
  WITH CHECK (status IN ('approved', 'rejected'));
