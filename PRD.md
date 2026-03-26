# PRD: GW Dienstleistung ROI Dashboard

## Overview

A web-based ROI tracking tool for a trades/construction client (Gruppenwerk) that replaces an Excel-based workflow. The client logs Google Ads-driven jobs monthly in a spreadsheet-like grid, and the app auto-calculates revenue, margins, ROI, break-even — with an optional flywheel dashboard showing how profits can be reinvested into marketing channels.

**Stack:** Next.js (Vercel), Supabase (Postgres + Auth), TailwindCSS

---

## Users & Access

- **Single client** (Gruppenwerk) — one dashboard, not multi-tenant
- **Auth:** Shared link + passcode (no email/password login)
  - Simple passcode gate stored in Supabase or env var
  - Anyone with the link + passcode can view and edit
- Future clients get separate dashboard instances

---

## Core Data Model

### Jobs Table (`jobs`)

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| jahr | int | Year (e.g. 2026) |
| monat | text | Month name in German (e.g. "März") |
| kundenname | text | Client/customer name |
| objektadresse | text | Job site address |
| taetigkeit | text | Type of work performed |
| herkunft | text | Lead source (Google Ads, Kontaktformular, etc.) |
| netto_umsatz | numeric | Net revenue (nullable — "???" in xlsx) |
| rohertrag | numeric | Gross profit (nullable) |
| angebot | text | Quote/offer reference or status |
| datum | date | Job date |
| created_at | timestamptz | Auto |

### Config Table (`config`)

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| homepage_kosten | numeric | One-time: homepage creation (default €10,000) |
| ads_setup_kosten | numeric | One-time: Google Ads setup (default €2,000) |
| pflegekosten_monat | numeric | Monthly Ads management fee (default €50) |
| operative_marge_pct | numeric | Operating margin % (default 0.20) |
| avg_auftraege_monat | numeric | Avg orders/month assumption (default 5) |
| created_at | timestamptz | Auto |

---

## Pages & Features

### 1. Passcode Gate (`/`)

- Clean centered input: "Zugangs-Code eingeben"
- On valid passcode → redirect to `/dashboard`
- Passcode stored as env var, validated client-side or via API route

### 2. Dashboard — Job Grid (`/dashboard`)

The primary view. A **spreadsheet-like editable grid** mirroring the xlsx "Tabelle1" sheet.

**Columns:**
- Jahr, Monat, Kundenname, Objektadresse, Tätigkeit, Herkunft, Netto-Umsatz, Rohertrag, Angebot

**Behavior:**
- Inline editing — click a cell to edit, auto-saves to Supabase
- Add new row via button at bottom
- Empty/missing Netto-Umsatz or Rohertrag shown as "???" with a subtle warning highlight (amber)
- Rows grouped by month, with month subtotals (Umsatz, Rohertrag)
- Sort by date (newest first by default)
- Simple filter by Herkunft (lead source) dropdown

**Summary bar at top:**
- Total Netto-Umsatz (current month / all-time)
- Total Rohertrag (current month / all-time)
- Number of jobs
- Number of incomplete entries (missing values)

### 3. ROI Rechnung (`/dashboard/roi`)

Auto-calculated ROI view that updates live from job data. Mirrors the xlsx "ROI-Rechnung" sheet.

**Sections:**

**A. Einmalige Investitionen (one-time investments)**
- Homepage: editable (default €10,000)
- Google Ads Setup: editable (default €2,000)
- Summe: auto-calculated

**B. Laufende Kosten (monthly costs)**
- Pflegekosten/Monat: editable (default €50)
- Operative Marge %: editable (default 20%)
- Google Ads Ausgaben/Monat: calculated from actual job data

**C. Monthly ROI Table**
- Auto-generated from job data, one row per month
- Columns: Monat, Google Ads Ausgaben, Pflegekosten, Kosten Gesamt, Netto-Umsatz, Rohertrag, Operative Marge, Gesamtergebnis
- Cumulative columns: Kum. Gesamtkosten, Kum. Operative Marge, Kum. Ergebnis, ROI (%), ROI p.a. (%)
- Months with no data show €0 revenue but still accrue costs

**D. Break-Even Analyse**
- Avg Netto-Umsatz/Auftrag: calculated from data
- Operativer Ertrag/Auftrag: calculated
- Laufende Kosten/Monat: calculated
- Uberdeckung/Monat: calculated
- Monate bis Break-Even: calculated
- Break-Even voraussichtlich: projected month/year
- Visual indicator: progress bar or timeline showing how close to break-even

### 4. Flywheel Dashboard (`/dashboard/flywheel`)

The existing flywheel dashboard rebuilt as a page within the app.

**Connection to ROI data:**
- The "monthly profit" input is pre-filled from the operative Marge calculated in the ROI view
- Client can still override/adjust the slider manually
- All existing flywheel functionality preserved (channel allocation, tiers, export)

**This page is optional** — accessible via nav tab, not the primary workflow.

---

## Design

- **Font:** Inter (clean, simple) — replacing DM Sans / Instrument Serif from the flywheel
- **Color palette:** Match flywheel earth tones — `#FAFAF8` bg, `#1A1916` text, `#2D6A4F` accent green, `#C1440E` accent red
- **Components:** Clean cards, subtle borders (`#E2DFD9`), rounded corners (12px)
- **Grid:** Minimal spreadsheet aesthetic — thin borders, compact rows, monospace for numbers
- **Responsive:** Desktop-first (this is a work tool), but usable on tablet
- **Incomplete data:** Amber/yellow highlight for "???" cells

---

## Navigation

Top nav bar with tabs:
1. **Aufträge** (Jobs) — the grid → `/dashboard`
2. **ROI-Rechnung** — ROI calculations → `/dashboard/roi`
3. **Flywheel** — profit reinvestment → `/dashboard/flywheel`

---

## Technical Architecture

```
/
├── app/
│   ├── page.tsx                  # Passcode gate
│   ├── dashboard/
│   │   ├── layout.tsx            # Nav + auth check
│   │   ├── page.tsx              # Job grid
│   │   ├── roi/page.tsx          # ROI calculation
│   │   └── flywheel/page.tsx     # Flywheel dashboard
│   └── api/
│       └── auth/route.ts         # Passcode validation
├── components/
│   ├── JobGrid.tsx               # Editable spreadsheet grid
│   ├── ROICalculation.tsx        # ROI dashboard
│   ├── FlywheelDashboard.tsx     # Ported flywheel
│   ├── SummaryBar.tsx            # Top-level metrics
│   └── PasscodeGate.tsx          # Auth screen
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── calculations.ts           # ROI, break-even, margin math
│   └── types.ts                  # TypeScript types
└── public/
```

**Key dependencies:**
- `next` — framework
- `@supabase/supabase-js` — database + realtime
- `tailwindcss` — styling
- `html2canvas` — flywheel PNG export (existing feature)

---

## Supabase Setup

- **Database:** Postgres with `jobs` and `config` tables
- **RLS (Row Level Security):** Off for now (single client, passcode auth)
- **Realtime:** Not needed initially (single user editing)

---

## Out of Scope (for now)

- Multi-tenant / multi-client
- Email/password auth
- Notifications / reminders
- xlsx import/export
- Mobile optimization
- Realtime collaboration
- Historical snapshots / versioning

---

## MVP Milestones

1. **Project setup** — Next.js + Supabase + Tailwind + deploy to Vercel
2. **Passcode gate** — simple auth flow
3. **Database schema** — jobs + config tables in Supabase
4. **Job grid** — editable spreadsheet with auto-save
5. **ROI Rechnung** — auto-calculated from job data
6. **Flywheel integration** — ported dashboard with profit link
7. **Polish** — design system, summary bar, incomplete data warnings
