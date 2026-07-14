-- =============================================================================
-- ChitLedger: Complete Supabase Migration (v2)
-- Generated from: /docs/BACKEND_SCHEMA_SECURITY.md + security fixes + client changes
-- Timestamp: 20260713143000
-- =============================================================================
--
-- CHANGES FROM ORIGINAL SPEC:
--
--   SECURITY FIXES:
--     1. Defense-in-depth auth check at top of record_payment(), void_payment(),
--        and delete_payment():
--          IF auth.jwt() ->> 'email' <> get_admin_email() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
--     2. void_payment() no longer accepts p_voided_by — uses auth.uid() internally.
--     3. Penalty calculation uses age()-based elapsed full months between
--        (due_date + grace_period_days) and today, floored at 1 if past grace.
--        Fixes the off-by-one in the original calendar-month + 1 formula.
--
--   CLIENT CHANGE 1 — HARD DELETE WITH SHADOW AUDIT:
--     - New table: deleted_payments_audit (mirrors payments + deleted_at/deleted_by/delete_reason)
--     - New function: delete_payment(uuid, text) — archives then hard-deletes.
--     - payments table GRANT excludes DELETE — deletion only via delete_payment().
--     - deleted_payments_audit: admin-only SELECT via RLS; no direct INSERT/UPDATE/DELETE grants.
--
--   CLIENT CHANGE 2 — PENALTY OVERRIDE:
--     - record_payment() gains: p_penalty_override numeric, p_override_reason text.
--     - payments table gains: penalty_override_reason (text), penalty_was_overridden (boolean).
--     - If override provided, p_override_reason is mandatory (non-null, non-empty).
--     - total_paid validation still enforced against the override value.
--
-- =============================================================================


-- *****************************************************************************
-- PART 1: ENUM TYPES
-- *****************************************************************************

-- Payment modes
CREATE TYPE payment_mode_enum AS ENUM ('cash', 'upi', 'bank_transfer');

-- Chit group lifecycle
CREATE TYPE group_status_enum AS ENUM ('active', 'archived');

-- Penalty calculation strategy (V1 uses linear_escalating only; flat_per_month reserved for V2)
CREATE TYPE penalty_mode_enum AS ENUM ('flat_per_month', 'linear_escalating');


-- *****************************************************************************
-- PART 2: TABLE DEFINITIONS
-- *****************************************************************************

-- -----------------------------------------------------------------------------
-- 2.1 admin_settings
-- Single-row configuration table. Enforced by a CHECK constraint on the id.
-- -----------------------------------------------------------------------------
CREATE TABLE admin_settings (
  id              uuid          NOT NULL DEFAULT gen_random_uuid(),
  business_name   text          NOT NULL,
  admin_email     text          NOT NULL,
  logo_url        text          NULL     DEFAULT NULL,
  whatsapp_template text        NOT NULL,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT admin_settings_pkey PRIMARY KEY (id),
  CONSTRAINT admin_settings_single_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

COMMENT ON TABLE admin_settings IS 'Single-row configuration table for business settings. CHECK constraint enforces single-row invariant.';
COMMENT ON COLUMN admin_settings.admin_email IS 'Used in RLS policy resolution via get_admin_email(). Must match the seeded Supabase Auth user email exactly.';
COMMENT ON COLUMN admin_settings.whatsapp_template IS 'Supports placeholders: {member_name}, {month}, {installment}, {penalty}, {total}, {chit_name}.';

-- -----------------------------------------------------------------------------
-- 2.2 chit_groups
-- -----------------------------------------------------------------------------
CREATE TABLE chit_groups (
  id                        uuid              NOT NULL DEFAULT gen_random_uuid(),
  name                      text              NOT NULL,
  chit_amount               numeric(12,2)     NOT NULL,
  max_members               integer           NOT NULL DEFAULT 30,
  duration_months           integer           NOT NULL,
  installment_amount        numeric(12,2)     NOT NULL,
  monthly_penalty_rate      numeric(12,2)     NOT NULL,
  penalty_calculation_mode  penalty_mode_enum NOT NULL DEFAULT 'linear_escalating',
  grace_period_days         integer           NOT NULL DEFAULT 0,
  start_date                date              NOT NULL,
  status                    group_status_enum NOT NULL DEFAULT 'active',
  created_at                timestamptz       NOT NULL DEFAULT now(),
  updated_at                timestamptz       NOT NULL DEFAULT now(),

  CONSTRAINT chit_groups_pkey PRIMARY KEY (id),
  CONSTRAINT chit_groups_max_members_positive CHECK (max_members > 0),
  CONSTRAINT chit_groups_duration_positive CHECK (duration_months > 0),
  CONSTRAINT chit_groups_chit_amount_positive CHECK (chit_amount > 0),
  CONSTRAINT chit_groups_installment_positive CHECK (installment_amount > 0),
  CONSTRAINT chit_groups_penalty_rate_non_negative CHECK (monthly_penalty_rate >= 0),
  CONSTRAINT chit_groups_grace_period_non_negative CHECK (grace_period_days >= 0)
);

COMMENT ON TABLE chit_groups IS 'Chit fund groups with financial parameters. Financial fields are immutable after creation.';
COMMENT ON COLUMN chit_groups.penalty_calculation_mode IS 'V1 implements linear_escalating only. flat_per_month reserved for V2.';
COMMENT ON COLUMN chit_groups.monthly_penalty_rate IS 'Penalty per overdue month as a fixed rupee amount, not a percentage.';

-- -----------------------------------------------------------------------------
-- 2.3 members
-- -----------------------------------------------------------------------------
CREATE TABLE members (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  group_id    uuid        NOT NULL,
  name        text        NOT NULL,
  phone       text        NOT NULL,
  address     text        NULL     DEFAULT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT members_pkey PRIMARY KEY (id),
  CONSTRAINT members_group_fkey FOREIGN KEY (group_id) REFERENCES chit_groups(id) ON DELETE RESTRICT,
  CONSTRAINT members_group_phone_unique UNIQUE (group_id, phone),
  CONSTRAINT members_phone_e164_india CHECK (phone ~ '^\+91[6-9][0-9]{9}$')
);

COMMENT ON TABLE members IS '1-to-1 mapping with a Chit Group. Phone validated as Indian E.164.';
COMMENT ON COLUMN members.phone IS 'E.164 Indian mobile number. CHECK enforces +91 prefix with valid 10-digit mobile.';

-- -----------------------------------------------------------------------------
-- 2.4 payments
-- CHANGED: Added penalty_override_reason and penalty_was_overridden columns
--          for the penalty override feature.
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
  id                        uuid              NOT NULL DEFAULT gen_random_uuid(),
  receipt_number            text              NOT NULL,
  member_id                 uuid              NOT NULL,
  group_id                  uuid              NOT NULL,
  installment_month         date              NOT NULL,
  due_date                  date              NOT NULL,
  installment_amount        numeric(12,2)     NOT NULL,
  penalty_amount            numeric(12,2)     NOT NULL DEFAULT 0,
  total_paid                numeric(12,2)     NOT NULL,
  payment_mode              payment_mode_enum NOT NULL,
  remarks                   text              NULL     DEFAULT NULL,
  paid_at                   timestamptz       NOT NULL DEFAULT now(),
  voided_at                 timestamptz       NULL     DEFAULT NULL,
  voided_by                 uuid              NULL     DEFAULT NULL,
  void_reason               text              NULL     DEFAULT NULL,
  -- NEW: Penalty override audit columns
  penalty_was_overridden    boolean           NOT NULL DEFAULT false,
  penalty_override_reason   text              NULL     DEFAULT NULL,

  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_receipt_number_unique UNIQUE (receipt_number),
  CONSTRAINT payments_member_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
  CONSTRAINT payments_group_fkey FOREIGN KEY (group_id) REFERENCES chit_groups(id) ON DELETE RESTRICT,
  CONSTRAINT payments_total_equals_installment_plus_penalty CHECK (total_paid = installment_amount + penalty_amount),
  CONSTRAINT payments_penalty_non_negative CHECK (penalty_amount >= 0),
  CONSTRAINT payments_void_reason_required CHECK (
    (voided_at IS NULL AND void_reason IS NULL) OR
    (voided_at IS NOT NULL AND void_reason IS NOT NULL)
  ),
  -- NEW: If penalty was overridden, a reason MUST be present.
  CONSTRAINT payments_override_reason_required CHECK (
    (penalty_was_overridden = false AND penalty_override_reason IS NULL) OR
    (penalty_was_overridden = true AND penalty_override_reason IS NOT NULL)
  )
);

COMMENT ON TABLE payments IS 'Immutable payment ledger. Voided payments are soft-deleted (voided_at IS NOT NULL). Hard-deleted payments are archived to deleted_payments_audit via delete_payment().';
COMMENT ON COLUMN payments.receipt_number IS 'Format: RCT-YYYY-NNNN. Generated atomically inside record_payment().';
COMMENT ON COLUMN payments.installment_month IS 'Always the 1st of the target month (e.g., 2026-07-01).';
COMMENT ON COLUMN payments.due_date IS 'Derived as date_trunc(month, installment_month) inside the RPC. Stored explicitly for auditing.';
COMMENT ON COLUMN payments.group_id IS 'Denormalized from member for query performance.';
COMMENT ON COLUMN payments.penalty_was_overridden IS 'True if admin manually set the penalty amount instead of using the auto-calculated value.';
COMMENT ON COLUMN payments.penalty_override_reason IS 'Mandatory reason when penalty_was_overridden is true. Documents why the admin waived or adjusted the penalty.';

-- -----------------------------------------------------------------------------
-- 2.5 chit_releases
-- -----------------------------------------------------------------------------
CREATE TABLE chit_releases (
  id            uuid              NOT NULL DEFAULT gen_random_uuid(),
  group_id      uuid              NOT NULL,
  member_id     uuid              NOT NULL,
  release_month date              NOT NULL,
  amount        numeric(12,2)     NOT NULL,
  payment_mode  payment_mode_enum NOT NULL,
  remarks       text              NULL     DEFAULT NULL,
  released_at   timestamptz       NOT NULL DEFAULT now(),
  created_at    timestamptz       NOT NULL DEFAULT now(),

  CONSTRAINT chit_releases_pkey PRIMARY KEY (id),
  CONSTRAINT chit_releases_group_fkey FOREIGN KEY (group_id) REFERENCES chit_groups(id) ON DELETE RESTRICT,
  CONSTRAINT chit_releases_member_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT
);

COMMENT ON TABLE chit_releases IS 'Tracks monthly chit lump-sum releases to members.';
COMMENT ON COLUMN chit_releases.release_month IS 'Always the 1st of the month.';

-- -----------------------------------------------------------------------------
-- 2.6 receipt_counters
-- Atomic per-year receipt number generation.
-- -----------------------------------------------------------------------------
CREATE TABLE receipt_counters (
  year        integer NOT NULL,
  last_value  integer NOT NULL DEFAULT 0,

  CONSTRAINT receipt_counters_pkey PRIMARY KEY (year)
);

COMMENT ON TABLE receipt_counters IS 'Atomic per-year receipt counter using INSERT...ON CONFLICT DO UPDATE. Handles year rollovers without cron jobs.';

-- -----------------------------------------------------------------------------
-- 2.7 deleted_payments_audit  [NEW]
-- Shadow audit table for hard-deleted payments. Mirrors every column of
-- payments, plus deletion metadata. Only written by delete_payment() via
-- SECURITY DEFINER — never directly by the client.
-- No FK constraints: the referenced rows may no longer exist or may change.
-- -----------------------------------------------------------------------------
CREATE TABLE deleted_payments_audit (
  -- Own PK for the audit row
  id                        uuid          NOT NULL DEFAULT gen_random_uuid(),
  -- Original payment data (mirrors payments table columns exactly)
  original_payment_id       uuid          NOT NULL,
  receipt_number            text          NOT NULL,
  member_id                 uuid          NOT NULL,
  group_id                  uuid          NOT NULL,
  installment_month         date          NOT NULL,
  due_date                  date          NOT NULL,
  installment_amount        numeric(12,2) NOT NULL,
  penalty_amount            numeric(12,2) NOT NULL,
  total_paid                numeric(12,2) NOT NULL,
  payment_mode              payment_mode_enum NOT NULL,
  remarks                   text          NULL,
  paid_at                   timestamptz   NOT NULL,
  voided_at                 timestamptz   NULL,
  voided_by                 uuid          NULL,
  void_reason               text          NULL,
  penalty_was_overridden    boolean       NOT NULL DEFAULT false,
  penalty_override_reason   text          NULL,
  -- Deletion metadata
  deleted_at                timestamptz   NOT NULL DEFAULT now(),
  deleted_by                uuid          NOT NULL,
  delete_reason             text          NOT NULL,

  CONSTRAINT deleted_payments_audit_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE deleted_payments_audit IS 'Shadow audit log for hard-deleted payments. Written exclusively by delete_payment() SECURITY DEFINER function. Admin has read-only access via RLS.';
COMMENT ON COLUMN deleted_payments_audit.original_payment_id IS 'The UUID of the payment row before it was deleted from the payments table.';
COMMENT ON COLUMN deleted_payments_audit.deleted_by IS 'auth.uid() of the admin who performed the hard delete.';


-- *****************************************************************************
-- PART 3: INDEXES
-- *****************************************************************************

-- Payments: ledger lookup by member + month (the core query path)
CREATE INDEX idx_payments_member_month
  ON payments (member_id, installment_month);

-- Payments: filter active (non-voided) payments efficiently
CREATE INDEX idx_payments_voided_at
  ON payments (voided_at)
  WHERE voided_at IS NULL;

-- Members: phone search across all groups (for duplicate detection)
CREATE INDEX idx_members_phone
  ON members (phone);

-- Members: list members by group
CREATE INDEX idx_members_group_id
  ON members (group_id);

-- Chit releases: lookup by group + month (to detect duplicate releases)
CREATE INDEX idx_releases_group_month
  ON chit_releases (group_id, release_month);

-- Payments: group-level financial summaries
CREATE INDEX idx_payments_group_id
  ON payments (group_id);

-- Deleted payments audit: lookup by original payment id
CREATE INDEX idx_deleted_audit_original_payment
  ON deleted_payments_audit (original_payment_id);


-- *****************************************************************************
-- PART 4: FUNCTIONS & STORED PROCEDURES
-- *****************************************************************************

-- -----------------------------------------------------------------------------
-- 4.1 get_admin_email()
-- SECURITY DEFINER function that resolves the admin's email from admin_settings.
-- Used in all RLS policies and in the defense-in-depth auth checks inside RPCs.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_admin_email()
RETURNS text AS $$
DECLARE
  v_email text;
BEGIN
  SELECT admin_email INTO v_email
  FROM admin_settings
  LIMIT 1;
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_admin_email() IS 'Resolves admin email from admin_settings for RLS policy checks. SECURITY DEFINER bypasses RLS on admin_settings itself.';

-- -----------------------------------------------------------------------------
-- 4.2 update_updated_at()
-- Generic trigger function to auto-update the updated_at timestamp on row modification.
-- Applied to: admin_settings, chit_groups, members
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at() IS 'Generic trigger function to auto-set updated_at = now() on every UPDATE.';

-- -----------------------------------------------------------------------------
-- 4.3 check_max_members_trigger()
-- Trigger function enforcing maximum member capacity per group at the DB level.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_max_members_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_max_members int;
  v_current_members int;
BEGIN
  SELECT max_members INTO v_max_members
  FROM chit_groups
  WHERE id = NEW.group_id;

  SELECT count(*) INTO v_current_members
  FROM members
  WHERE group_id = NEW.group_id;

  IF v_current_members >= v_max_members THEN
    RAISE EXCEPTION 'Group has reached its maximum capacity of % members', v_max_members;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_max_members_trigger() IS 'BEFORE INSERT trigger on members to enforce chit_groups.max_members limit.';

-- -----------------------------------------------------------------------------
-- 4.4 record_payment()
--
-- SECURITY FIXES:
--   - Defense-in-depth auth check at entry (Step 0).
--   - Penalty calculation uses age()-based elapsed full months between
--     (due_date + grace_period_days) and today, floored at 1 if past grace.
--
-- CLIENT CHANGE — PENALTY OVERRIDE:
--   - New params: p_penalty_override, p_override_reason (both DEFAULT NULL).
--   - If p_penalty_override IS NOT NULL, uses that value instead of the
--     auto-calculated penalty. p_override_reason is mandatory when overriding.
--   - total_paid validation still applies using whichever penalty value is active.
--   - Populates penalty_was_overridden and penalty_override_reason columns.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_payment(
  p_member_id         uuid,
  p_installment_month date,
  p_payment_mode      payment_mode_enum,
  p_amount_paid       numeric,
  p_remarks           text    DEFAULT NULL,
  p_penalty_override  numeric DEFAULT NULL,
  p_override_reason   text    DEFAULT NULL
) RETURNS payments AS $$
DECLARE
  v_current_date         date;
  v_due_date             date;
  v_group_id             uuid;
  v_installment_amount   numeric(12,2);
  v_monthly_penalty_rate numeric(12,2);
  v_grace_period_days    int;
  v_grace_cutoff         date;
  v_age_interval         interval;
  v_overdue_months       int;
  v_penalty              numeric(12,2) := 0;
  v_was_overridden       boolean := false;
  v_year                 int;
  v_seq_val              int;
  v_receipt_number       text;
  v_payment_record       payments;
BEGIN
  -- 0. Defense-in-Depth Authorization Check
  --    Even though RLS and GRANT already restrict access, this ensures the
  --    SECURITY DEFINER function cannot be invoked by a non-admin JWT.
  IF auth.jwt() ->> 'email' IS DISTINCT FROM get_admin_email() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. Initialize Dates (Explicitly in India Standard Time)
  v_current_date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_due_date := date_trunc('month', p_installment_month)::date;

  -- 2. Fetch Member and Group Details
  SELECT g.id, g.installment_amount, g.monthly_penalty_rate, g.grace_period_days
  INTO v_group_id, v_installment_amount, v_monthly_penalty_rate, v_grace_period_days
  FROM members m
  JOIN chit_groups g ON m.group_id = g.id
  WHERE m.id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found or not associated with any group';
  END IF;

  -- 3. Check for Duplicate Active Payments
  IF EXISTS (
    SELECT 1 FROM payments
    WHERE member_id = p_member_id
      AND installment_month = v_due_date
      AND voided_at IS NULL
  ) THEN
    RAISE EXCEPTION 'An active payment already exists for this installment month';
  END IF;

  -- 4. Calculate Linear Escalation Penalty (age()-based, fixes off-by-one)
  --    Grace cutoff = due_date + grace_period_days.
  --    If today > cutoff: count elapsed full months via age(), floor at 1.
  v_grace_cutoff := v_due_date + v_grace_period_days;

  IF v_current_date > v_grace_cutoff THEN
    v_age_interval := age(v_current_date, v_grace_cutoff);
    v_overdue_months := GREATEST(
      1,
      (EXTRACT(year FROM v_age_interval) * 12 + EXTRACT(month FROM v_age_interval))::int
    );
    v_penalty := v_monthly_penalty_rate * v_overdue_months;
  END IF;

  -- 5. Apply Penalty Override (if admin is waiving/reducing)
  IF p_penalty_override IS NOT NULL THEN
    -- Override reason is mandatory when overriding
    IF p_override_reason IS NULL OR trim(p_override_reason) = '' THEN
      RAISE EXCEPTION 'Override reason is mandatory when providing a penalty override';
    END IF;
    -- Replace the auto-calculated penalty with the admin's override value
    v_penalty := p_penalty_override;
    v_was_overridden := true;
  END IF;

  -- 6. Strict Amount Validation (No Partial Payments)
  --    Uses whichever penalty value is active (calculated or overridden).
  IF p_amount_paid != (v_installment_amount + v_penalty) THEN
    RAISE EXCEPTION 'Payment validation failed: Amount paid (%) must exactly match the total due (%)',
                    p_amount_paid, (v_installment_amount + v_penalty);
  END IF;

  -- 7. Atomic Receipt Number Generation with Yearly Reset
  v_year := EXTRACT(year FROM v_current_date)::int;

  INSERT INTO receipt_counters (year, last_value)
  VALUES (v_year, 1)
  ON CONFLICT (year) DO UPDATE
  SET last_value = receipt_counters.last_value + 1
  RETURNING last_value INTO v_seq_val;

  v_receipt_number := 'RCT-' || v_year::text || '-' || LPAD(v_seq_val::text, 4, '0');

  -- 8. Insert Payment Record
  INSERT INTO payments (
    receipt_number,
    member_id,
    group_id,
    installment_month,
    due_date,
    installment_amount,
    penalty_amount,
    total_paid,
    payment_mode,
    remarks,
    paid_at,
    penalty_was_overridden,
    penalty_override_reason
  ) VALUES (
    v_receipt_number,
    p_member_id,
    v_group_id,
    v_due_date,
    v_due_date,
    v_installment_amount,
    v_penalty,
    p_amount_paid,
    p_payment_mode,
    p_remarks,
    now(),
    v_was_overridden,
    p_override_reason
  ) RETURNING * INTO v_payment_record;

  RETURN v_payment_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_payment(uuid, date, payment_mode_enum, numeric, text, numeric, text)
  IS 'Atomic payment recording with defense-in-depth auth check, age()-based penalty calculation, optional admin penalty override, receipt number generation with yearly reset, and strict total validation. Rejects partial payments.';

-- -----------------------------------------------------------------------------
-- 4.5 void_payment()
--
-- SECURITY FIXES:
--   - Defense-in-depth auth check at entry.
--   - Removed p_voided_by parameter; uses auth.uid() internally.
--     Signature is now: void_payment(p_payment_id uuid, p_void_reason text)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION void_payment(
  p_payment_id  uuid,
  p_void_reason text
) RETURNS payments AS $$
DECLARE
  v_payment_record payments;
BEGIN
  -- 0. Defense-in-Depth Authorization Check
  IF auth.jwt() ->> 'email' IS DISTINCT FROM get_admin_email() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. Validate void reason
  IF p_void_reason IS NULL OR trim(p_void_reason) = '' THEN
    RAISE EXCEPTION 'Void reason is mandatory';
  END IF;

  -- 2. Soft-delete: set voided_at, voided_by (from JWT), void_reason
  UPDATE payments
  SET voided_at = now(),
      voided_by = auth.uid(),
      void_reason = p_void_reason
  WHERE id = p_payment_id AND voided_at IS NULL
  RETURNING * INTO v_payment_record;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found or already voided';
  END IF;

  RETURN v_payment_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION void_payment(uuid, text)
  IS 'Soft-deletes a payment by setting voided_at/voided_by/void_reason. Uses auth.uid() for voided_by (not client-supplied). Refuses to void already-voided records. Void reason is mandatory. Defense-in-depth auth check at entry.';

-- -----------------------------------------------------------------------------
-- 4.6 delete_payment()  [NEW]
--
-- Hard-deletes a payment row AFTER archiving a full copy into
-- deleted_payments_audit. Ensures the audit trail is never lost.
--
-- Access control:
--   - Defense-in-depth auth check at entry.
--   - SECURITY DEFINER bypasses RLS to write to deleted_payments_audit
--     (which has no INSERT grant for authenticated role).
--   - delete_reason is mandatory.
--   - Raw DELETE on payments table is not granted to authenticated role;
--     all deletion MUST go through this function.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_payment(
  p_payment_id    uuid,
  p_delete_reason text
) RETURNS payments AS $$
DECLARE
  v_payment payments;
BEGIN
  -- 0. Defense-in-Depth Authorization Check
  IF auth.jwt() ->> 'email' IS DISTINCT FROM get_admin_email() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. Validate delete reason
  IF p_delete_reason IS NULL OR trim(p_delete_reason) = '' THEN
    RAISE EXCEPTION 'Delete reason is mandatory';
  END IF;

  -- 2. Fetch the payment to be deleted (lock the row)
  SELECT * INTO v_payment
  FROM payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found: %', p_payment_id;
  END IF;

  -- 3. Archive the full payment row into the audit table
  INSERT INTO deleted_payments_audit (
    original_payment_id,
    receipt_number,
    member_id,
    group_id,
    installment_month,
    due_date,
    installment_amount,
    penalty_amount,
    total_paid,
    payment_mode,
    remarks,
    paid_at,
    voided_at,
    voided_by,
    void_reason,
    penalty_was_overridden,
    penalty_override_reason,
    deleted_at,
    deleted_by,
    delete_reason
  ) VALUES (
    v_payment.id,
    v_payment.receipt_number,
    v_payment.member_id,
    v_payment.group_id,
    v_payment.installment_month,
    v_payment.due_date,
    v_payment.installment_amount,
    v_payment.penalty_amount,
    v_payment.total_paid,
    v_payment.payment_mode,
    v_payment.remarks,
    v_payment.paid_at,
    v_payment.voided_at,
    v_payment.voided_by,
    v_payment.void_reason,
    v_payment.penalty_was_overridden,
    v_payment.penalty_override_reason,
    now(),
    auth.uid(),
    p_delete_reason
  );

  -- 4. Hard-delete the payment row
  DELETE FROM payments WHERE id = p_payment_id;

  -- 5. Return the archived payment data for frontend confirmation
  RETURN v_payment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_payment(uuid, text)
  IS 'Hard-deletes a payment after archiving a full copy to deleted_payments_audit. Defense-in-depth auth check. Delete reason is mandatory. This is the ONLY way to delete payments — raw DELETE is not granted to authenticated role.';


-- *****************************************************************************
-- PART 5: TRIGGERS
-- *****************************************************************************

-- Member capacity enforcement
CREATE TRIGGER trg_check_max_members
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION check_max_members_trigger();

-- Auto-update updated_at timestamps
CREATE TRIGGER trg_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_chit_groups_updated_at
  BEFORE UPDATE ON chit_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- *****************************************************************************
-- PART 6: VIEWS
-- *****************************************************************************

-- Active payments only (excluding soft-deleted/voided rows)
CREATE OR REPLACE VIEW active_payments_view AS
SELECT * FROM payments WHERE voided_at IS NULL;

COMMENT ON VIEW active_payments_view IS 'Excludes voided payments. All frontend financial queries must use this view, never the base payments table directly.';

-- High-level KPI aggregations for the Admin Dashboard
CREATE OR REPLACE VIEW dashboard_metrics_view AS
WITH active_groups AS (
  SELECT count(*) as active_groups_count FROM chit_groups WHERE status = 'active'
),
active_members AS (
  SELECT count(*) as active_members_count FROM members m
  JOIN chit_groups g ON m.group_id = g.id
  WHERE g.status = 'active'
),
current_month_collections AS (
  SELECT COALESCE(sum(total_paid), 0) as month_collections
  FROM active_payments_view
  WHERE paid_at >= date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata')
    AND paid_at < date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata') + interval '1 month'
),
current_month_pending AS (
  SELECT COALESCE(sum(g.installment_amount), 0) as month_pending
  FROM members m
  JOIN chit_groups g ON m.group_id = g.id
  WHERE g.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM active_payments_view p
      WHERE p.member_id = m.id
        AND p.installment_month = date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata')::date
    )
)
SELECT
  ag.active_groups_count,
  am.active_members_count,
  cmc.month_collections,
  cmp.month_pending
FROM active_groups ag, active_members am, current_month_collections cmc, current_month_pending cmp;

COMMENT ON VIEW dashboard_metrics_view IS 'Pre-aggregated KPIs for the admin dashboard: active groups, active members, current month collections, current month pending. All timezone-aware (IST).';


-- *****************************************************************************
-- PART 7: ROW-LEVEL SECURITY (RLS)
-- *****************************************************************************

-- Enable RLS on every table (Deny By Default)
ALTER TABLE admin_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE chit_groups          ENABLE ROW LEVEL SECURITY;
ALTER TABLE members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE chit_releases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_counters     ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_payments_audit ENABLE ROW LEVEL SECURITY;

-- Single-tenant admin-only policies.
-- Pattern: check the email claim inside the user's JWT against the configured
-- admin email resolved dynamically via get_admin_email().
CREATE POLICY "Admin All Access on admin_settings"
  ON admin_settings FOR ALL
  USING (auth.jwt() ->> 'email' = get_admin_email());

CREATE POLICY "Admin All Access on chit_groups"
  ON chit_groups FOR ALL
  USING (auth.jwt() ->> 'email' = get_admin_email());

CREATE POLICY "Admin All Access on members"
  ON members FOR ALL
  USING (auth.jwt() ->> 'email' = get_admin_email());

CREATE POLICY "Admin All Access on payments"
  ON payments FOR ALL
  USING (auth.jwt() ->> 'email' = get_admin_email());

CREATE POLICY "Admin All Access on chit_releases"
  ON chit_releases FOR ALL
  USING (auth.jwt() ->> 'email' = get_admin_email());

CREATE POLICY "Admin All Access on receipt_counters"
  ON receipt_counters FOR ALL
  USING (auth.jwt() ->> 'email' = get_admin_email());

-- deleted_payments_audit: Admin can SELECT only. No INSERT/UPDATE/DELETE
-- policy — writes come exclusively from delete_payment() SECURITY DEFINER.
CREATE POLICY "Admin Read-Only on deleted_payments_audit"
  ON deleted_payments_audit FOR SELECT
  USING (auth.jwt() ->> 'email' = get_admin_email());


-- *****************************************************************************
-- PART 8: GRANTS & REVOKES
-- *****************************************************************************

-- Grant usage on custom types to authenticated and anon roles so Supabase
-- PostgREST can serialize/deserialize enum values in API responses.
GRANT USAGE ON TYPE payment_mode_enum TO authenticated, anon;
GRANT USAGE ON TYPE group_status_enum TO authenticated, anon;
GRANT USAGE ON TYPE penalty_mode_enum TO authenticated, anon;

-- Grant table-level access to the authenticated role.
-- RLS policies above restrict actual row visibility to the admin only.
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_settings  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chit_groups     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON members         TO authenticated;
-- CHANGED: payments — NO DELETE grant. All deletion goes through delete_payment()
-- which writes to the audit table first. Raw DELETE is never allowed.
GRANT SELECT, INSERT, UPDATE         ON payments        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chit_releases   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_counters TO authenticated;
-- deleted_payments_audit: SELECT only. Writes come from SECURITY DEFINER function.
GRANT SELECT                         ON deleted_payments_audit TO authenticated;

-- Grant view access
GRANT SELECT ON active_payments_view   TO authenticated;
GRANT SELECT ON dashboard_metrics_view TO authenticated;

-- Grant RPC execution (note updated signatures)
GRANT EXECUTE ON FUNCTION record_payment(uuid, date, payment_mode_enum, numeric, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION void_payment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_payment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_email() TO authenticated;

-- Revoke default public execution rights (PostgreSQL defaults to granting execute to PUBLIC)
REVOKE EXECUTE ON FUNCTION record_payment(uuid, date, payment_mode_enum, numeric, text, numeric, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION void_payment(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION delete_payment(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_admin_email() FROM PUBLIC;

-- Revoke default table privileges automatically granted by Supabase/Postgres
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON payments FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON deleted_payments_audit FROM authenticated;

-- Revoke all from anon (public/unauthenticated) — defense in depth.
-- Supabase Auth's anon key must not allow any data access without a valid JWT.
REVOKE ALL ON admin_settings           FROM anon;
REVOKE ALL ON chit_groups              FROM anon;
REVOKE ALL ON members                  FROM anon;
REVOKE ALL ON payments                 FROM anon;
REVOKE ALL ON chit_releases            FROM anon;
REVOKE ALL ON receipt_counters         FROM anon;
REVOKE ALL ON deleted_payments_audit   FROM anon;
REVOKE ALL ON active_payments_view     FROM anon;
REVOKE ALL ON dashboard_metrics_view   FROM anon;
REVOKE EXECUTE ON FUNCTION record_payment(uuid, date, payment_mode_enum, numeric, text, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION void_payment(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION delete_payment(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION get_admin_email() FROM anon;


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
