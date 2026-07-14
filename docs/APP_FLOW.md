# App Flow & UX Document: ChitLedger
*Prepared for Antigravity & Stitch MCP UI Generation*

---

## 1. Full Navigation Map
*Mobile employs a 4-slot Bottom Tab Bar (`Dashboard`, `Pending`, `Groups`, `More`). Desktop uses a left sidebar for all routes. The routes below outline the URL structure, with UI chrome annotations.*

```text
/ (Login Route)
└── /dashboard (Tab 1: Dashboard)
    ├── /pending (Tab 2: Pending Payments)
    ├── /groups (Tab 3: Chit Groups)
    │   ├── /groups/archived (Closed/Archived Groups)
    │   └── /groups/:id (Group Detail)
    │       ├── /groups/:id/members (Manage Group Members)
    │       └── /groups/:id/ledger (Group-specific Payment Ledger)
    └── /more (Tab 4: More / Drawer Menu)
        ├── /payments (Global Payment History / Ledger)  <-- *Moved from primary to secondary visibility*
        ├── /members (Global Member List)
        │   └── /members/:id (Member Detail & Individual Ledger)
        ├── /releases (Chit Releases History)
        ├── /reports (Reports & Export Center)
        └── /settings (Admin Settings & Configurations)
```
*Reachability Flag:* Global Payment History (`/payments`) now requires one extra tap on mobile (More -> Payments). This is an acceptable trade-off because daily collections are driven entirely by the `Pending` tab (Tab 2), making the master payment history primarily an auditing tool rather than a daily-driver screen. `Groups` (Tab 3) was elevated to primary visibility to reduce friction for the "Create Group" and "Add Member" workflows. Modals are triggered over their respective active routes.

---

## 2. Screen Definitions

### 2.1 Login Screen
- **Purpose:** Secure admin access.
- **Data Shown:** Email input, Password input, "Forgot Password" link.
- **Actions:** 
  - `Login`: Validates credentials via Supabase. Success routes to `/dashboard`.
  - `Forgot Password`: Opens recovery flow.

### 2.2 Dashboard
- **Purpose:** At-a-glance business health and primary daily operations hub.
- **Data Shown (Mobile-First Layout):** 
  - **KPI Cards:** Total Active Groups, Total Active Members, Collections This Month (₹), Total Pending This Month (₹). (Rendered as a tight 2-column grid on mobile).
  - **Pending Payments Preview:** Stacked *above* recent activity. Shows the top 3-5 members who are overdue right now.
  - **Recent Activity Feed:** Stacked *below* pending payments. List of the 5 most recently recorded payments.
- **Actions:**
  - `Record Payment`: Full-width primary button located prominently below the KPI cards.
  - `Send Reminder`: Quick-action buttons directly on the Pending Payments preview rows.
  - Mobile bottom tab bar links to core modules; Desktop sidebar links to all modules.

### 2.3 Chit Group List (Active & Archived)
- **Purpose:** Manage the lifecycle of chit groups.
- **Data Shown:** Table of groups (Name, Chit Amount, Duration, Members Count, Installment Amount, Status). Tabs toggle Active vs Archived.
- **Actions:**
  - `Create Group`: Opens sliding drawer/modal to input group configs (Amount, duration, grace period, monthly penalty rate).
  - `Row Click`: Navigates to Group Detail (`/groups/:id`).

### 2.4 Chit Group Detail
- **Purpose:** Deep dive into a specific group's health and configs.
- **Data Shown:** Group config summary, total collected vs pending for this group, quick list of group members.
- **Actions:**
  - `Edit Group`: Modifies non-destructive fields (Name, Grace Period). *Intentional Design Decision:* Financial parameters (`chit_amount`, `installment_amount`, `monthly_penalty_rate`) are completely immutable after creation to guarantee historical ledger integrity.
  - `Close Group`: Triggers the Chit Closure Flow (see Section 3.5).
  - `Record Release`: Triggers Chit Release Flow for this group.

### 2.5 Global Member List
- **Purpose:** Central repository of all participants.
- **Data Shown:** Table (Name, Phone, Associated Group Name, Status). Search bar filters by Name/Phone.
- **Actions:**
  - `Add Member`: Opens modal (Name, E.164 Phone, Select Group, Address).
  - `Row Click`: Navigates to Member Detail.

### 2.6 Member Detail & Ledger
- **Purpose:** Track an individual's financial standing.
- **Data Shown:** Profile info, total paid to date, total pending. Table of all historical payment records for this member.
- **Actions:**
  - `Send WhatsApp Reminder`: Deep-links to `wa.me/<phone>?text=<encoded_template>`.
  - `Record Payment`: Pre-fills the member context in the payment modal.

### 2.7 Pending Payment Center
- **Purpose:** The operational hub for collections.
- **Data Shown:** Filterable list of members who owe money for past or current months. Columns: Member Name, Group, Installment Month, Overdue Penalty (₹), Total Due (₹).
- **Actions:**
  - `Send Reminder` (Primary Action): Opens `wa.me/<E.164>?text=<url-encoded-message>` in a new tab. **Crucial UX:** This does *not* mark the row as paid or followed-up in the database. The row remains pending until a payment is explicitly recorded.
  - `Record Payment`: Opens modal pre-filled with this pending record.

### 2.8 Global Payment History / Ledger
- **Purpose:** Immutable audit log of all cash flows.
- **Data Shown:** Chronological table of `active_payments_view` (Receipt #, Date, Member, Group, Amount, Mode).
- **Actions:**
  - `Download Receipt`: Generates PDF on-the-fly and triggers browser download.
  - `Void Payment` (Red/Destructive Button): Opens Void Payment Modal.

### 2.9 Reports Center
- **Purpose:** Exportable snapshots for accounting.
- **Data Shown:** Simple UI to select Report Type (Daily Collection, Monthly Ledger, Defaulters List) and Date Range.
- **Actions:**
  - `Generate PDF`: Compiles on-screen tabular data into a PDF and triggers download.

### 2.10 Admin Settings
- **Purpose:** Global business configurations.
- **Data Shown:** Business Name, Logo Upload (preview), WhatsApp Template textarea (with helper text showing available placeholders `{member_name}`, `{penalty}`, etc.).
  - *Note:* The WhatsApp Template textarea explicitly manages the `whatsapp_template_te` (Telugu) column to enforce member-facing messages in Telugu.
- **Actions:**
  - `Save Settings`: Updates `admin_settings` row in Supabase.

---

## 3. Step-by-Step Core Flows

### 3.1 Login & Recovery Flow
1. **Login:** Admin lands on `/`. No signup button exists (public signup is disabled in backend). Admin enters email/password.
2. **Recovery:** If clicking "Forgot Password", admin enters email. Supabase sends a reset link. Link routes back to a `/reset-password` screen to set a new password.

### 3.2 The "Record Payment" Flow
*Critical Flow: Designed to prevent mathematical discrepancies.*
1. Admin clicks `Record Payment` (from Dashboard, Pending Center, or Member Ledger).
2. Modal opens. Admin selects Member and Installment Month (if not pre-filled).
3. **System Calculation:** The UI instantly queries Postgres or calculates via the exact TRD logic to display: `Installment (₹X) + Penalty (₹Y) = Total Due (₹Z)`.
4. **Input:** Admin inputs `Amount Paid` and selects `Payment Mode`.
5. **Validation Step:** 
   - **Data Entry Error:** If `Amount Paid` does not exactly equal `Total Due`, an inline red error appears: *"Amount must exactly match the total due (₹Z). Partial payments are not permitted."* and the `Confirm Payment` button disables.
   - **Stale Total-Due Error:** If the server rejects the payment because the expected penalty dynamically changed (e.g., the timezone rolled over midnight while the form was open), the server returns the updated total. The UI intercepts this specific error and displays: *"The amount due has changed since this form opened (₹[new_total] is now the updated total). Please review and resubmit."*, and automatically updates the modal's `Total Due` value.
6. **Execution:** Once matched, admin clicks `Confirm Payment`.
7. **Success:** Modal closes, a toast notification appears ("Payment Recorded Successfully"), and the UI automatically downloads the PDF receipt (RCT-YYYY-NNNN).

### 3.3 The "Void Payment" Flow
1. Admin identifies a mistake in the Payment History and clicks `Void Payment`.
2. A red-themed modal opens: *"Are you sure you want to void Receipt RCT-YYYY-NNNN?"*
3. **Input:** Admin *must* type a reason into a mandatory `Void Reason` text area. The confirm button is disabled until text is entered.
4. **Execution:** Admin clicks `Void Transaction`.
5. **Post-Void Display:** The payment row immediately updates. It is visually struck-through, receives a red `VOIDED` badge, and is excluded from all top-level dashboard totals (driven by `active_payments_view`), but remains visible in the master ledger for auditing.

### 3.4 Chit Release Flow
1. Admin navigates to `/releases` and clicks `Record Release`.
2. Admin selects a Group, then selects the Member receiving the lump sum.
3. **Eligibility Check:** If the selected Member has unpaid installments, a non-blocking yellow warning banner appears inside the modal: *"Warning: [Member Name] currently owes ₹[Total Due] in pending payments. Are you sure you want to release the chit to them?"*
4. **Confirmation:** Admin must check a confirmation checkbox ("I acknowledge the pending dues") to un-disable the Submit button.
5. **Execution:** Admin inputs amount and mode, then submits.

### 3.5 Chit Closure Flow
1. Admin goes to Group Detail and clicks `Close Group`.
2. A modal appears warning: *"Closing this group permanently stops all new payments and releases. This action cannot be undone."*
3. Admin types the name of the group to confirm.
4. **Execution:** Group status changes to `Archived`.
5. **Post-Archive:** The group moves to the Archived tab. The `/groups/:id` route remains accessible in a read-only state. The "Record Payment" and "Record Release" buttons disappear for this group.

---

## 4. Global States & Handlers

### 4.0 Global Header & Navigation
- **Language Toggle:** A persistent EN/TE (English/Telugu) toggle resides in the top-right header across all authenticated screens. It switches the `react-i18next` language context for all UI labels, table headers, and form fields. The preference is saved in `localStorage`.

### 4.1 Empty States
Every list/table must have a friendly, actionable empty state:
- **Groups:** "No chit groups yet. Create your first group to start collecting." (Button: Create Group)
- **Members:** "No members added. Select a group and add members to begin."
- **Pending Center:** "All clear! Every member is up to date on their payments." (Show a success/celebration icon).
- **Payment History:** "No payments recorded yet."
- **Chit Releases:** "No chit releases recorded yet."
- **Reports:** "No reports generated yet. Select a report type and date range to get started."

### 4.2 Error States
- **Network Failure:** If Supabase is unreachable during payment recording, show a toast: *"Connection error. Payment was not recorded. Please check your internet and try again."* (Do not clear the form inputs).
- **Duplicate Phone Number:** When adding a member, if the E.164 phone number already exists, show an inline yellow warning: *"This phone number is already registered to [Other Member Name]. Ensure this is correct."* (Non-blocking).
- **Receipt Collision (Edge Case):** Handled implicitly by Postgres sequences, but if the RPC fails for any unexpected constraint, display: *"Transaction failed. Please try again or refresh the page."*
- **Malformed Phone on Reminder:** If the WhatsApp button is clicked but the phone number is invalid (bypassed E.164 somehow), disable the button and show tooltip: *"Invalid phone number format."*
- **Session Expiry (JWT Token Expired):** If an API call fails with 401 Unauthorized because the session expired mid-action (e.g., while filling out a Record Payment form), the system must intercept the error. Show an explicit modal/toast: *"Your secure session has expired. Please log in again to save your work."* (Do not silently discard unsaved input without warning). On clicking OK, redirect to `/`.

### 4.3 Success States
- Use non-intrusive Toast Notifications (bottom-right) for CRUD success.
  - "Chit Group created successfully."
  - "Payment recorded. Receipt RCT-2023-0001 generated."
- Do *not* force the user to click "OK" on success modals; use auto-dismissing toasts to maintain speed.

### 4.4 Decision Points (State-Based Branches)
- **Group Status = Archived:** All Write actions (`Record Payment`, `Add Member`, `Edit Group`) are hidden. Read actions (`Download Ledger`, `View Members`) remain active.
- **Penalty = 0:** When triggering a WhatsApp reminder, the logic must parse the custom template and explicitly strip out the sentence containing `{penalty}`.
- **Amount Mismatch:** As defined in 3.2, if input amount < or > total due, the flow branches to a hard-stop validation error.
