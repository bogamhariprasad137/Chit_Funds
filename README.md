# ChitLedger: Financial Chit Fund Management System

ChitLedger is a premium, full-stack Single Page Application (SPA) designed to manage Chit Fund operations, ledger contributions, late fee penalties, prize releases, and financial reporting with real-time audit logs.

---

## 🚀 Key Features

*   **Admin Dashboard**: Overview of active groups, enrolled members, monthly collections, outstanding dues, and live operations counters.
*   **Member Profiles & Ledger History**: Track enrolled member contributions, ledger history, print receipts, and issue WhatsApp alert reminders.
*   **Chit Schemes & Groups**: Dynamic setup of chit pools, Bid History, and prize releases.
*   **Payments & Audit Logs**: Record payments using a linear compounding penalty calculation, void transactions safely, and audit deleted records.
*   **Financial Reports**: Exporters for Daily Collections, Monthly Detailed Ledgers, and Outstanding Defaulters lists.
*   **Professional PDF Printing**: Custom true-type Roboto font embedding to resolve Indian Rupee (`₹`) spacing issues. Styled in print-ready corporate white layouts.
*   **Multi-language Support**: Dynamic English and Telugu localization support.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), React Router, TailwindCSS, Lucide Icons, react-i18next (i18n).
*   **Backend**: Supabase Database (PostgreSQL), Supabase Auth.
*   **Database Objects**: PL/pgSQL stored procedures, triggers, custom types, timezone-aware (IST) KPI views.
*   **PDF Exporters**: jsPDF, jspdf-autotable.
*   **Deployment**: Vercel (SPA Deep Link rewrites configured in `vercel.json`).

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

*Note: These variables are loaded securely at build time via `import.meta.env` and must be declared in Vercel during deployment.*

---

## ⚡ Setup & Installation

### 1. Database Setup
Paste the consolidated SQL schema located in [integration_report.md](file:///C:/Users/bogam/OneDrive/Apps/Chit_Funds/integration_report.md) or `supabase/migrations` directly into the Supabase SQL Editor and execute it to create all tables, stored procedures, views, and RLS policies.

### 2. Local Setup
Clone the repository and run:

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run type checker
npx tsc --noEmit

# Run project linter
npm run lint

# Compile production bundle
npm run build
```

---

## 📦 Deployment Instructions (Vercel)

1.  Push the project branch to GitHub.
2.  Import the repository into Vercel.
3.  Choose **Vite** as the Framework Preset.
4.  Configure the build command as `npm run build` and output directory as `dist`.
5.  Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6.  Click **Deploy**. (SPA deep routes are automatically handled by `vercel.json` rewrites).

---

## 📂 Folder Structure

```
├── .stitch             # Design systems and UI specs
├── docs                # System specifications and PRD documentation
├── public              # Static assets and media files
├── src
│   ├── components      # Shared modals, badges, layout components
│   ├── contexts        # Auth session context provider
│   ├── layouts         # Admin layout and protected route structures
│   ├── lib             # Supabase client, PDF fonts, receipt utilities
│   ├── pages           # Pages (Dashboard, Settings, Reports, etc.)
│   └── types           # TypeScript definitions (supabase.ts schema types)
├── supabase            # Database migrations and seed files
├── vercel.json         # SPA deep links rewrites config
├── package.json
└── README.md
```
