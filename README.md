# Taxly

Tax, finally on your side. Old vs New regime comparison, deduction gap calculator, and plain-English savings advice — no signup required.

## Structure

```
Taxly/
├── app/         — Next.js App Router pages
├── components/  — React components (screens + shared UI)
├── hooks/       — Custom React hooks
├── lib/         — Tax engine, theme tokens, formatters
├── backend/     — Express API (TypeScript, reusable)
└── README.md
```

The `backend/` is intentionally isolated — swap in any frontend (React Native, another web app, etc.) without touching the API.

## Getting started

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev        # runs on http://localhost:4000
```

### Frontend (root)

```bash
npm install
npm run dev        # runs on http://localhost:3000
```

## Frontend

Built with Next.js 14 App Router. Single-page mobile-first app rendered in an iOS device frame.

**Screens:**
- `splash` — landing, guest/sign-in paths
- `upload` — Form 16 PDF upload with AI parsing animation
- `manual` — manual income/deduction entry (no Form 16 needed)
- `verdict` — Old vs New regime comparison (FY 25-26), slab visualizer, income slider, Learn mode
- `gap` — deduction gap calculator (unused 80C, 80D, HRA, NPS, etc.)
- `home` — savings dashboard

Navigation pill at the top lets you jump between screens. Dark mode toggle bottom-right.

**Key files:**
- `lib/taxCalc.ts` — FY 25-26 tax engine (old + new regime, slabs, deductions)
- `lib/theme.ts` — design tokens (light/dark)
- `lib/formatters.ts` — Indian number formatting (₹12,34,567)
- `components/TaxlyApp.tsx` — top-level app with screen routing state
- `components/screens/` — one file per screen
- `components/ui/` — shared primitives (buttons, icons, logo, sign-in sheet)

## Backend

Express + TypeScript API.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/calculate` | Full tax calculation (old + new regime) |
| `POST` | `/api/calculate/at-income` | Quick recalc at a given gross income (income slider) |
| `POST` | `/api/auth/send-otp` | Send OTP to mobile number |
| `POST` | `/api/auth/verify-otp` | Verify OTP, return token |
| `POST` | `/api/form16/parse` | Parse Form 16 PDF (mock — returns fixture data) |

**`POST /api/calculate` body:**
```json
{
  "salary": { "basic": 720000, "hra": 360000, "lta": 60000, "special": 540000, "bonus": 120000, "pf": 86400, "professional": 2400, "standardDed": 75000 },
  "rentPaid": 264000,
  "metro": true,
  "declared80C": 92000,
  "declared80D": 18000,
  "nps80CCD1B": 0,
  "homeLoanInterest": 0
}
```

## Tax math (FY 2025-26)

**New regime slabs (Budget 2025):**

| Slab | Rate |
|------|------|
| 0 – ₹4L | 0% |
| ₹4L – ₹8L | 5% |
| ₹8L – ₹12L | 10% |
| ₹12L – ₹16L | 15% |
| ₹16L – ₹20L | 20% |
| ₹20L – ₹24L | 25% |
| ₹24L+ | 30% |

87A rebate: nil tax if taxable income ≤ ₹12L. Standard deduction ₹75K available.

**Old regime slabs:**

| Slab | Rate |
|------|------|
| 0 – ₹2.5L | 0% |
| ₹2.5L – ₹5L | 5% |
| ₹5L – ₹10L | 20% |
| ₹10L+ | 30% |

87A rebate: nil tax if taxable ≤ ₹5L. Deductions: HRA, 80C (max ₹1.5L), 80D (max ₹25K), 80CCD(1B) (max ₹50K), 24b home loan (max ₹2L).

All tax + 4% health & education cess.
