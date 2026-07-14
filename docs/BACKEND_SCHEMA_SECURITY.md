# Backend Schema & Security Document: ChitLedger
*Migration-grade specification for Supabase/PostgreSQL*

---

## Flagged Discrepancies Between This Prompt and Prior TRD

> [!NOTE]
> **Confirmed Decision 1: `penalty_calculation_mode` enum.**
> The enum includes **both values** (`flat_per_month`, `linear_escalating`) for future V2 flexibility. The `record_payment()` function only implements `linear_escalating` logic for V1. Column defaults to `linear_escalating`.

> [!NOTE]
> **Confirmed Decision 2: RLS identity mechanism.**
> Uses the **email-based JWT check** via `get_admin_email()` (a `SECURITY DEFINER` function). The admin email is stored in `admin_settings` (a database row), never as a hardcoded UUID in migration files.

> [!NOTE]
> **Confirmed Decision 3: Receipt sequence yearly reset.**
> Uses a `receipt_counters` table with an atomic `INSERT ... ON CONFLICT DO UPDATE` pattern instead of a bare Postgres SEQUENCE. Fully transactional, handles year rollovers without cron jobs.

---

# PART 1: BACKEND SCHEMA

## 1. Enum Types

```sql
-- Payment modes
CREATE TYPE payment_mode_enum AS ENUM ('cash', 'upi', 'bank_transfer');

-- Chit group lifecycle
CREATE TYPE group_status_enum AS ENUM ('active', 'archived');

-- Penalty calculation strategy
CREATE TYPE penalty_mode_enum AS ENUM ('flat_per_month', 'linear_escalating');
```

## 2. Table Definitions

### 2.1 `admin_settings`
*Single-row configuration table. Enforced by a CHECK constraint.*

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `business_name` | `text` | NOT NULL | — | |
| `admin_email` | `text` | NOT NULL | — | Used in RLS policy resolution. Must match the seeded Supabase Auth user's email exactly. |
| `logo_url` | `text` | NULL | `NULL` | URL to uploaded logo (Supabase Storage or external). |
| `whatsapp_template` | `text` | NOT NULL | — | Supports placeholders: `{member_name}`, `{month}`, `{installment}`, `{penalty}`, `{total}`, `{chit_name}`. |
| `created_at` | `timestamptz` | NOT NULL | `now()` | |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | |

**Constraints:**
- `PRIMARY KEY (id)`
- `CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)` — Enforces single-row invariant. Any INSERT with a different ID fails.

---

### 2.2 `chit_groups`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `name` | `text` | NOT NULL | — | |
| `chit_amount` | `numeric(12,2)` | NOT NULL | — | Total chit pool value (e.g., ₹5,00,000). No cap. |
| `max_members` | `integer` | NOT NULL | `30` | Enforced at application layer; a trigger also blocks inserts to `members` beyond this. |
| `duration_months` | `integer` | NOT NULL | — | |
| `installment_amount` | `numeric(12,2)` | NOT NULL | — | Monthly amount each member owes. |
| `monthly_penalty_rate` | `numeric(12,2)` | NOT NULL | — | Penalty per overdue month (₹ amount, not percentage). |
| `penalty_calculation_mode` | `penalty_mode_enum` | NOT NULL | `'linear_escalating'` | V1 implements `linear_escalating` only. `flat_per_month` reserved for V2. |
| `grace_period_days` | `integer` | NOT NULL | `0` | Days after due date before penalty accrues. |
| `start_date` | `date` | NOT NULL | — | |
| `status` | `group_status_enum` | NOT NULL | `'active'` | |
| `created_at` | `timestamptz` | NOT NULL | `now()` | |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | |

**Constraints:**
- `PRIMARY KEY (id)`
- `CHECK (max_members > 0)`
- `CHECK (duration_months > 0)`
- `CHECK (chit_amount > 0)`
- `CHECK (installment_amount > 0)`
- `CHECK (monthly_penalty_rate >= 0)`
- `CHECK (grace_period_days >= 0)`

---

### 2.3 `members`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `group_id` | `uuid` | NOT NULL | — | FK → `chit_groups.id` |
| `name` | `text` | NOT NULL | — | |
| `phone` | `text` | NOT NULL | — | E.164 Indian mobile. Validated by CHECK. |
| `address` | `text` | NULL | `NULL` | |
| `created_at` | `timestamptz` | NOT NULL | `now()` | |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | |

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (group_id) REFERENCES chit_groups(id) ON DELETE RESTRICT` — Cannot delete a group that has members.
- `UNIQUE (group_id, phone)` — Same phone cannot appear twice in the same group.
- `CHECK (phone ~ '^\+91[6-9][0-9]{9}$')` — **Assumption: All members have Indian mobile numbers.** If the client may have non-Indian contacts (e.g., NRI members), this should be relaxed to the general E.164 pattern `'^\+[1-9]\d{6,14}$'`. Flagged for confirmation.

---

### 2.4 `payments`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `receipt_number` | `text` | NOT NULL | — | Format: `RCT-YYYY-NNNN`. Generated atomically inside `record_payment()`. |
| `member_id` | `uuid` | NOT NULL | — | FK → `members.id` |
| `group_id` | `uuid` | NOT NULL | — | FK → `chit_groups.id`. Denormalized from member for query performance. |
| `installment_month` | `date` | NOT NULL | — | Always the 1st of the target month (e.g., `2026-07-01`). |
| `due_date` | `date` | NOT NULL | — | Derived as `date_trunc('month', installment_month)` inside the RPC. Stored explicitly to anchor penalty calculations for auditing. |
| `installment_amount` | `numeric(12,2)` | NOT NULL | — | Snapshot of the group's installment at time of payment. |
| `penalty_amount` | `numeric(12,2)` | NOT NULL | `0` | Calculated by `record_payment()`. |
| `total_paid` | `numeric(12,2)` | NOT NULL | — | Must equal `installment_amount + penalty_amount`. |
| `payment_mode` | `payment_mode_enum` | NOT NULL | — | |
| `remarks` | `text` | NULL | `NULL` | |
| `paid_at` | `timestamptz` | NOT NULL | `now()` | |
| `voided_at` | `timestamptz` | NULL | `NULL` | Non-null = soft-deleted. |
| `voided_by` | `uuid` | NULL | `NULL` | `auth.uid()` of the admin who voided. |
| `void_reason` | `text` | NULL | `NULL` | Mandatory when voiding (enforced in application layer + RPC). |

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (receipt_number)`
- `FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT`
- `FOREIGN KEY (group_id) REFERENCES chit_groups(id) ON DELETE RESTRICT`
- `CHECK (total_paid = installment_amount + penalty_amount)`
- `CHECK (penalty_amount >= 0)`
- `CHECK ((voided_at IS NULL AND void_reason IS NULL) OR (voided_at IS NOT NULL AND void_reason IS NOT NULL))` — Void reason is mandatory when voiding; prevents orphaned states.

---

### 2.5 `chit_releases`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `group_id` | `uuid` | NOT NULL | — | FK → `chit_groups.id` |
| `member_id` | `uuid` | NOT NULL | — | FK → `members.id` |
| `release_month` | `date` | NOT NULL | — | Always the 1st of the month. |
| `amount` | `numeric(12,2)` | NOT NULL | — | |
| `payment_mode` | `payment_mode_enum` | NOT NULL | — | |
| `remarks` | `text` | NULL | `NULL` | |
| `released_at` | `timestamptz` | NOT NULL | `now()` | |
| `created_at` | `timestamptz` | NOT NULL | `now()` | |

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (group_id) REFERENCES chit_groups(id) ON DELETE RESTRICT`
- `FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT`

---

### 2.6 `receipt_counters`
*Atomic per-year receipt number generation. Replaces a bare Postgres SEQUENCE because sequences cannot natively reset on calendar year boundaries.*

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `year` | `integer` | NOT NULL | — | Calendar year (e.g., `2026`). |
| `last_value` | `integer` | NOT NULL | `0` | The last receipt number issued for this year. |

**Constraints:**
- `PRIMARY KEY (year)`

---

## 3. Indexes

```sql
-- Payments: ledger lookup by member + month (the core query path)
CREATE INDEX idx_payments_member_month
  ON payments (member_id, installment_month);

-- Payments: filter active (non-voided) payments efficiently
CREATE INDEX idx_payments_voided_at
  ON payments (voided_at)
  WHERE voided_at IS NULL;

-- Payments: receipt number lookups (covered by UNIQUE, but explicit for clarity)
-- Already indexed by UNIQUE (receipt_number)

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
```

---

# PART 2: PROCEDURAL LOGIC & SECURITY

## 4. Receipt Numbering & Counters
Receipt numbers are generated in the format `RCT-YYYY-NNNN`, where `YYYY` is the current calendar year in IST (Asia/Kolkata timezone) and `NNNN` is a sequential 4-digit zero-padded number reset annually. 

Rather than using a global Postgres SEQUENCE which cannot be reset automatically on calendar boundaries without scheduled jobs, a `receipt_counters` table is used. The sequence value is queried and incremented atomically within the `record_payment` transaction.

---

## 5. Stored Procedures & Business Logic

### 5.1 `record_payment` Function
The primary write endpoint for payments. Enforces strict input validation, linear penalty calculations, and atomic receipt generation.

```sql
CREATE OR REPLACE FUNCTION record_payment(
  p_member_id uuid,
  p_installment_month date,
  p_payment_mode payment_mode_enum,
  p_amount_paid numeric,
  p_remarks text DEFAULT NULL
) RETURNS payments AS $$
DECLARE
  v_current_date date;
  v_due_date date;
  v_group_id uuid;
  v_installment_amount numeric(12,2);
  v_monthly_penalty_rate numeric(12,2);
  v_grace_period_days int;
  v_overdue_months int;
  v_penalty numeric(12,2) := 0;
  v_year int;
  v_seq_val int;
  v_receipt_number text;
  v_payment_record payments;
BEGIN
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

  -- 4. Calculate Linear Escalation Penalty
  IF v_current_date > (v_due_date + v_grace_period_days) THEN
    -- Calculate calendar months difference + 1 for current month penalty
    v_overdue_months := ((EXTRACT(year FROM v_current_date) - EXTRACT(year FROM v_due_date)) * 12 
                        + (EXTRACT(month FROM v_current_date) - EXTRACT(month FROM v_due_date)) + 1)::int;
    v_penalty := v_monthly_penalty_rate * v_overdue_months;
  END IF;

  -- 5. Strict Amount Validation (No Partial Payments)
  IF p_amount_paid != (v_installment_amount + v_penalty) THEN
    RAISE EXCEPTION 'Payment validation failed: Amount paid (%) must exactly match the total due (%)', 
                    p_amount_paid, (v_installment_amount + v_penalty);
  END IF;

  -- 6. Atomic Receipt Number Generation with Yearly Reset
  v_year := EXTRACT(year FROM v_current_date)::int;
  
  INSERT INTO receipt_counters (year, last_value)
  VALUES (v_year, 1)
  ON CONFLICT (year) DO UPDATE
  SET last_value = receipt_counters.last_value + 1
  RETURNING last_value INTO v_seq_val;

  v_receipt_number := 'RCT-' || v_year::text || '-' || LPAD(v_seq_val::text, 4, '0');

  -- 7. Insert Payment Record
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
    paid_at
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
    now()
  ) RETURNING * INTO v_payment_record;

  RETURN v_payment_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.2 `void_payment` Function
The soft-delete mechanism for incorrect transactions, maintaining the audit trail.
```sql
CREATE OR REPLACE FUNCTION void_payment(
  p_payment_id uuid,
  p_void_reason text,
  p_voided_by uuid
) RETURNS payments AS $$
DECLARE
  v_payment_record payments;
BEGIN
  IF p_void_reason IS NULL OR trim(p_void_reason) = '' THEN
    RAISE EXCEPTION 'Void reason is mandatory';
  END IF;

  UPDATE payments
  SET voided_at = now(),
      voided_by = p_voided_by,
      void_reason = p_void_reason
  WHERE id = p_payment_id AND voided_at IS NULL
  RETURNING * INTO v_payment_record;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found or already voided';
  END IF;

  RETURN v_payment_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.3 Member Limit Constraint Trigger
Trigger enforcing maximum capacity of 30 members per group at the database level.
```sql
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

CREATE TRIGGER trg_check_max_members
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION check_max_members_trigger();
```

### 5.4 Database Views

```sql
-- Active payments only (excluding soft-deleted/voided rows)
CREATE OR REPLACE VIEW active_payments_view AS
SELECT * FROM payments WHERE voided_at IS NULL;

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
```

---

## 6. Row-Level Security (RLS) & Policies
All tables must have RLS enabled. A SECURITY DEFINER function resolves the admin's email dynamically.

### 6.1 Admin Email Resolution Function
```sql
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
```

### 6.2 Table Policies
```sql
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chit_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chit_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin All Access on admin_settings" ON admin_settings FOR ALL USING (auth.jwt() ->> 'email' = get_admin_email());
CREATE POLICY "Admin All Access on chit_groups" ON chit_groups FOR ALL USING (auth.jwt() ->> 'email' = get_admin_email());
CREATE POLICY "Admin All Access on members" ON members FOR ALL USING (auth.jwt() ->> 'email' = get_admin_email());
CREATE POLICY "Admin All Access on payments" ON payments FOR ALL USING (auth.jwt() ->> 'email' = get_admin_email());
CREATE POLICY "Admin All Access on chit_releases" ON chit_releases FOR ALL USING (auth.jwt() ->> 'email' = get_admin_email());
CREATE POLICY "Admin All Access on receipt_counters" ON receipt_counters FOR ALL USING (auth.jwt() ->> 'email' = get_admin_email());
```
