-- Worker Schedule Template: plantilla semanal de horario por trabajador
CREATE TABLE worker_schedule_template (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id uuid NOT NULL REFERENCES worker(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES center(id) ON DELETE CASCADE,
  days jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX ON worker_schedule_template(worker_id);

CREATE TRIGGER trg_worker_schedule_template_updated_at
  BEFORE UPDATE ON worker_schedule_template
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE worker_schedule_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage" ON worker_schedule_template
  FOR ALL USING (
    get_my_role() = 'admin' AND center_id IN (
      SELECT c.id FROM center c WHERE c.company_id = get_my_company_id()
    )
  );
