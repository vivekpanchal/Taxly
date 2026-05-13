// FY 2025-26 (AY 2026-27) — slabs unchanged in Budget 2026

export type AgeGroup = 'below60' | '60to80' | 'above80';

export interface SalaryInput {
  gross: number;
  basic: number;
  hra: number;
  pf: number;
  professional: number; // default 2400
  standardDed: number;  // 75000 for salaried
}

export interface UserInput {
  salary: SalaryInput;
  age: AgeGroup;
  rentPaid: number;
  metro: boolean;
  sec80C: number;
  sec80D: number;       // self+family; senior parent coverage handled separately for now
  sec80CCD1B: number;   // NPS extra (over 80C cap)
  homeLoanInterest: number;
  otherIncome: number;
}

export interface RegimeResult {
  gross: number;
  taxable: number;
  tax: number;
  baseTax: number;
  cess: number;
  rebate: number;
  hraExempt: number;
  deductionsUsed: DeductionBreakdown;
}

export interface DeductionBreakdown {
  standardDed: number;
  hraExempt: number;
  sec80C: number;
  sec80D: number;
  sec80CCD1B: number;
  homeLoanInterest: number;
  professional: number;
}

export interface SlabDef { upto: number; rate: number; label: string; }
export interface SlabSlice extends SlabDef { amount: number; tax: number; }

// ── Slabs ─────────────────────────────────────────────────────────────────────

// New regime: same for all age groups
export const SLABS_NEW: SlabDef[] = [
  { upto: 400000,   rate: 0,    label: '0 – 4L' },
  { upto: 800000,   rate: 0.05, label: '4L – 8L' },
  { upto: 1200000,  rate: 0.10, label: '8L – 12L' },
  { upto: 1600000,  rate: 0.15, label: '12L – 16L' },
  { upto: 2000000,  rate: 0.20, label: '16L – 20L' },
  { upto: 2400000,  rate: 0.25, label: '20L – 24L' },
  { upto: Infinity, rate: 0.30, label: '24L+' },
];

// Old regime slabs vary by age
export const SLABS_OLD_BELOW60: SlabDef[] = [
  { upto: 250000,   rate: 0,    label: '0 – 2.5L' },
  { upto: 500000,   rate: 0.05, label: '2.5L – 5L' },
  { upto: 1000000,  rate: 0.20, label: '5L – 10L' },
  { upto: Infinity, rate: 0.30, label: '10L+' },
];

export const SLABS_OLD_SENIOR: SlabDef[] = [   // 60–80
  { upto: 300000,   rate: 0,    label: '0 – 3L' },
  { upto: 500000,   rate: 0.05, label: '3L – 5L' },
  { upto: 1000000,  rate: 0.20, label: '5L – 10L' },
  { upto: Infinity, rate: 0.30, label: '10L+' },
];

export const SLABS_OLD_SUPER: SlabDef[] = [    // 80+
  { upto: 500000,   rate: 0,    label: '0 – 5L' },
  { upto: 1000000,  rate: 0.20, label: '5L – 10L' },
  { upto: Infinity, rate: 0.30, label: '10L+' },
];

export function getOldSlabs(age: AgeGroup): SlabDef[] {
  if (age === 'above80') return SLABS_OLD_SUPER;
  if (age === '60to80')  return SLABS_OLD_SENIOR;
  return SLABS_OLD_BELOW60;
}

// ── Engine ────────────────────────────────────────────────────────────────────

function applySlabs(taxable: number, slabs: SlabDef[]): number {
  let tax = 0, prev = 0, rem = taxable;
  for (const s of slabs) {
    const take = Math.max(0, Math.min(rem, s.upto - prev));
    tax += take * s.rate;
    rem -= take;
    prev = s.upto;
    if (rem <= 0) break;
  }
  return tax;
}

export function calcOldRegime(u: UserInput): RegimeResult {
  const gross = u.salary.gross + u.otherIncome;

  const hraPercent = u.metro ? 0.5 : 0.4;
  const hraExempt = u.rentPaid > 0
    ? Math.max(0, Math.min(
        u.salary.hra,
        u.salary.basic * hraPercent,
        Math.max(0, u.rentPaid - u.salary.basic * 0.1),
      ))
    : 0;

  const ded80C  = Math.min(150000, u.sec80C + u.salary.pf);
  const ded80D  = Math.min(25000, u.sec80D);
  const ded80CCD = Math.min(50000, u.sec80CCD1B);
  const ded24b  = Math.min(200000, u.homeLoanInterest);

  const taxable = Math.max(0,
    gross - hraExempt - u.salary.standardDed - u.salary.professional
    - ded80C - ded80D - ded80CCD - ded24b,
  );

  const slabs = getOldSlabs(u.age);
  let baseTax = applySlabs(taxable, slabs);

  // 87A rebate: max ₹12,500 if taxable ≤ ₹5L (super-senior: no rebate)
  const rebate = u.age !== 'above80' && taxable <= 500000
    ? Math.min(baseTax, 12500) : 0;
  baseTax = Math.max(0, baseTax - rebate);
  const cess = baseTax * 0.04;

  return {
    gross, taxable, tax: baseTax + cess, baseTax, cess, rebate, hraExempt,
    deductionsUsed: { standardDed: u.salary.standardDed, hraExempt, sec80C: ded80C, sec80D: ded80D, sec80CCD1B: ded80CCD, homeLoanInterest: ded24b, professional: u.salary.professional },
  };
}

export function calcNewRegime(u: UserInput): RegimeResult {
  const gross = u.salary.gross + u.otherIncome;
  const taxable = Math.max(0, gross - u.salary.standardDed);

  let baseTax = applySlabs(taxable, SLABS_NEW);
  // 87A rebate: nil tax ≤ ₹12L taxable (Budget 2025); new regime same for all ages
  const rebate = taxable <= 1200000 ? Math.min(baseTax, 60000) : 0;
  baseTax = Math.max(0, baseTax - rebate);
  const cess = baseTax * 0.04;

  return {
    gross, taxable, tax: baseTax + cess, baseTax, cess, rebate, hraExempt: 0,
    deductionsUsed: { standardDed: u.salary.standardDed, hraExempt: 0, sec80C: 0, sec80D: 0, sec80CCD1B: 0, homeLoanInterest: 0, professional: 0 },
  };
}

export function sliceBySlabs(taxable: number, slabs: SlabDef[]): SlabSlice[] {
  const out: SlabSlice[] = [];
  let prev = 0, rem = taxable;
  for (const s of slabs) {
    const take = Math.max(0, Math.min(rem, s.upto - prev));
    if (take > 0 || out.length === 0) out.push({ ...s, amount: take, tax: take * s.rate });
    rem -= take;
    prev = s.upto;
    if (rem <= 0) break;
  }
  return out;
}

// ── Deduction gap ─────────────────────────────────────────────────────────────

export interface DeductionGap {
  code: string;
  name: string;
  description: string;
  maxLimit: number;
  used: number;
  gap: number;
  taxSaved: number;
}

export function calcDeductionGaps(u: UserInput, oldResult: RegimeResult): DeductionGap[] {
  const bracket = 0.30 * 1.04;
  const ded80CUsed = Math.min(150000, u.sec80C + u.salary.pf);

  return [
    {
      code: '80C',       name: 'Tax-saving investments',
      description: 'ELSS, PPF, LIC, NSC, 5-yr FD, tuition fees',
      maxLimit: 150000,  used: ded80CUsed,
      gap: Math.max(0, 150000 - ded80CUsed),
      taxSaved: Math.max(0, 150000 - ded80CUsed) * bracket,
    },
    {
      code: '80CCD(1B)', name: 'NPS extra ₹50K',
      description: 'National Pension System — extra over 80C limit',
      maxLimit: 50000,   used: Math.min(50000, u.sec80CCD1B),
      gap: Math.max(0, 50000 - u.sec80CCD1B),
      taxSaved: Math.max(0, 50000 - u.sec80CCD1B) * bracket,
    },
    {
      code: '80D',       name: 'Health insurance',
      description: 'Mediclaim premium — self + spouse + children',
      maxLimit: 25000,   used: Math.min(25000, u.sec80D),
      gap: Math.max(0, 25000 - u.sec80D),
      taxSaved: Math.max(0, 25000 - u.sec80D) * bracket,
    },
    ...(u.salary.hra > 0 ? [{
      code: 'HRA',       name: 'House Rent Allowance',
      description: 'Claim rent receipts from landlord',
      maxLimit: u.salary.hra, used: oldResult.hraExempt,
      gap: Math.max(0, u.salary.hra - oldResult.hraExempt),
      taxSaved: Math.max(0, u.salary.hra - oldResult.hraExempt) * bracket,
    }] : []),
    {
      code: '24(b)',     name: 'Home loan interest',
      description: 'Self-occupied property interest — max ₹2L/yr',
      maxLimit: 200000,  used: Math.min(200000, u.homeLoanInterest),
      gap: Math.max(0, 200000 - u.homeLoanInterest),
      taxSaved: Math.max(0, 200000 - u.homeLoanInterest) * bracket,
    },
  ].filter(d => d.maxLimit > 0 && d.gap > 0);
}
