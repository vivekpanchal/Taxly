// FY 2025-26 (AY 2026-27) — slabs confirmed unchanged in Budget 2026

export interface SalaryInput {
  gross: number;       // total gross (basic+hra+lta+special+bonus)
  basic: number;
  hra: number;
  pf: number;          // employer + employee PF (counts in 80C)
  professional: number; // professional tax (default 2400)
  standardDed: number;  // 75000 for salaried, both regimes
}

export interface UserInput {
  salary: SalaryInput;
  rentPaid: number;
  metro: boolean;
  sec80C: number;      // ELSS/LIC/PPF (excl. PF — added separately)
  sec80D: number;      // health insurance premium
  sec80CCD1B: number;  // NPS extra (over 80C)
  homeLoanInterest: number; // 24(b) self-occupied
  otherIncome: number; // interest, capital gains etc.
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

export interface SlabDef {
  upto: number;
  rate: number;
  label: string;
}

export interface SlabSlice extends SlabDef {
  amount: number;
  tax: number;
}

// FY 2025-26 New Regime (Budget 2025, unchanged in Budget 2026)
export const SLABS_NEW: SlabDef[] = [
  { upto: 400000,   rate: 0,    label: '0 – 4L' },
  { upto: 800000,   rate: 0.05, label: '4L – 8L' },
  { upto: 1200000,  rate: 0.10, label: '8L – 12L' },
  { upto: 1600000,  rate: 0.15, label: '12L – 16L' },
  { upto: 2000000,  rate: 0.20, label: '16L – 20L' },
  { upto: 2400000,  rate: 0.25, label: '20L – 24L' },
  { upto: Infinity, rate: 0.30, label: '24L+' },
];

// FY 2025-26 Old Regime
export const SLABS_OLD: SlabDef[] = [
  { upto: 250000,   rate: 0,    label: '0 – 2.5L' },
  { upto: 500000,   rate: 0.05, label: '2.5L – 5L' },
  { upto: 1000000,  rate: 0.20, label: '5L – 10L' },
  { upto: Infinity, rate: 0.30, label: '10L+' },
];

function applySlabs(taxable: number, slabs: SlabDef[]): number {
  let tax = 0, prev = 0, rem = taxable;
  for (const slab of slabs) {
    const take = Math.max(0, Math.min(rem, slab.upto - prev));
    tax += take * slab.rate;
    rem -= take;
    prev = slab.upto;
    if (rem <= 0) break;
  }
  return tax;
}

export function calcOldRegime(u: UserInput): RegimeResult {
  const gross = u.salary.gross + u.otherIncome;

  // HRA exemption: least of (HRA received, metro%*basic, rent-10%basic)
  const hraPercent = u.metro ? 0.5 : 0.4;
  const hraExempt = u.rentPaid > 0
    ? Math.max(0, Math.min(
        u.salary.hra,
        u.salary.basic * hraPercent,
        Math.max(0, u.rentPaid - u.salary.basic * 0.1),
      ))
    : 0;

  const ded80C = Math.min(150000, u.sec80C + u.salary.pf);
  const ded80D = Math.min(25000, u.sec80D);
  const ded80CCD = Math.min(50000, u.sec80CCD1B);
  const ded24b = Math.min(200000, u.homeLoanInterest);

  const taxable = Math.max(0,
    gross
    - hraExempt
    - u.salary.standardDed
    - u.salary.professional
    - ded80C
    - ded80D
    - ded80CCD
    - ded24b,
  );

  let baseTax = applySlabs(taxable, SLABS_OLD);
  // 87A rebate: max ₹12,500 if taxable ≤ ₹5L
  const rebate = taxable <= 500000 ? Math.min(baseTax, 12500) : 0;
  baseTax = Math.max(0, baseTax - rebate);
  const cess = baseTax * 0.04;

  return {
    gross,
    taxable,
    tax: baseTax + cess,
    baseTax,
    cess,
    rebate,
    hraExempt,
    deductionsUsed: {
      standardDed: u.salary.standardDed,
      hraExempt,
      sec80C: ded80C,
      sec80D: ded80D,
      sec80CCD1B: ded80CCD,
      homeLoanInterest: ded24b,
      professional: u.salary.professional,
    },
  };
}

export function calcNewRegime(u: UserInput): RegimeResult {
  const gross = u.salary.gross + u.otherIncome;
  // New regime: only standard deduction allowed
  const taxable = Math.max(0, gross - u.salary.standardDed);

  let baseTax = applySlabs(taxable, SLABS_NEW);
  // 87A rebate: max ₹60,000 if taxable ≤ ₹12L (Budget 2025)
  const rebate = taxable <= 1200000 ? Math.min(baseTax, 60000) : 0;
  baseTax = Math.max(0, baseTax - rebate);
  const cess = baseTax * 0.04;

  return {
    gross,
    taxable,
    tax: baseTax + cess,
    baseTax,
    cess,
    rebate,
    hraExempt: 0,
    deductionsUsed: {
      standardDed: u.salary.standardDed,
      hraExempt: 0,
      sec80C: 0,
      sec80D: 0,
      sec80CCD1B: 0,
      homeLoanInterest: 0,
      professional: 0,
    },
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

// Deduction gap analysis — what's unclaimed and what it saves
export interface DeductionGap {
  code: string;
  name: string;
  description: string;
  maxLimit: number;
  used: number;
  gap: number;
  taxSaved: number; // at 30% bracket + 4% cess
}

export function calcDeductionGaps(u: UserInput, oldResult: RegimeResult): DeductionGap[] {
  const bracket = 0.30 * 1.04; // 30% slab + cess
  const ded80CUsed = Math.min(150000, u.sec80C + u.salary.pf);

  return [
    {
      code: '80C',
      name: 'Tax-saving investments',
      description: 'ELSS, PPF, LIC, NSC, 5yr FD, tuition fees',
      maxLimit: 150000,
      used: ded80CUsed,
      gap: Math.max(0, 150000 - ded80CUsed),
      taxSaved: Math.max(0, 150000 - ded80CUsed) * bracket,
    },
    {
      code: '80CCD(1B)',
      name: 'NPS — extra ₹50K',
      description: 'National Pension System contribution (over 80C)',
      maxLimit: 50000,
      used: Math.min(50000, u.sec80CCD1B),
      gap: Math.max(0, 50000 - u.sec80CCD1B),
      taxSaved: Math.max(0, 50000 - u.sec80CCD1B) * bracket,
    },
    {
      code: '80D',
      name: 'Health insurance',
      description: 'Mediclaim for self + family (up to ₹25K; ₹50K if parents senior)',
      maxLimit: 25000,
      used: Math.min(25000, u.sec80D),
      gap: Math.max(0, 25000 - u.sec80D),
      taxSaved: Math.max(0, 25000 - u.sec80D) * bracket,
    },
    {
      code: 'HRA',
      name: 'House Rent Allowance',
      description: 'Claim rent receipts; ensure rent > 10% of basic',
      maxLimit: u.salary.hra,
      used: oldResult.hraExempt,
      gap: Math.max(0, u.salary.hra - oldResult.hraExempt),
      taxSaved: Math.max(0, u.salary.hra - oldResult.hraExempt) * bracket,
    },
    {
      code: '24(b)',
      name: 'Home loan interest',
      description: 'Interest on self-occupied property (max ₹2L/yr)',
      maxLimit: 200000,
      used: Math.min(200000, u.homeLoanInterest),
      gap: Math.max(0, 200000 - u.homeLoanInterest),
      taxSaved: Math.max(0, 200000 - u.homeLoanInterest) * bracket,
    },
  ].filter(d => d.maxLimit > 0);
}
