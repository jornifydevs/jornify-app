-- ═══════════════════════════════════════════════════════════════════════════════
-- JORNIFY — RLS Complete Reset
-- Drops ALL existing policies and recreates them in a clean, consistent way.
--
-- Design rules:
--  1. Two SECURITY DEFINER helpers (get_my_role, get_my_company_id) are used in
--     EVERY policy that needs to inspect the current user's role or company. They
--     run as the DB owner → bypass RLS → zero risk of infinite recursion.
--  2. The only policies that do NOT use those helpers are the users "own-row"
--     checks, which compare id = auth.uid() directly (safe, no self-reference).
--  3. Non-sensitive reference tables (company, center) use USING(true) for SELECT
--     so any authenticated user can read them. Write operations are still gated.
--  4. Table name: "worker" (singular). All previous migrations that used "workers"
--     were wrong.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- Helper functions (SECURITY DEFINER — bypass RLS inside the body)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_select_own"         ON users;
DROP POLICY IF EXISTS "users_select_admin"        ON users;
DROP POLICY IF EXISTS "users_select_super_admin"  ON users;
DROP POLICY IF EXISTS "users_insert_own"          ON users;
DROP POLICY IF EXISTS "users_update_own"          ON users;

-- Own row (no helper needed — comparing to auth.uid() never recurses)
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admin sees all users in their company
CREATE POLICY "users_select_admin" ON users
  FOR SELECT TO authenticated
  USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'admin'
  );

-- Super admin sees all users
CREATE POLICY "users_select_super_admin" ON users
  FOR SELECT TO authenticated
  USING (get_my_role() = 'super_admin');

-- User creates their own profile on registration
CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Admin creates a user profile on behalf of a new worker they invite
DROP POLICY IF EXISTS "users_insert_admin" ON users;
CREATE POLICY "users_insert_admin" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'admin'
    AND company_id = get_my_company_id()
  );

-- User can update their own profile (name, avatar, etc.)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- company
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "company_select_authenticated" ON company;
DROP POLICY IF EXISTS "company_insert_authenticated" ON company;

-- Any authenticated user can read company data (needed during registration
-- before the admin's users row exists, and non-sensitive in B2B context)
CREATE POLICY "company_select_authenticated" ON company
  FOR SELECT TO authenticated
  USING (true);

-- Any authenticated user can create a company (registration flow)
CREATE POLICY "company_insert_authenticated" ON company
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Admin can update their own company
DROP POLICY IF EXISTS "company_update_admin" ON company;
CREATE POLICY "company_update_admin" ON company
  FOR UPDATE TO authenticated
  USING (id = get_my_company_id() AND get_my_role() = 'admin')
  WITH CHECK (id = get_my_company_id() AND get_my_role() = 'admin');


-- ─────────────────────────────────────────────────────────────────────────────
-- center
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "center_select_authenticated" ON center;
DROP POLICY IF EXISTS "center_select_admin"         ON center;
DROP POLICY IF EXISTS "center_select_worker"        ON center;
DROP POLICY IF EXISTS "center_select_super_admin"   ON center;
DROP POLICY IF EXISTS "center_insert_admin"         ON center;
DROP POLICY IF EXISTS "center_update_admin"         ON center;
DROP POLICY IF EXISTS "center_delete_super_admin"   ON center;

-- Any authenticated user can read centers (non-sensitive; app layer enforces
-- company ownership in server components)
CREATE POLICY "center_select_authenticated" ON center
  FOR SELECT TO authenticated
  USING (true);

-- Only admins of the owning company can create centers
CREATE POLICY "center_insert_admin" ON center
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() = 'admin'
  );

-- Only admins of the owning company can update centers
CREATE POLICY "center_update_admin" ON center
  FOR UPDATE TO authenticated
  USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'admin'
  )
  WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() = 'admin'
  );

-- Only super_admin can delete centers
CREATE POLICY "center_delete_super_admin" ON center
  FOR DELETE TO authenticated
  USING (get_my_role() = 'super_admin');


-- ─────────────────────────────────────────────────────────────────────────────
-- worker  (table name is singular)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "worker_select_own"         ON worker;
DROP POLICY IF EXISTS "worker_select_admin"       ON worker;
DROP POLICY IF EXISTS "worker_select_super_admin" ON worker;
DROP POLICY IF EXISTS "worker_insert_admin"       ON worker;
DROP POLICY IF EXISTS "worker_update_admin"       ON worker;
DROP POLICY IF EXISTS "worker_delete_admin"       ON worker;

-- Worker sees their own record
CREATE POLICY "worker_select_own" ON worker
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin sees workers assigned to centers of their company
CREATE POLICY "worker_select_admin" ON worker
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'admin'
    AND center_id IN (
      SELECT id FROM center WHERE company_id = get_my_company_id()
    )
  );

-- Super admin sees all workers
CREATE POLICY "worker_select_super_admin" ON worker
  FOR SELECT TO authenticated
  USING (get_my_role() = 'super_admin');

-- Only admins can create worker records (company ownership is enforced in
-- the application layer by AssignWorkerUseCase)
CREATE POLICY "worker_insert_admin" ON worker
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'admin');

-- Admin can move workers between centers within their company
CREATE POLICY "worker_update_admin" ON worker
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'admin'
    AND center_id IN (
      SELECT id FROM center WHERE company_id = get_my_company_id()
    )
  )
  WITH CHECK (
    get_my_role() = 'admin'
    AND center_id IN (
      SELECT id FROM center WHERE company_id = get_my_company_id()
    )
  );

-- Admin can delete workers in their company's centers
CREATE POLICY "worker_delete_admin" ON worker
  FOR DELETE TO authenticated
  USING (
    get_my_role() = 'admin'
    AND center_id IN (
      SELECT id FROM center WHERE company_id = get_my_company_id()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- invitation_code
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "invitation_code_select" ON invitation_code;
DROP POLICY IF EXISTS "invitation_code_insert" ON invitation_code;
DROP POLICY IF EXISTS "invitation_code_update" ON invitation_code;
DROP POLICY IF EXISTS "invitation_code_delete" ON invitation_code;

-- Public read so the validation endpoint works before the worker has a session
CREATE POLICY "invitation_code_select" ON invitation_code
  FOR SELECT TO anon, authenticated
  USING (true);

-- Only admins can generate codes for their own company
CREATE POLICY "invitation_code_insert" ON invitation_code
  FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'admin'
    AND company_id = get_my_company_id()
    AND created_by = auth.uid()
  );

-- Any authenticated user can consume a pending code (runs in /auth/confirm)
CREATE POLICY "invitation_code_update" ON invitation_code
  FOR UPDATE TO authenticated
  USING  (status = 'pending')
  WITH CHECK (status = 'used' AND used_by = auth.uid());

-- Only admins can delete pending codes from their own company
CREATE POLICY "invitation_code_delete" ON invitation_code
  FOR DELETE TO authenticated
  USING (
    get_my_role() = 'admin'
    AND company_id = get_my_company_id()
    AND status = 'pending'
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- document
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "document_select_own_worker" ON document;
DROP POLICY IF EXISTS "document_select_admin"      ON document;
DROP POLICY IF EXISTS "document_insert_own_worker" ON document;
DROP POLICY IF EXISTS "document_update_own_worker" ON document;

-- Worker reads their own documents (profile photo, etc.)
CREATE POLICY "document_select_own_worker" ON document
  FOR SELECT TO authenticated
  USING (
    worker_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
  );

-- Admin reads documents of workers in their company
CREATE POLICY "document_select_admin" ON document
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'admin'
    AND worker_id IN (
      SELECT w.id FROM worker w
      JOIN center c ON w.center_id = c.id
      WHERE c.company_id = get_my_company_id()
    )
  );

-- Worker inserts their own document rows
CREATE POLICY "document_insert_own_worker" ON document
  FOR INSERT TO authenticated
  WITH CHECK (
    worker_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
  );

-- Worker updates their own document rows
CREATE POLICY "document_update_own_worker" ON document
  FOR UPDATE TO authenticated
  USING (
    worker_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
  )
  WITH CHECK (
    worker_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
  );

-- Admin deletes documents of workers in their company (cascade worker delete)
DROP POLICY IF EXISTS "document_delete_admin" ON document;
CREATE POLICY "document_delete_admin" ON document
  FOR DELETE TO authenticated
  USING (
    get_my_role() = 'admin'
    AND worker_id IN (
      SELECT w.id FROM worker w
      JOIN center c ON w.center_id = c.id
      WHERE c.company_id = get_my_company_id()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- workday
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "workday_select_own"   ON workday;
DROP POLICY IF EXISTS "workday_select_admin" ON workday;
DROP POLICY IF EXISTS "workday_insert_own"   ON workday;
DROP POLICY IF EXISTS "workday_update_own"   ON workday;
DROP POLICY IF EXISTS "workday_delete_admin" ON workday;

-- Worker reads their own workdays
CREATE POLICY "workday_select_own" ON workday
  FOR SELECT TO authenticated
  USING (worker_id IN (SELECT id FROM worker WHERE user_id = auth.uid()));

-- Admin reads workdays of workers in their company
CREATE POLICY "workday_select_admin" ON workday
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'admin'
    AND center_id IN (SELECT id FROM center WHERE company_id = get_my_company_id())
  );

-- Worker inserts their own workday records (clock-in flow)
CREATE POLICY "workday_insert_own" ON workday
  FOR INSERT TO authenticated
  WITH CHECK (worker_id IN (SELECT id FROM worker WHERE user_id = auth.uid()));

-- Worker updates their own workday records (clock-out flow)
CREATE POLICY "workday_update_own" ON workday
  FOR UPDATE TO authenticated
  USING (worker_id IN (SELECT id FROM worker WHERE user_id = auth.uid()))
  WITH CHECK (worker_id IN (SELECT id FROM worker WHERE user_id = auth.uid()));

-- Admin deletes workdays of workers in their company (cascade worker delete)
CREATE POLICY "workday_delete_admin" ON workday
  FOR DELETE TO authenticated
  USING (
    get_my_role() = 'admin'
    AND center_id IN (SELECT id FROM center WHERE company_id = get_my_company_id())
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- time_record
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "time_record_select_own"   ON time_record;
DROP POLICY IF EXISTS "time_record_select_admin" ON time_record;
DROP POLICY IF EXISTS "time_record_insert_own"   ON time_record;
DROP POLICY IF EXISTS "time_record_update_own"   ON time_record;
DROP POLICY IF EXISTS "time_record_delete_admin" ON time_record;

-- Worker reads their own time records (via workday)
CREATE POLICY "time_record_select_own" ON time_record
  FOR SELECT TO authenticated
  USING (
    workday_id IN (
      SELECT id FROM workday
      WHERE worker_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
    )
  );

-- Admin reads time records of workers in their company
CREATE POLICY "time_record_select_admin" ON time_record
  FOR SELECT TO authenticated
  USING (
    get_my_role() = 'admin'
    AND workday_id IN (
      SELECT wd.id FROM workday wd
      JOIN center c ON wd.center_id = c.id
      WHERE c.company_id = get_my_company_id()
    )
  );

-- Worker inserts their own time records
CREATE POLICY "time_record_insert_own" ON time_record
  FOR INSERT TO authenticated
  WITH CHECK (
    workday_id IN (
      SELECT id FROM workday
      WHERE worker_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
    )
  );

-- Worker updates their own time records
CREATE POLICY "time_record_update_own" ON time_record
  FOR UPDATE TO authenticated
  USING (
    workday_id IN (
      SELECT id FROM workday
      WHERE worker_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    workday_id IN (
      SELECT id FROM workday
      WHERE worker_id IN (SELECT id FROM worker WHERE user_id = auth.uid())
    )
  );

-- Admin deletes time records for workers in their company (cascade worker delete)
CREATE POLICY "time_record_delete_admin" ON time_record
  FOR DELETE TO authenticated
  USING (
    get_my_role() = 'admin'
    AND workday_id IN (
      SELECT wd.id FROM workday wd
      JOIN center c ON wd.center_id = c.id
      WHERE c.company_id = get_my_company_id()
    )
  );

-- Admin also deletes the custom users row (for cascade worker delete)
DROP POLICY IF EXISTS "users_delete_admin" ON users;
CREATE POLICY "users_delete_admin" ON users
  FOR DELETE TO authenticated
  USING (
    get_my_role() = 'admin'
    AND company_id = get_my_company_id()
  );
