# ChitLedger Feature Ticket List

This document contains a structured, sequential list of feature tickets to build the Chit Fund Management System (**ChitLedger**). Each ticket is designed to be fully self-contained and ready to be pasted directly as a prompt to the AI agent (**Antigravity**) using the **Stitch MCP Server** (Thinking 3.1 Pro) for UI generation and **Supabase** for backend operations.

---

## Ticket 1: Supabase Database Schema Migration
- **Feature Name:** Database Schema Migration
- **Task Description:** 
  Connect to the remote Supabase project `wnteyyiwkatfmhqcmhzy` and run a database migration to set up the relational schema, custom enums, tables, check constraints, foreign keys, indexes, views, trigger functions, triggers, security definer RPCs, and execute privilege grants. Use the exact definitions below:
  1. **Enums**:
     * `payment_mode_enum` ('cash', 'upi', 'bank_transfer')
     * `group_status_enum` ('active', 'archived')
     * `penalty_mode_enum` ('flat_per_month', 'linear_escalating')
  2. **Tables**:
     * `admin_settings`: `id` uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid, `business_name` text NOT NULL, `admin_email` text NOT NULL, `logo_url` text NULL, `whatsapp_template_en` text NOT NULL, `whatsapp_template_te` text NOT NULL, `created_at` timestamptz DEFAULT now() NOT NULL, `updated_at` timestamptz DEFAULT now() NOT NULL, with check constraint `CONSTRAINT chk_single_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)`.
     * `chit_groups`: `id` uuid PRIMARY KEY DEFAULT gen_random_uuid(), `name` text NOT NULL, `chit_amount` numeric(12,2) NOT NULL, `max_members` integer NOT NULL DEFAULT 30, `duration_months` integer NOT NULL, `installment_amount` numeric(12,2) NOT NULL, `monthly_penalty_rate` numeric(12,2) NOT NULL, `penalty_calculation_mode` penalty_mode_enum NOT NULL DEFAULT 'linear_escalating', `grace_period_days` integer NOT NULL DEFAULT 0, `start_date` date NOT NULL, `status` group_status_enum NOT NULL DEFAULT 'active', `created_at` timestamptz DEFAULT now() NOT NULL, `updated_at` timestamptz DEFAULT now() NOT NULL.
     * `members`: `id` uuid PRIMARY KEY DEFAULT gen_random_uuid(), `group_id` uuid NOT NULL REFERENCES chit_groups(id) ON DELETE RESTRICT, `name` text NOT NULL, `phone` text NOT NULL, `address` text NULL, `created_at` timestamptz DEFAULT now() NOT NULL, `updated_at` timestamptz DEFAULT now() NOT NULL. Set check constraint `CONSTRAINT chk_phone CHECK (phone ~ '^\+91[6-9][0-9]{9}$')` and unique constraint `CONSTRAINT uq_group_phone UNIQUE (group_id, phone)`.
     * `payments`: `id` uuid PRIMARY KEY DEFAULT gen_random_uuid(), `receipt_number` text NOT NULL UNIQUE, `member_id` uuid NOT NULL REFERENCES members(id) ON DELETE RESTRICT, `group_id` uuid NOT NULL REFERENCES chit_groups(id) ON DELETE RESTRICT, `installment_month` date NOT NULL, `due_date` date NOT NULL, `installment_amount` numeric(12,2) NOT NULL, `penalty_amount` numeric(12,2) NOT NULL DEFAULT 0, `total_paid` numeric(12,2) NOT NULL, `payment_mode` payment_mode_enum NOT NULL, `remarks` text NULL, `paid_at` timestamptz DEFAULT now() NOT NULL, `voided_at` timestamptz NULL, `voided_by` uuid NULL, `void_reason` text NULL. Set check constraints: `CONSTRAINT chk_total_paid CHECK (total_paid = installment_amount + penalty_amount)`, `CONSTRAINT chk_penalty_amount CHECK (penalty_amount >= 0)`, and `CONSTRAINT chk_void_integrity CHECK ((voided_at IS NULL AND void_reason IS NULL AND voided_by IS NULL) OR (voided_at IS NOT NULL AND void_reason IS NOT NULL AND voided_by IS NOT NULL))`.
     * `chit_releases`: `id` uuid PRIMARY KEY DEFAULT gen_random_uuid(), `group_id` uuid NOT NULL REFERENCES chit_groups(id) ON DELETE RESTRICT, `member_id` uuid NOT NULL REFERENCES members(id) ON DELETE RESTRICT, `release_month` date NOT NULL, `amount` numeric(12,2) NOT NULL, `payment_mode` payment_mode_enum NOT NULL, `remarks` text NULL, `released_at` timestamptz DEFAULT now() NOT NULL, `created_at` timestamptz DEFAULT now() NOT NULL.
     * `receipt_counters`: `year` integer PRIMARY KEY, `last_value` integer NOT NULL DEFAULT 0.
  3. **Indexes**:
     * Create index `idx_payments_member_month` on `payments(member_id, installment_month)`.
     * Create partial index `idx_payments_voided_at` on `payments(voided_at) WHERE voided_at IS NULL`.
     * Create index `idx_members_phone` on `members(phone)`.
     * Create index `idx_members_group_id` on `members(group_id)`.
     * Create index `idx_payments_group_id` on `payments(group_id)`.
     * Create index `idx_releases_group_month` on `chit_releases(group_id, release_month)`.
     * Create unique partial index `idx_unique_active_payment_per_month` on `payments(member_id, installment_month) WHERE voided_at IS NULL`.
  4. **Functions & Triggers**:
     * `get_admin_email()`: SECURITY DEFINER STABLE returning admin email from `admin_settings`.
     * `check_member_capacity()`: Trigger function that checks if count of members in `group_id` >= `max_members` from `chit_groups`, raising exception if capacity exceeded. Apply as `trg_check_member_capacity` BEFORE INSERT ON `members`.
     * `update_updated_at()`: Trigger function updating `updated_at` to `now()`. Apply BEFORE UPDATE to `admin_settings`, `chit_groups`, and `members`.
     * `record_payment()`: SECURITY DEFINER RPC accepting `p_member_id` (uuid), `p_installment_month` (date), `p_payment_mode` (payment_mode_enum), `p_amount_paid` (numeric), `p_remarks` (text). Validates that caller JWT email matches `get_admin_email()`. Fetches group parameters, calculates linear escalating penalty if today > (due_date + grace_period_days) (`monthly_penalty_rate` * full overdue months, min 1 month if overdue), asserts `p_amount_paid` equals installment + penalty, atomically increments `receipt_counters` for the current IST calendar year, formats `RCT-YYYY-NNNN`, inserts to `payments`, and returns the record.
     * `void_payment()`: SECURITY DEFINER RPC accepting `p_payment_id` (uuid) and `p_reason` (text). Validates caller JWT email. Asserts `p_reason` is non-empty, updates the payment setting `voided_at = now()`, `voided_by = auth.uid()`, and `void_reason = p_reason` where `voided_at IS NULL`, returning the record.
  5. **Grants and Revokes**:
     * Revoke EXECUTE on `record_payment`, `void_payment`, and `get_admin_email` from PUBLIC and anon.
     * Grant EXECUTE on `record_payment`, `void_payment`, and `get_admin_email` to authenticated.
     * Revoke EXECUTE on trigger functions `check_member_capacity` and `update_updated_at` from PUBLIC and anon.
  6. **Views**:
     * `active_payments_view`: `SELECT * FROM payments WHERE voided_at IS NULL`.
     * `dashboard_metrics_view`: Aggregates active groups, active members, and this calendar month's collections.
  7. **Row-Level Security**:
     * Enable RLS on all tables. Create policy `admin_full_access` on each table to allow ALL operations using `auth.jwt() ->> 'email' = get_admin_email()` and checking `auth.jwt() ->> 'email' = get_admin_email()`.
- **Acceptance Criteria:**
  - [ ] Migration applies on Supabase without errors.
  - [ ] All tables, enums, triggers, and views are visible in the database schema.
  - [ ] Trying to insert a record into any table with a non-admin JWT fails via RLS.
  - [ ] Attempting to execute `record_payment` or `void_payment` directly as anonymous throws an execution privilege error.
- **Dependencies:** None
- **Priority:** Must-Have
- **Estimated Complexity:** Medium

---

## Ticket 2: Supabase Authentication Setup and Seeding
- **Feature Name:** Auth Setup & Seeding
- **Task Description:** 
  Set up the authentication flow for the admin-only interface.
  1. Add a SQL seed statement in Supabase to insert a single seed row in `admin_settings` containing:
     * `id`: `'00000000-0000-0000-0000-000000000001'`
     * `business_name`: `'ChitLedger Admin'`
     * `admin_email`: `'admin@chitledger.com'`
     * `whatsapp_template_en`: `'Dear {member_name}, your installment for {month} is due. Installment: {installment}, Penalty: {penalty}, Total Due: {total}. Please pay to avoid further charges.'`
     * `whatsapp_template_te`: `'ప్రియమైన {member_name}, మీ {month} నెల వాయిదా చెల్లించాల్సి ఉంది. వాయిదా: {installment}, జరిమానా: {penalty}, మొత్తం: {total}. దయచేసి చెల్లించండి.'`
  2. Register the corresponding user `admin@chitledger.com` in Supabase Auth (auth.users) with password `AdminSecurePass123!`.
  3. Disable public signup in the Supabase project configuration (force signups off).
  4. Create a Login screen (`/`) in React using shadcn/ui forms. Enforce email/password credentials, validating against Supabase Auth. Successfully authenticated users must be routed to `/dashboard`, and unauthenticated route requests must redirect back to `/`.
  5. Implement password recovery: add a "Forgot Password" link on `/` that prompts for email, triggers Supabase's `resetPasswordForEmail`, and direct users to `/reset-password` on return to capture and update the new password via `updateUser`.
- **Acceptance Criteria:**
  - [ ] Database contains the seeded admin user and matching `admin_settings` row.
  - [ ] Navigating to `/dashboard` directly without logging in redirects to `/`.
  - [ ] Logging in with invalid credentials shows an inline error: "Invalid email or password."
  - [ ] Logging in with `admin@chitledger.com` and `AdminSecurePass123!` redirects to `/dashboard` and stores a valid JWT.
  - [ ] Password reset flow successfully sends the email and allows password updates on `/reset-password`.
- **Dependencies:** Ticket 1
- **Priority:** Must-Have
- **Estimated Complexity:** Small

---

## Ticket 3: Mobile-First App Shell & Navigation
- **Feature Name:** Mobile-First App Shell
- **Task Description:** 
  Implement a responsive shell and navigation layout using Tailwind CSS and shadcn/ui.
  1. **Mobile Layout (<768px)**:
     * Implement a bottom tab bar with 4 slots:
       * **Dashboard** (`/dashboard`) - Home icon
       * **Pending** (`/pending`) - Clock/Alert icon
       * **Groups** (`/groups`) - Folder/Users icon
       * **More** (`/more`) - Menu/Menu-ellipsis icon
     * When clicking "More", slide up a drawer/overlay containing links to: `Payments` (`/payments`), `Members` (`/members`), `Releases` (`/releases`), `Reports` (`/reports`), `Settings` (`/settings`).
  2. **Desktop Layout (>=768px)**:
     * Hide the bottom tab bar and display a sticky left sidebar containing all links: Dashboard, Pending Payments, Chit Groups, Payment History, Members List, Chit Releases, Reports, and Settings.
  3. Ensure a global shell wrapper handles JWT expiry: intercept API errors and, if a 401 Unauthorized token-expired error occurs, show a modal saying "Your secure session has expired. Please log in again to save your work." and redirect to `/` on dismissal without silently losing current form state.
- **Acceptance Criteria:**
  - [ ] On mobile viewports, the bottom tab bar is sticky and shows the correct icons and active state colors.
  - [ ] Clicking "More" on mobile successfully displays the overlay drawer containing secondary navigation routes.
  - [ ] On desktop, the sidebar is visible, and the bottom tab bar is hidden.
  - [ ] Simulating a 401 JWT expiration displays the intercept modal and redirects to `/`.
- **Dependencies:** Ticket 2
- **Priority:** Must-Have
- **Estimated Complexity:** Medium

---

## Ticket 4: Admin Settings Module
- **Feature Name:** Admin Settings Module
- **Task Description:** 
  Build the Admin Settings management page at `/settings`.
  1. Display a form bound to the single row in `admin_settings` (ID: `00000000-0000-0000-0000-000000000001`).
  2. Implement fields:
     * **Business Name** (TextInput, required)
     * **Business Logo** (File input that uploads the image to a Supabase Storage bucket called `logos` and stores the public URL in `logo_url`. If a logo already exists, show its preview).
     * **WhatsApp Reminder Template (English)** (Textarea, required, displaying help text showing available placeholders: `{member_name}`, `{month}`, `{installment}`, `{penalty}`, `{total}`, `{chit_name}`).
     * **WhatsApp Reminder Template (Telugu)** (Textarea, required).
  3. Implement a "Save Settings" button that updates the single row in the database, displaying a non-intrusive success toast upon completion.
- **Acceptance Criteria:**
  - [ ] Opening `/settings` pre-fills the form with the seeded values.
  - [ ] Modifying Business Name and clicking Save updates the `admin_settings` table.
  - [ ] Uploading a logo successfully uploads to Supabase Storage and renders a local image preview.
  - [ ] Blank inputs trigger standard frontend validation errors.
- **Dependencies:** Ticket 3
- **Priority:** Must-Have
- **Estimated Complexity:** Small

---

## Ticket 5: Chit Group CRUD
- **Feature Name:** Chit Group CRUD
- **Task Description:** 
  Build the Chit Group management module under `/groups` and `/groups/:id`.
  1. **Group List (`/groups`)**:
     * Display a tab switcher: "Active" (groups with status = `active`) and "Archived" (groups with status = `archived`).
     * Render a list/table showing Group Name, Chit Amount, Installment Amount, Members Count / Max Members, Grace Period, and Start Date.
     * Include a "Create Group" button opening a slide-out drawer or modal. Inputs: Name, Chit Amount (numeric), Duration in Months (integer), Installment Amount (numeric), Max Members (integer, default 30), Monthly Penalty Rate (numeric), Penalty Mode (fixed to `linear_escalating`), Grace Period Days (integer, default 0), and Start Date (date picker).
  2. **Group Detail (`/groups/:id`)**:
     * Render a configuration summary, financial KPIs (Total Collected vs Pending), and a list of members in this group.
     * Include an "Edit Group" button opening a modal. **Strict Rule**: The admin can edit *only* the group Name and Grace Period. The monetary and duration parameters (`chit_amount`, `installment_amount`, `duration_months`, `monthly_penalty_rate`) must be disabled/immutable to maintain financial ledger history.
- **Acceptance Criteria:**
  - [ ] Active and Archived tabs filter the group list correctly.
  - [ ] Creating a group inserts a row in `chit_groups` with correct default values and triggers a success toast.
  - [ ] Non-editable parameters are disabled in the Edit Group modal.
  - [ ] Invalid inputs (e.g. negative amounts or zero duration) trigger validation messages.
- **Dependencies:** Ticket 3
- **Priority:** Must-Have
- **Estimated Complexity:** Medium

---

## Ticket 6: Member CRUD & Capacity Validation
- **Feature Name:** Member CRUD & Capacity
- **Task Description:** 
  Implement Member management under `/members` and `/groups/:id/members`.
  1. **Add Member Flow**:
     * Add an "Add Member" button opening a modal. Inputs: Name (Text), Phone (Text), Address (Text), and Group Selection (Dropdown).
     * **Phone Number Formatting & Validation**: Enforce Indian mobile numbering. The input must validate against `^\+91[6-9][0-9]{9}$` using frontend regex before submission.
     * **Duplicate Phone Check**: On typing or submitting, query the `members` database table for existing instances of the phone number. If found elsewhere, display a yellow non-blocking warning banner: *"This phone number is already registered to [Existing Member Name]. Ensure this is correct."*
  2. **Capacity Enforcement**:
     * When inserting a member, the backend trigger `trg_check_member_capacity` will enforce the group's capacity limit. If the trigger fails, catch the error and display an explicit error message in the modal: *"Group has reached its maximum capacity of X members."*
  3. **Global Member List (`/members`)**:
     * Render a table of all members displaying Name, Phone, Group Name, and Date Joined.
- **Acceptance Criteria:**
  - [ ] Adding a member with a phone number that doesn't match `+91xxxxxxxxx` blocks submission with a validation error.
  - [ ] Registering a duplicate phone number displays the yellow non-blocking warning.
  - [ ] Inserting a 31st member into a group with a `max_members` cap of 30 fails and shows the capacity exceeded error.
  - [ ] Member row is linked to Member Detail (`/members/:id`).
- **Dependencies:** Ticket 5
- **Priority:** Must-Have
- **Estimated Complexity:** Medium

---

## Ticket 7: Record Payment Modal & System Calculation
- **Feature Name:** Record Payment Modal & Calculation
- **Task Description:** 
  Build the "Record Payment" modal triggered from any context (Dashboard, Pending Center, Member Detail).
  1. **Inputs**: Select Member (if not pre-filled), Select Installment Month (date picker limited to 1st of months), Payment Mode (Cash, UPI, Bank Transfer dropdown), Remarks (Textarea).
  2. **System Calculation**: Once Member and Month are selected, make a query to get the group's `installment_amount` and `monthly_penalty_rate`. Dynamically compute the linear escalating penalty:
     * `due_date` = 1st day of `installment_month`.
     * `grace_adjusted_due` = `due_date` + `grace_period_days`.
     * If `today` (IST) > `grace_adjusted_due`, calculate the number of overdue months (minimum 1 month).
     * `penalty_amount` = `monthly_penalty_rate` * `overdue_months`.
     * Display these values clearly in the UI: `Installment (₹X) + Penalty (₹Y) = Total Due (₹Z)`.
  3. **Currency Formatting**: Format all currency outputs using the Indian numbering system: `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
  4. **Strict Validation**:
     * Prompt the user for "Amount Paid".
     * If "Amount Paid" is not exactly equal to the computed "Total Due", show a red validation error: *"Amount must exactly match the total due (₹Z). Partial payments are not permitted."* and disable the "Confirm Payment" button.
  5. **Stale Total-Due Handler**:
     * If the payment is submitted, but the transaction fails on the server because the timezone shifted past midnight (causing the database's expected penalty to increment), intercept the database constraint/validation error.
     * Display a specific message: *"The amount due has changed since this form opened (₹[new_total] is now the updated total). Please review and resubmit."* and refresh the modal's expected values.
- **Acceptance Criteria:**
  - [ ] Amounts are formatted using Indian comma grouping (e.g. ₹5,00,000, not ₹500,000).
  - [ ] Selecting an overdue month displays the calculated linear penalty correctly.
  - [ ] Entering any amount other than the computed Total Due blocks submission.
  - [ ] Successfully submitting calls `record_payment()` RPC and closes the modal, generating a success toast.
- **Dependencies:** Ticket 6
- **Priority:** Must-Have
- **Estimated Complexity:** Large

---

## Ticket 8: Receipt Generation & Automatic Download
- **Feature Name:** Receipt PDF Generation
- **Task Description:** 
  Develop a client-side receipt generator that automatically compiles and downloads a PDF upon successful payment.
  1. Trigger this workflow immediately after the `record_payment()` RPC returns success.
  2. The service must parse the returned `payments` record, including the atomically generated `receipt_number` (format: `RCT-YYYY-NNNN`).
  3. Generate a clean, branded PDF layout containing:
     * Business Name and Logo (pulled from `admin_settings`)
     * Receipt Number (e.g., `RCT-2026-0001`) and Payment Date
     * Member Name and Phone Number
     * Chit Group Name
     * Paid Amount, Installment Amount, and Penalty Amount (formatted in Indian Rupee `₹`)
     * Payment Mode and Remarks
  4. Automatically trigger a browser download of the PDF file (naming convention: `Receipt_RCT-YYYY-NNNN.pdf`).
  5. Also place a manual "Download Receipt" button on all payment row items in the Payment History (`/payments`) and Member Ledger screens to regenerate the PDF.
- **Acceptance Criteria:**
  - [ ] PDF is generated dynamically in the frontend without requiring a backend PDF rendering service.
  - [ ] Recording a payment automatically downloads the correct PDF receipt.
  - [ ] PDF layout displays correct business metadata, receipt numbers, and Indian currency formats.
  - [ ] Manual download buttons generate the identical PDF layout.
- **Dependencies:** Ticket 7
- **Priority:** Must-Have
- **Estimated Complexity:** Medium

---

## Ticket 9: Void Payment Flow
- **Feature Name:** Void Payment Flow
- **Task Description:** 
  Implement the soft-delete transaction voiding workflow for payments.
  1. Add a red "Void" button next to payment records in the Global Payment History (`/payments`) and Member Detail Ledger.
  2. Clicking "Void" opens a red-themed confirmation modal: *"Are you sure you want to void Receipt RCT-YYYY-NNNN?"*.
  3. Add a mandatory `Void Reason` textarea input. Keep the confirm button disabled until at least 5 characters of explanation are typed.
  4. Submitting must call the `void_payment(p_payment_id, p_reason)` RPC.
  5. On success, close the modal, display a toast notification, and update the UI.
- **Acceptance Criteria:**
  - [ ] Clicking Void on a payment row opens the modal displaying the correct receipt number.
  - [ ] Submit button remains disabled until a void reason is entered.
  - [ ] Submitting invokes the `void_payment` RPC, which sets `voided_at` in the database.
  - [ ] Voided transactions are visually struck-through in lists and display a red `VOIDED` badge.
- **Dependencies:** Ticket 8
- **Priority:** Must-Have
- **Estimated Complexity:** Small

---

## Ticket 10: Member Payment Ledger & History
- **Feature Name:** Member Detail & Ledger
- **Task Description:** 
  Build the Member Detail view under `/members/:id`.
  1. **Overview Panel**: Display the Member's Name, Phone, Address, Group Name, Total Paid to Date (sum of active payments), and Total Pending (count of unpaid installments * installment amount).
  2. **Ledger Table**: Render a chronological list of all payments associated with this member.
     * Columns: Receipt #, Date, Installment Month, Paid Amount, Penalty, Mode, Status (Active vs Voided).
     * Voided records must be styled with a strike-through, a red `VOIDED` badge, and show the void reason in a tooltip or collapsed details row.
     * Include a "Download Receipt" button for each active row.
  3. Include a "Send WhatsApp Reminder" action button (flows to Ticket 11).
- **Acceptance Criteria:**
  - [ ] Overview panel correctly displays total paid and pending balances.
  - [ ] Ledger table displays both active and voided records with appropriate badges and strike-through styles.
  - [ ] Clicking "Download Receipt" on a row triggers the PDF download.
- **Dependencies:** Ticket 9
- **Priority:** Must-Have
- **Estimated Complexity:** Medium

---

## Ticket 11: Pending Payment Center & WhatsApp Reminder Link
- **Feature Name:** Pending Payment Center & WhatsApp Link
- **Task Description:** 
  Build the collection tracking panel at `/pending`.
  1. **Pending Ledger**:
     * Fetch and list all members with outstanding payments for the current or past months (i.e. months where no non-voided payment exists in `payments` for that member).
     * Columns: Member Name, Chit Group, Installment Month, Overdue Penalty (₹), Total Due (₹).
     * Add a "Record Payment" button on each row that opens the payment modal pre-filled with the member and installment month details.
     * Add an "Empty State" graphic and message: *"All clear! Every member is up to date on their payments."* when no items are pending.
  2. **WhatsApp Reminder Link**:
     * Add a "Send Reminder" button on each row.
     * Clicking it must query `admin_settings` for the correct `whatsapp_template_en` or `whatsapp_template_te` based on the active language in `react-i18next`.
     * Dynamically replace the placeholders: `{member_name}`, `{month}` (formatted as Month YYYY), `{installment}`, `{penalty}`, `{total}` (formatted as Indian currency), and `{chit_name}`.
     * **Zero-Penalty Logic**: If the calculated penalty is 0, strip the sentence containing `{penalty}` or `{total}` (or adjust the text to mention only the installment amount) so that reminders to non-overdue members don't mention penalty charges.
     * Open a new browser tab redirecting to: `https://wa.me/<E.164_phone_number>?text=<URL_encoded_message>`.
- **Acceptance Criteria:**
  - [ ] The pending list displays only members who actually have unpaid installments for a given month.
  - [ ] Clicking "Send Reminder" correctly formats and URL-encodes the message template.
  - [ ] If penalty is 0, the reminder text does not mention penalties.
  - [ ] The action opens a new tab directed to the member's E.164 phone number.
- **Dependencies:** Ticket 10
- **Priority:** Must-Have
- **Estimated Complexity:** Medium

---

## Ticket 12: Chit Release Flow
- **Feature Name:** Chit Release Flow
- **Task Description:** 
  Implement outbound chit release recording under `/releases`.
  1. **Record Release Modal**:
     * Inputs: Group Selection (Dropdown), Member Selection (Dropdown, filtered by members in the selected group), Release Month (Date, 1st of month), Amount Released (Numeric), Payment Mode, Remarks (Text).
     * **Eligibility Check**: Upon selecting a member, query the database for any pending payments. If the member has outstanding dues, display a prominent yellow warning banner: *"Warning: [Member Name] currently owes ₹[Total Due] in pending payments. Are you sure you want to release the chit to them?"*
     * **Hold Enforcement**: Disable the Submit button if the warning banner is active. The admin must check a checkbox reading *"I acknowledge the pending dues and authorize this release"* to unlock the Submit button.
  2. **Release History (`/releases`)**:
     * Display a chronological log of all releases showing Group Name, Member Name, Release Month, Released Amount (in Indian currency), Date, and Mode.
- **Acceptance Criteria:**
  - [ ] Selected member with no dues shows no warning; modal can be submitted immediately.
  - [ ] Selected member with dues displays the yellow warning banner and locks the submit button until the confirmation checkbox is ticked.
  - [ ] Recording a release successfully inserts a row in `chit_releases`.
- **Dependencies:** Ticket 10
- **Priority:** Must-Have
- **Estimated Complexity:** Medium

---

## Ticket 13: Dashboard Metrics, Activity, and Charts
- **Feature Name:** Dashboard & Charts
- **Task Description:** 
  Develop the primary metrics dashboard at `/dashboard`.
  1. **KPI Row**: Render 4 cards in a 2-column mobile grid:
     * Active Groups (count of active groups)
     * Active Members (count of members in active groups)
     * Collections This Month (sum of active payments in current calendar month)
     * Total Pending This Month (sum of unpaid installment amounts for the current month)
  2. **Pending Preview**: Display a card stacked above recent activity showing the top 3-5 oldest overdue members with quick-action "Send Reminder" buttons.
  3. **Recent Activity**: Render the 5 most recently recorded active payments showing Receipt #, Member Name, Group, Amount, and Time.
  4. **Analytics Charts**: Integrate three lightweight charts (using Recharts or Chart.js):
     * *Monthly Collections Trend*: Line chart showing collections over the last 6 months.
     * *Group-wise Collection vs Pending*: Bar chart showing total collected vs total pending per active group.
     * *Payment Mode Distribution*: Pie/Donut chart displaying count or volume split between Cash, UPI, and Bank Transfer.
- **Acceptance Criteria:**
  - [ ] KPI cards render correctly using the `dashboard_metrics_view`.
  - [ ] Pending preview lists the oldest unpaid records first.
  - [ ] Charts populate correctly with historical database values.
  - [ ] Responsive scaling works on mobile devices without clipping.
- **Dependencies:** Ticket 12
- **Priority:** Must-Have
- **Estimated Complexity:** Large

---

## Ticket 14: Reports Center & PDF Export
- **Feature Name:** Reports & PDF Export
- **Task Description:** 
  Build the Reports & Export Center at `/reports`.
  1. **Report Selection**: Implement a dropdown to select one of the following 6 report types:
     * **Daily Collection**: Payments recorded on a specific date.
     * **Monthly Ledger**: Grid of all payments in a selected month.
     * **Defaulters List**: All members with overdue balances as of today.
     * **Release Ledger**: Outbound releases recorded in a date range.
     * **Voided Transactions Audit**: All payments where `voided_at IS NOT NULL` showing void reason and user.
     * **Group Status Report**: Summary of all groups, total value, active duration, status, and members.
  2. **Filters**: Add a date-range picker and a text-based search input.
  3. **On-Screen Table**: Display the matching data in a paginated grid.
  4. **PDF Export**: Implement a "Generate PDF" button. It must compile the current on-screen table contents into a clean, professional, print-friendly PDF document and prompt a browser download.
- **Acceptance Criteria:**
  - [ ] All 6 report types retrieve and render the correct data.
  - [ ] Date-range filters and search inputs update the on-screen table.
  - [ ] Clicking Generate PDF downloads a PDF representing the exact filtered data.
- **Dependencies:** Ticket 13
- **Priority:** Should-Have
- **Estimated Complexity:** Large

---

## Ticket 15: Per-Module Search & Filter Bars
- **Feature Name:** Per-Module Search
- **Task Description:** 
  Implement dedicated search and filter panels inside individual screens (do not use a global navigation search bar).
  1. **Chit Groups (`/groups`)**: Add an input to filter groups by name.
  2. **Members List (`/members`)**: Add an input to search members by Name or Phone.
  3. **Payments Ledger (`/payments`)**: Add an input to filter payments by Receipt Number or Member Name.
  4. **Reports Center (`/reports`)**: Add a search input to filter the generated report table's rows locally in the UI.
  All search operations must execute instantly (debounce inputs by 150ms).
- **Acceptance Criteria:**
  - [ ] Typing in the Members list search bar filters rows by name and phone.
  - [ ] Typing in the Payments history filters by receipt number or member name.
  - [ ] Typing in the Reports view filters the report table.
  - [ ] Searches are fast and debounced to prevent unnecessary database queries.
- **Dependencies:** Ticket 14
- **Priority:** Must-Have
- **Estimated Complexity:** Small

---

## Ticket 16: Chit Closure Workflow
- **Feature Name:** Chit Closure Workflow
- **Task Description:** 
  Implement the group closure and archiving lifecycle inside the Group Detail page `/groups/:id`.
  1. Add a "Close Group" action button (only visible for groups with status = `active`).
  2. Clicking it opens a confirmation modal warning: *"Closing this group permanently stops all new payments and releases. This action cannot be undone."*
  3. Add a confirmation input: the admin must type the exact name of the group to enable the "Archive Group" confirmation button.
  4. Submitting updates the target group record in `chit_groups` setting `status = 'archived'`.
  5. **Post-Archive Read-Only State**:
     * Archived groups must move to the "Archived" tab under `/groups`.
     * The detail view `/groups/:id` remains accessible but write actions (e.g., "Record Payment", "Record Release", "Add Member", "Edit Group") are completely hidden/disabled.
- **Acceptance Criteria:**
  - [ ] Confirmation button is disabled until the exact group name is typed.
  - [ ] Submitting updates status to `archived` in the DB and shows a success toast.
  - [ ] Navigation to an archived group detail page hides all action triggers.
- **Dependencies:** Ticket 12
- **Priority:** Must-Have
- **Estimated Complexity:** Small

---

## Ticket 17: Mobile-Responsive Table Handling
- **Feature Name:** Mobile-Responsive Tables
- **Task Description:** 
  Optimize all tabular displays across the application (Groups, Members, Payments, Pending, Releases, Reports) to fit mobile screen widths (<768px) per the UI specification.
  1. For large tables (e.g., Reports, Payments Ledger), wrap the table elements in horizontal overflow containers with `-webkit-overflow-scrolling: touch` to allow smooth swipe scrolling.
  2. Implement selective column visibility: hide non-essential columns on mobile screen widths (e.g., hide Address on the Members list; hide Payment Mode and Remarks on the Payments ledger).
  3. For cards or list items, design an alternate stacked layout for mobile screens where each row renders as a card (e.g., in the Pending Payments list, render each pending item as a separate block card showing Member Name, Group, Month, and Due Amount with stacked action buttons).
- **Acceptance Criteria:**
  - [ ] Tables do not break parent container boundaries or cause global horizontal window scrolling on mobile screens.
  - [ ] Important fields (Name, Amount) are prioritized on narrow viewports.
  - [ ] Action buttons are scaled to be touch-friendly (min 44px height).
- **Dependencies:** Ticket 15
- **Priority:** Must-Have
- **Estimated Complexity:** Medium
