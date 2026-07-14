# Technical Requirements & Architecture Document
**Project:** ChitLedger (Internal Chit Fund Management System)

## 1. Tech Stack
| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend Core** | React + TypeScript + Vite + react-i18next | Fast build times, robust static typing for financial data, industry standard. i18n added for Admin UI toggle. |
| **UI & Styling** | Tailwind CSS + shadcn/ui | Rapid, accessible scaffolding optimized for AI generation (Stitch MCP). |
| **Routing** | React Router | Standard client-side routing for seamless SPA navigation. |
| **Backend & DB** | Supabase (PostgreSQL) | ACID compliance, native sequences, and RLS are mandatory for financial ledgers. |
| **Authentication** | Supabase Auth | Native integration with Postgres RLS for bulletproof security. |
| **UI Generation** | Stitch MCP (Thinking 3.1) | Strictly used for frontend UI scaffolding, restricted from backend logic. |
| **Deployment** | Vercel (FE), Supabase (BE) | Zero-config frontend hosting and managed database scaling. |
| **Version Control**| GitHub | Industry standard for CI/CD and repository management. |

## 2. File & Folder Structure
```text
/
├── .github/workflows/          # CI/CD pipelines (frontend deploy, db migrations)
├── supabase/
│   ├── migrations/             # SQL migrations (schema, functions, triggers, RLS)
│   ├── seed.sql                # Initial mock data and admin user setup
│   └── config.toml             # Supabase local environment config
├── src/
│   ├── assets/                 # Static assets (images, icons)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui generated primitives
│   │   └── shared/             # Reusable custom components (e.g., DataTables, Modals)
│   ├── features/               # Domain-specific modules (groups, members, payments)
│   ├── hooks/                  # Custom React hooks (e.g., usePayments, useMembers)
│   ├── lib/                    # Utilities, Supabase client init, formatters
│   ├── pages/                  # Route components (Dashboard, Settings, etc.)
│   ├── types/                  # TypeScript interfaces (matching DB schema exactly)
│   ├── App.tsx                 # Router definition
│   └── main.tsx                # Entry point
├── .env.example                # Environment variable template
├── package.json
└── vite.config.ts
```

## 3. Database Schema (High-Level ERD)
*Note: All monetary fields strictly use `NUMERIC` to prevent float rounding errors.*

- **`admin_settings`** (Single row expected)
  - `id` (UUID, PK)
  - `business_name` (Text)
  - `admin_email` (Text) — **New:** Used to securely identify the admin in RLS policies without hardcoding UUIDs.
  - `logo_url` (Text, nullable)
  - `whatsapp_template` (Text)
  
- **`chit_groups`**
  - `id` (UUID, PK)
  - `name` (Text)
  - `chit_amount` (Numeric)
  - `max_members` (Int, default 30)
  - `duration_months` (Int)
  - `installment_amount` (Numeric)
  - `monthly_penalty_rate` (Numeric)
  - `penalty_calculation_mode` (Text: `linear_escalating`) — *Note: `flat_per_month` was removed to strictly adhere to the V1 requirement. Logic is hardcoded to linear.*
  - `grace_period_days` (Int, default 0)
  - `start_date` (Date)
  - `status` (Text: `Active` | `Archived`)

- **`members`**
  - `id` (UUID, PK)
  - `group_id` (UUID, FK to chit_groups)
  - `name` (Text)
  - `phone` (Text) — **CHECK Constraint:** `phone ~ '^\+91[6-9][0-9]{9}$'`
  - `address` (Text, nullable)
  - **UNIQUE:** `(group_id, phone)`

- **`payments`**
  - `id` (UUID, PK)
  - `receipt_number` (Text, UNIQUE) — Generated via DB Sequence
  - `member_id` (UUID, FK to members)
  - `group_id` (UUID, FK to chit_groups)
  - `installment_month` (Date)
  - `due_date` (Date) — **Note:** Explicitly derived as the 1st calendar day of `installment_month` (e.g., `date_trunc('month', installment_month)`) to anchor penalty calculations.
  - `installment_amount` (Numeric)
  - `penalty_amount` (Numeric)
  - `total_paid` (Numeric)
  - `payment_mode` (Text: `Cash` | `UPI` | `Bank Transfer`)
  - `remarks` (Text, nullable)
  - `paid_at` (Timestamp)
  - **Soft Delete Fields:** `voided_at` (Timestamp), `voided_by` (UUID), `void_reason` (Text)

- **`chit_releases`**
  - `id` (UUID, PK)
  - `group_id` (UUID, FK)
  - `member_id` (UUID, FK)
  - `release_month` (Date)
  - `amount` (Numeric)
  - `payment_mode` (Text)
  - `remarks` (Text, nullable)

## 4. Required APIs & Postgres Functions
The frontend will leverage Supabase's auto-generated REST API for standard reads. However, critical writes require custom Postgres RPC functions to enforce atomic consistency:

1. **`record_payment(member_id, installment_month, payment_mode, amount_paid, remarks)`**
   - **Logic:** 
     1. Fetches group `monthly_penalty_rate`, `grace_period_days`, and calculates `due_date` as `date_trunc('month', installment_month)`.
     2. **Linear Escalation Penalty:** Calculates penalty strictly based on `monthly_penalty_rate * number_of_months_overdue`. Overdue months calculated relative to `due_date + grace_period_days` vs `(now() AT TIME ZONE 'Asia/Kolkata')::date`. (Note: Explicitly using IST prevents 5.5 hour off-by-one errors compared to default UTC midnight. The `penalty_calculation_mode` field is locked to `linear_escalating` for V1).
     3. **Validates:** `amount_paid == installment_amount + calculated_penalty`. Throws an exception if false (rejects partial payments), returning the newly expected total for stale form updates.
     4. Obtains atomic ID: `SELECT nextval('receipt_seq')`.
     5. Formats receipt: `'RCT-' || to_char((now() AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY') || '-' || LPAD(seq_val::text, 4, '0')`.
     6. Inserts the payment and returns the record.
2. **`receipt_seq` Sequence:** `CREATE SEQUENCE receipt_seq START 1;`
3. **`active_payments_view`:** A PostgreSQL View that selects `SELECT * FROM payments WHERE voided_at IS NULL`. The frontend will query this view for ledgers to guarantee voided payments never accidentally leak into calculations.

## 5. AI Tooling Constraints (Stitch MCP)
> [!IMPORTANT]
> Stitch MCP (Thinking 3.1 Pro) will be strictly confined to frontend operations: generating React components, Tailwind styling, and shadcn/ui integration. **No business logic, penalty calculations, or receipt number generation will exist in the JavaScript payload.** The frontend acts purely as a dumb terminal presenting data and collecting inputs for Postgres to validate.

## 6. Deployment Plan
- **Frontend (Vercel):** Connected to the GitHub repository. Deploys automatically on pushes to `main`.
- **Backend (Supabase):** Database schema and functions managed via `supabase-cli` migrations.
- **CI/CD:** GitHub Actions configured to run `supabase db push` to keep the production schema in sync with the codebase.

## 7. Security Requirements (RLS)
- **Deny By Default:** Row-Level Security (RLS) enabled on *every* table.
- **Auth Setup:** Public email signup MUST be explicitly disabled in Supabase Auth settings to prevent unauthorized account creation.
- **Policies:** Since this is single-tenant, the policy pattern must check the email claim inside the user's JWT against the configured admin email. This avoids hardcoding a UUID in source control. We create a `SECURITY DEFINER` function `get_admin_email()` that fetches `admin_email` from `admin_settings`, and use it in our policies:
  - `CREATE POLICY "Admin All Access" ON <table> FOR ALL USING (auth.jwt() ->> 'email' = get_admin_email());`
- **Frontend Security:** Only the Supabase Anon Key and URL ship in the Vite bundle. Without a valid JWT (with the exact admin email), the API returns 401/403. 

## 8. Performance Requirements
- **Data Volume:** Expected scale is low (dozens of groups, hundreds of members, thousands of rows/year). Over-engineering pagination is unnecessary for V1.
- **Optimization:** Dashboard metrics (total collected, active groups) will be calculated via a PostgreSQL View (`dashboard_metrics_view`) to prevent the frontend from pulling down thousands of raw rows just to run `.reduce()`.

## 9. Third-Party Integrations
- **WhatsApp Integration:** Deep-linking using `wa.me/{phone}?text={encoded_string}`. 
  - *Future-Proofing:* By generating the template payload on the server/client and handing it to the browser as a URL, swapping to the WhatsApp Business API in V2 simply requires pointing the submit button to a Supabase Edge Function instead of an `href`.
- **PDF Generation:** Using `jsPDF` and `jspdf-autotable`. 
  - *Constraint & Trade-off:* We deliberately reject the HTML-to-Image (`html2canvas`) approach to preserve reliable pagination and searchable text for multi-page reports. We accept the trade-off that if member names are entered in Telugu, `jsPDF` may exhibit minor text-shaping flaws (e.g., misaligned vowel modifiers) due to the lack of a HarfBuzz shaping engine. This is deemed an acceptable compromise for internal, admin-facing ledgers.

## 10. Environment Variables
- `VITE_SUPABASE_URL` (Public) - Safe for frontend.
- `VITE_SUPABASE_ANON_KEY` (Public) - Safe for frontend.
- `SUPABASE_SERVICE_ROLE_KEY` (Secret) - Used *only* for backend admin scripts/migrations. NEVER exposed to Vite.
- `SUPABASE_DB_PASSWORD` (Secret) - Used for database migrations.

## 11. Architectural Fixes & Deviations from PRD
> [!WARNING]
> **Deviation 1: No Supabase Storage for Receipts**
> The PRD suggested storing PDF receipts. **Fix:** Do not store receipt files. Because payment rows are immutable (unless voided), the PDF should be generated deterministically on-the-fly in the browser whenever the admin clicks "Download Receipt". This eliminates the risk of DB vs. Storage sync failures during the atomic payment transaction and saves cloud storage costs.
> 
> **Deviation 2: Voided Payments in Calculations**
> If developers forget to append `WHERE voided_at IS NULL`, voided payments will ruin dashboard totals. **Fix:** Created an `active_payments_view` at the DB level. The frontend will be instructed to query this view instead of the base `payments` table for all financial calculations.
