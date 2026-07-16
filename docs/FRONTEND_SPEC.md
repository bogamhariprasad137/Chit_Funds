# Frontend Specification & Design System: ChitLedger
*Prepared for Antigravity & Stitch MCP UI Generation*

## 1. Design Style Statement
ChitLedger employs a modern, professional, and minimal aesthetic tailored strictly for enterprise financial management. Engineered **mobile-first**, the design prioritizes extreme precision, high legibility of monetary data on small screens, and untarnished trust, actively avoiding playful trends, heavy animations, or overly saturated "startup" palettes.

## 2. Color Palette
*Note: Dark Mode is strictly OUT OF SCOPE for V1 to ensure maximum contrast and printability of ledgers/reports.*

- **Background (App):** `#F9FAFB` (Tailwind `gray-50`) - Soft off-white to reduce eye strain.
- **Background (Card/Surface):** `#FFFFFF` (White) - For stark contrast of data containers.
- **Primary:** `#0F172A` (Tailwind `slate-900`) - Deep, authoritative navy for primary actions and brand presence.
- **Secondary:** `#F1F5F9` (Tailwind `slate-100`) - For secondary buttons and subtle hover states.
- **Text (Primary):** `#0F172A` (Tailwind `slate-900`) - For high-contrast legibility.
- **Text (Muted):** `#64748B` (Tailwind `slate-500`) - For helper text and table headers.
- **Border/Divider:** `#E2E8F0` (Tailwind `slate-200`) - Crisp, subtle separators.
- **Success (Paid):** `#10B981` (Tailwind `emerald-500`) - Trustworthy, muted green.
- **Warning (Pending):** `#F59E0B` (Tailwind `amber-500`) - High-visibility amber.
- **Error (Overdue/Void/Destructive):** `#EF4444` (Tailwind `red-500`) - Standard alert red.

## 3. Typography Scale
**Base Font Family:** `Inter` (Google Fonts). Highly legible at small sizes and natively supports `tnum` (tabular numerals) for jitter-free vertical columns.
**Display Font (H1/Titles):** `Instrument Sans` (Google Fonts). A distinctive, premium sans-serif for page titles and hero numbers to add authoritative polish without bloating load times.

**Telugu Font Stack & Fallback Strategy:**
Neither Inter nor Instrument Sans support Telugu glyphs natively. To guarantee perfect Telugu rendering without relying on unpredictable system defaults, the explicit font fallback stack must be defined as `font-family: 'Inter', 'Noto Sans Telugu', sans-serif;` (and similarly for the display font: `font-family: 'Instrument Sans', 'Noto Sans Telugu', sans-serif;`). This guarantees Latin characters always use the primary fonts, while any Telugu text automatically triggers Noto Sans Telugu for flawless shaping. Ensure `Noto Sans Telugu` is bundled or imported via Google Fonts alongside Inter and Instrument Sans.

- **Monetary Figures:** Must explicitly apply Tailwind's `tabular-nums`, `tracking-tighter`, and `font-bold` for hero numbers (e.g., KPIs, Total Due) so they read as confident and authoritative. Standard money in tables uses `font-semibold`. Minimum mobile size: `13px`.
- **Critical Formatting Rule:** All monetary values across the entire application MUST render using the Indian numbering system (lakh/crore grouping, e.g., ₹5,00,000, not ₹500,000). The mandated utility for this is `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`. *This specific 'en-IN' locale must be hardcoded for currency, completely ignoring the active `react-i18next` UI language toggle (e.g. do NOT pass 'te-IN' to the number formatter).*
- **H1 (Page Titles/Hero):** 24px (Mobile) / 28px (Desktop), Display Font, `font-semibold`, tracking `-0.03em`.
- **H2 (Section Headers):** 18px, Base Font, `font-semibold`.
- **H3 (Card Titles):** 13px, Base Font, `font-medium`, `text-slate-500` (uppercase tracking).
- **Body Text:** Minimum `14px` on mobile for touch legibility, `font-normal`.
- **Button Text:** 14px, `font-medium`.

## 4. Component Styles (shadcn/ui Overrides)
- **Touch Targets (Mobile):** All interactive elements (buttons, row taps, dropdowns) MUST have a minimum hit area of `44x44px` to ensure thumb-friendly tapping (especially for "Record Payment", "Send Reminder", "Void Payment").
- **Buttons:** 
  - *Primary:* Solid `slate-900`, white text, slight hover opacity. No heavy shadows.
  - *Secondary:* Outline with `slate-200` border, `slate-900` text, `slate-50` hover.
  - *Destructive:* Solid `red-500`, white text. Used exclusively for "Void Payment" and "Close Group".
  - *Corner Radius:* `rounded-md` (6px).
- **Inputs:** Base `border-slate-200`. Currency inputs must feature a persistent `₹` left-adornment icon.
- **Language Toggle:** A compact pill-shaped segment control or switch (`h-8`, `rounded-full`) in the top-right header, defaulting to a subtle `slate-100` background with `slate-900` for the active language state.
- **Cards (Dashboard):** White background, `border-slate-200`, `rounded-xl`, subtle shadow (`shadow-sm`).
- **Modals:** White background, subtle glassmorphism overlay for the backdrop (`bg-slate-900/40 backdrop-blur-sm`). Mobile modals should pull up as Bottom Sheets (`rounded-t-xl`) rather than floating centered dialogs.

## 5. Spacing & Layout Rules (Mobile-First)
- **Base Unit:** 8px grid.
- **Page Layout:** Mobile layout spans full width (`px-4`). Desktop scales to a centered `max-w-7xl` container.
- **Navigation (Mobile):** Bottom Tab Bar featuring the highest-frequency destinations: **Dashboard**, **Pending**, **Payments**, **More** (Drawer for Settings, Groups, Members, Reports). This minimizes friction compared to a hamburger menu. Desktop reverts to a left-side vertical sidebar.

## 6. Dashboard Structure
Designed mobile-first to prioritize daily collection workflows:
- **Top Header:** "ChitLedger" Logo + User Avatar.
- **Row 1 (KPIs):** Displayed as a tight 2-column grid on mobile (e.g., Collections vs Pending side-by-side) to avoid vertical cramping. Hero numbers must use the Display Font.
- **Row 2 (Priority Actions):** A full-width `Record Payment` primary button spanning the screen below KPIs.
- **Row 3 (Pending Payments):** Stacked vertically *above* recent activity. This is the core daily task. Displays top 3-5 overdue members with an immediate "Send Reminder" button.
- **Row 4 (Recent Activity):** Stacked below pending payments.

## 7. Data Tables (Mobile vs Desktop)
- **Desktop:** Standard flat design data tables. Cell padding `px-4 py-2` (compact). Sticky headers for long scrolling ledgers.
- **Mobile Financial Ledgers (Redesigned):** Horizontal scrolling is removed for financial tables on mobile as it feels cramped. Instead, ledgers render as a **compact vertical list-row format**:
  - *Primary Row:* Prominent Amount (left aligned) and Status Badge (right aligned).
  - *Secondary Row (Muted text):* Member Name, Date, Receipt Number.
  - *Interaction:* Tapping the row expands it via an accordion/sheet to show full details (Mode, Remarks, Void button).
- **Mobile Member/Group Lists:** Standard block-level Card-View fallback.

## 8. Status Badge System
Pill-shaped, rounded-full, subtle colors. Must be distinct on small screens.
- **Paid:** `bg-emerald-100 text-emerald-700`
- **Pending:** `bg-amber-100 text-amber-700` — *Rule: Applied when the current date is on or before `(due_date + grace_period_days)`.*
- **Overdue:** `bg-red-100 text-red-700` — *Rule: Applied strictly when `(due_date + grace_period_days)` has passed and no payment is recorded. This threshold visually aligns 1:1 with the TRD's penalty calculation logic.*
- **Voided:** `bg-zinc-100 text-zinc-600 border border-zinc-200` (Strikethrough text applied to the adjacent monetary amount)
- **Active (Group):** `bg-blue-100 text-blue-700`
- **Archived (Group):** `bg-slate-100 text-slate-600`

## 9. Accessibility Notes
- **Contrast:** WCAG AA minimum contrast (4.5:1).
- **Keyboard Navigation:** Modals fully navigable via `Tab`. `Confirm` triggers on `Enter`.
- **Focus Rings:** Visible `focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2`.

## 10. UX Principles
- **Financial Mutability (Wait-for-Server):** Absolutely zero optimistic UI updates for anything involving money. The UI must explicitly show a disabled loading spinner state on the button and wait for the Supabase RPC validation to return success before updating the ledger.
- **Async Loading:** Modals generating PDFs/reports must display a distinct "Generating Document..." spinner.
- **Destructive Confirmations:** Void Payment / Close Group require text-input confirmation, never just a simple click.

## 11. Visual Reference Points
- **Stripe Dashboard:** Tabular numerals, muted typography, premium mobile sheet modals.
- **Linear:** Dense layout logic, compact spacing, reliance on subtle background colors.
- **Mercury (Banking):** Ultra-premium aesthetic, stark black-and-white design, strict color usage for status indicators.
