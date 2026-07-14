# Product Requirements Document: Internal Chit Fund Management System

## 1. App Name & One-Line Pitch
**App Name:** ChitLedger (Internal Codename)
**One-Line Pitch:** A fast, single-tenant, admin-only digital ledger that replaces paper notebooks for chit fund management, eliminating manual bookkeeping, speeding up collections, and ensuring zero missed payments.

## 2. Problem Statement
Running a chit fund on paper notebooks and WhatsApp is slow, error-prone, and lacks visibility. The business owner currently spends hours manually cross-checking notebooks to find non-payers, handwriting receipts, and searching WhatsApp contacts to type individual reminders. This leads to delayed collections, potential financial discrepancies, and zero analytical insight into the overall health of the business.

## 3. Target User Profile
- **Role:** Single, non-technical business owner (Admin).
- **Current State:** 100% paper-based workflows; uses WhatsApp for communication.
- **Tech Comfort:** Moderate smartphone comfort.
- **Primary Goals:** Speed (instant lookups instead of flipping pages) and Trust (never losing or miscounting money). The system must feel as simple as a notebook but provide the power of automated calculations and reminders.

## 4. Product Vision (6–12 Month Horizon)
To become the single source of truth for the chit fund business. While V1 focuses on digitizing the core ledger and replacing manual reminders with one-click actions, V2 will introduce automated WhatsApp Business API integrations for zero-touch reminders and advanced cash flow forecasting. The core philosophy remains constant: minimal data entry, maximum financial control, and zero member-facing complexity.

## 5. Core Features Table

| Feature | Priority | Rationale for Nice-to-Have Exclusion (if applicable) |
| :--- | :--- | :--- |
| **Admin Authentication** (Supabase Auth) | Must-Have | Core security requirement. |
| **Language Toggle (English/Telugu)** | Must-Have | Admin UI localization for better accessibility. |
| **Admin Settings Module** (WhatsApp templates, receipt branding) | Must-Have | Required to support configurable templates and business branding. |
| **Chit Group CRUD** (custom amounts, max 30 members, grace period, durations) | Must-Have | Foundational for business operations. |
| **Member CRUD** (E.164 phone validation, duplicate warning) | Must-Have | Foundational for business operations. |
| **Monthly Payment Recording** (linear penalty calc, strict full-payment validation) | Must-Have | Replaces the core notebook entry workflow. |
| **Payment Editing and VOIDING** (soft delete with reason, audit trail) | Must-Have | Critical for financial integrity and trust. |
| **Auto-generated PDF Receipts** (RCT-YYYY-NNNN, branded) | Must-Have | Replaces manual receipt writing. |
| **Per-Member Payment Ledger/History** | Must-Have | Replaces flipping through notebook pages. |
| **Pending Payment Center** | Must-Have | Directly solves the pain point of finding non-payers. |
| **One-Click WhatsApp Reminders** (dynamic templates) | Must-Have | Replaces manual typing and contact searching. *Always sent in Telugu regardless of Admin UI toggle.* |
| **Chit Release Tracking** (warning on pending dues) | Must-Have | Required to track outbound cash flow. |
| **Module-Specific Search** (Members, Payments, Groups, Reports) | Must-Have | Required for speed of navigation. |
| **Chit Closure Workflow** | Must-Have | Required for proper data lifecycle management. |
| **Dashboard (KPI Cards)** (active groups, total members, month collection, pending) | Must-Have | Provides immediate business visibility. |
| **Dashboard (Simple Charts)** | Nice-to-Have | Number summaries are sufficient for day 1; charting libraries add UI complexity and can be deferred to a fast-follow update. |
| **Reports (PDF Export for all views)** | Nice-to-Have | On-screen tabular views satisfy the immediate need for data access. PDF generation for every report type adds significant dev overhead for V1. |

## 6. User Roles
**Admin Only.** 
*Explicit Note:* There are NO other roles in V1. There are no staff accounts, no collection agent accounts, and no member self-service portals.

## 7. User Stories
* **Authentication:** As an Admin, I want to log in securely so that my financial data is protected from unauthorized access.
* **Global Settings:** As an Admin, I want to configure my business name, logo, and WhatsApp message templates so that my communications and receipts look professional and consistent.
* **Group Management:** As an Admin, I want to create a new chit group with custom parameters (amount, duration, grace period) so that I can accommodate different types of chits.
* **Member Management:** As an Admin, I want to add members and receive a warning if their phone number already exists, so that I don't accidentally create duplicates while maintaining the strict 1-to-1 group mapping rule.
* **Payment Recording:** As an Admin, I want to record a monthly payment, and have the system calculate a linear penalty based on overdue months, so that I save time and avoid manual calculation errors.
* **Payment Validation:** As an Admin, I want the system to reject any partial payment entry so that the ledger stays strictly tied to full monthly installments.
* **Audit & Trust:** As an Admin, I want to void an incorrect payment with a mandatory recorded reason so that the financial audit trail remains intact and trustworthy (no hard deletes).
* **Receipts:** As an Admin, I want the system to auto-generate a sequential PDF receipt (with my branding) upon payment so that I can easily share a professional proof of payment with the member.
* **Visibility:** As an Admin, I want to view a Pending Payment Center so that I can instantly see who owes money this month across all groups without checking notebooks.
* **Communication:** As an Admin, I want to click a button to send a pre-filled WhatsApp reminder using my custom template, so that I don't have to manually search contacts and type repetitive messages (with zero-penalty lines dynamically omitted).
* **Outbound Tracking:** As an Admin, I want to record the monthly chit release and be warned if the recipient has pending dues, so that I can make an informed decision before handing over the lump sum.
* **Analytics:** As an Admin, I want to view a dashboard with key metrics (collections, pending) so that I can understand the business's current standing at a glance.
* **Navigation:** As an Admin, I want to search for members, payments, and groups within their respective modules so that I can find information instantly.
* **Lifecycle:** As an Admin, I want to close a chit group when its duration ends so that it stops accepting payments and is safely archived.

## 8. MVP Scope (V1 Release)
- **Auth:** Supabase Email/Password authentication for a single Admin account.
- **Admin Settings Module:** Dedicated UI/Table to manage global configurations:
  - Business Name (Text)
  - Business Logo (Image Upload)
  - WhatsApp Reminder Template (Text with placeholders: `{member_name}`, `{month}`, `{installment}`, `{penalty}`, `{total}`, `{chit_name}`). *Note: Must support storing a strict Telugu template (`whatsapp_template_te`) to guarantee member-facing messages are in Telugu.*
- **Group Module:** CRUD operations for Chit Groups. Support for custom amounts (e.g., ₹3L–₹10L+), max 30 members, start date, duration, installment amount, and Active/Archived status.
  - **Grace Period Config:** `grace_period_days` (Integer) added to Group schema, defaults to 0.
- **Member Module:** CRUD operations. Strict E.164 phone validation. 1-to-1 mapping with a Chit Group.
  - **Duplicate Check:** Non-blocking UI warning if phone number exists elsewhere in the DB.
- **Payment Engine:** Record payments with Mode (Cash/UPI/Bank Transfer).
  - **Penalty Calculation:** Linear arithmetic model (`monthly_penalty_rate * number_of_months_overdue`). Calculated independently per unpaid installment based on `(due_date + grace_period_days)`.
  - **Validation:** Strict rejection of partial payments (amount entered must equal exactly the `total due` for that installment).
  - **Voiding:** Soft delete with reason and timestamp.
- **Receipt Engine:** Generate collision-proof sequential IDs (RCT-YYYY-NNNN) backed by a database sequence, outputting a branded downloadable PDF.
- **Views & UI:** 
  - Pending Payment Center (cross-group view of unpaid installments for the current month).
  - Per-member ledger.
  - Dashboard with KPI cards.
  - Per-module search bars.
- **Communication:** `wa.me` deep links for WhatsApp reminders.
  - Plugs values into the Admin's custom template.
  - Dynamically omits the penalty sentence/line if penalty = 0.
  - *Constraint:* Sent messages must be strictly in Telugu, converting dynamic month placeholders (e.g. July -> జూలై) via a static map.
- **Release Module:** Record monthly chit release (Amount, Mode, Date, Remarks, Recipient).
  - **Eligibility Check:** Shows a non-blocking warning banner with the exact pending amount if the selected member has dues. Requires explicit Admin confirmation to proceed.
- **Lifecycle:** Chit closure workflow to archive groups.

## 9. Out-of-Scope for V1
- Partial or fractional monthly payments (all payments must be for the exact full amount due).
- Automated WhatsApp messaging (via WhatsApp Business API).
- Member self-service portals or mobile apps.
- Multi-admin, staff, or collection agent accounts.
- Automated chit auction/bidding logic (releases are manually selected by the admin).
- Integrated payment gateways (UPI/Bank transfers are recorded manually; the app does not process actual money).
- Global cross-module search bar (search is strictly per-module).
- Hard deletion of any financial records.

## 10. Success Metrics
- **Speed:** Time-to-record-a-payment is under 15 seconds.
- **Adoption:** > 95% of monthly collections are recorded in the system within 24 hours of receipt.
- **Accuracy:** Zero data-entry errors on receipt numbers (guaranteed by DB sequence).
- **Efficiency:** Time spent on monthly reconciliation and sending reminders is reduced by 80% compared to the paper method.

## 11. Open Questions
*All initial ambiguities have been resolved by the client. Document is ready to proceed to Technical Requirements (TRD).*
