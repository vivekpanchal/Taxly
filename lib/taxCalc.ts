/**
 * Taxly Tax Engine — FY 2025-26 (AY 2026-27)
 *
 * References:
 *  - Income Tax Act 2025 (effective Apr 1 2026; section numbers for FY 2026-27 onwards)
 *  - FY 2025-26 slabs confirmed unchanged in Budget 2026
 *  - HRA metro expanded to 8 cities (IT Act 2025)
 *  - Surcharge: old regime 10/15/25/37%, new regime capped at 25%
 *  - Marginal relief on 87A: prevents cliff at ₹12L / ₹5L boundary
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AgeGroup = 'below60' | '60to80' | 'above80';

/**
 * Cities where HRA exemption = 50% of basic salary.
 * IT Act 2025 added Bengaluru, Hyderabad, Pune, Ahmedabad to original 4.
 * All other cities = 40%.
 */
export const HRA_METRO_CITIES = [
  'Delhi', 'Mumbai', 'Chennai', 'Kolkata',       // original metros
  'Bengaluru', 'Hyderabad', 'Pune', 'Ahmedabad', // added in IT Act 2025
] as const;
export type MetroCity = typeof HRA_METRO_CITIES[number] | 'Other';

export function hraExemptionPct(city: MetroCity): 0.5 | 0.4 {
  return HRA_METRO_CITIES.includes(city as typeof HRA_METRO_CITIES[number]) ? 0.5 : 0.4;
}

export interface SalaryInput {
  gross: number;
  basic: number;
  hra: number;
  pf: number;          // employee + employer PF (counts toward 80C)
  professional: number; // default ₹2,400/yr
  standardDed: number;  // ₹75,000 salaried (both regimes, FY 2025-26)
}

export interface UserInput {
  salary: SalaryInput;
  age: AgeGroup;
  city: MetroCity;
  rentPaid: number;
  // Old regime deductions
  sec80C: number;          // max ₹1.5L (excl. PF — added automatically)
  sec80D: number;          // max ₹25K (below 60) / ₹50K (60+) — self+family
  sec80D_parents: number;  // additional for parents, max ₹25K (₹50K if parents senior)
  sec80CCD1B: number;      // NPS extra, max ₹50K (Section 124 in new Act)
  homeLoanInterest: number; // 24(b) / Section 72 new Act, max ₹2L self-occupied
  sec80TTA: number;        // savings bank interest, max ₹10K (below 60 only)
  sec80TTB: number;        // savings bank + FD interest, max ₹50K (60+ only, replaces 80TTA)
  sec80E: number;          // education loan interest, no cap
  sec80G: number;          // donations, capped at 50% or 100% (simplified: take as entered)
  otherIncome: number;
}

export interface SurchargeDetail {
  rate: number;       // e.g. 0.10 for 10%
  amount: number;     // surcharge amount in ₹
  marginalRelief: number; // relief applied (0 if none)
}

export interface RegimeResult {
  gross: number;
  taxable: number;
  baseTax: number;         // before rebate and surcharge
  rebate: number;          // 87A rebate applied
  taxAfterRebate: number;  // baseTax - rebate
  surcharge: SurchargeDetail;
  cess: number;            // 4% on (taxAfterRebate + surcharge.amount - surcharge.marginalRelief)
  tax: number;             // final: taxAfterRebate + surcharge.amount - surcharge.marginalRelief + cess
  hraExempt: number;
  deductionsUsed: DeductionBreakdown;
  marginalRelief87A: number; // marginal relief applied to 87A cliff
}

export interface DeductionBreakdown {
  standardDed: number;
  hraExempt: number;
  sec80C: number;
  sec80D: number;
  sec80CCD1B: number;
  homeLoanInterest: number;
  sec80TTA_TTB: number;
  sec80E: number;
  sec80G: number;
  professional: number;
}

export interface SlabDef  { upto: number; rate: number; label: string; }
export interface SlabSlice extends SlabDef { amount: number; tax: number; }

// ─────────────────────────────────────────────────────────────────────────────
// Tax Slabs — FY 2025-26
// ─────────────────────────────────────────────────────────────────────────────

export const SLABS_NEW: SlabDef[] = [
  { upto: 400000,   rate: 0,    label: '0 – 4L' },
  { upto: 800000,   rate: 0.05, label: '4L – 8L' },
  { upto: 1200000,  rate: 0.10, label: '8L – 12L' },
  { upto: 1600000,  rate: 0.15, label: '12L – 16L' },
  { upto: 2000000,  rate: 0.20, label: '16L – 20L' },
  { upto: 2400000,  rate: 0.25, label: '20L – 24L' },
  { upto: Infinity, rate: 0.30, label: '24L+' },
];

// Old regime slabs differ by age group
export const SLABS_OLD_BELOW60: SlabDef[] = [
  { upto: 250000,   rate: 0,    label: '0 – 2.5L' },
  { upto: 500000,   rate: 0.05, label: '2.5L – 5L' },
  { upto: 1000000,  rate: 0.20, label: '5L – 10L' },
  { upto: Infinity, rate: 0.30, label: '10L+' },
];
export const SLABS_OLD_SENIOR: SlabDef[] = [    // 60–80
  { upto: 300000,   rate: 0,    label: '0 – 3L' },
  { upto: 500000,   rate: 0.05, label: '3L – 5L' },
  { upto: 1000000,  rate: 0.20, label: '5L – 10L' },
  { upto: Infinity, rate: 0.30, label: '10L+' },
];
export const SLABS_OLD_SUPER: SlabDef[] = [     // 80+
  { upto: 500000,   rate: 0,    label: '0 – 5L' },
  { upto: 1000000,  rate: 0.20, label: '5L – 10L' },
  { upto: Infinity, rate: 0.30, label: '10L+' },
];

export function getOldSlabs(age: AgeGroup): SlabDef[] {
  if (age === 'above80') return SLABS_OLD_SUPER;
  if (age === '60to80')  return SLABS_OLD_SENIOR;
  return SLABS_OLD_BELOW60;
}

// ─────────────────────────────────────────────────────────────────────────────
// Surcharge — FY 2025-26
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Surcharge rates on income tax (before cess).
 * Old regime: 10 / 15 / 25 / 37% at 50L / 1Cr / 2Cr / 5Cr
 * New regime: capped at 25% (Budget 2023 removed 37% slab for new regime)
 * Marginal relief: extra tax ≤ extra income above surcharge threshold.
 */
function calcSurcharge(taxableIncome: number, baseTax: number, regime: 'old' | 'new'): SurchargeDetail {
  const thresholds = regime === 'new'
    ? [
        { above: 10000000, rate: 0.15 }, // 1Cr+ → 15% (new regime cap = 25%, but 15% is max for most)
        { above: 5000000,  rate: 0.10 }, // 50L–1Cr → 10%
      ]
    : [
        { above: 50000000,  rate: 0.37 }, // 5Cr+
        { above: 20000000,  rate: 0.25 }, // 2Cr–5Cr
        { above: 10000000,  rate: 0.15 }, // 1Cr–2Cr
        { above: 5000000,   rate: 0.10 }, // 50L–1Cr
      ];

  let rate = 0;
  let prevThreshold = 0;
  for (const t of thresholds) {
    if (taxableIncome > t.above) {
      rate = t.rate;
      prevThreshold = t.above;
      break;
    }
  }

  if (rate === 0) return { rate: 0, amount: 0, marginalRelief: 0 };

  const surchargeAmount = baseTax * rate;

  // Marginal relief on surcharge:
  // Tax + surcharge at this level should not exceed:
  //   tax computed at threshold + surcharge at threshold + (income - threshold)
  const taxAtThreshold = applySlabs(prevThreshold, regime === 'new' ? SLABS_NEW : SLABS_OLD_BELOW60);
  const surchargeAtThreshold = taxAtThreshold * (rate === 0.10 ? 0 : rate - 0.05); // simplified
  const maxTaxIncrease = taxableIncome - prevThreshold;
  const totalWithSurcharge = baseTax + surchargeAmount;
  const totalAtThreshold = taxAtThreshold + surchargeAtThreshold;
  const relief = Math.max(0, totalWithSurcharge - totalAtThreshold - maxTaxIncrease);

  return { rate, amount: surchargeAmount, marginalRelief: relief };
}

// ─────────────────────────────────────────────────────────────────────────────
// Core engine
// ─────────────────────────────────────────────────────────────────────────────

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

/**
 * 87A rebate with marginal relief.
 * Prevents the cliff where crossing ₹12L (new) or ₹5L (old) causes
 * sudden large tax bill. Extra tax ≤ extra income over threshold.
 */
function apply87AWithMarginalRelief(
  taxable: number, baseTax: number,
  threshold: number, maxRebate: number,
): { rebate: number; marginalRelief: number } {
  if (taxable <= threshold) {
    // Full rebate
    const rebate = Math.min(baseTax, maxRebate);
    return { rebate, marginalRelief: 0 };
  }
  // Above threshold — no standard 87A rebate, but apply marginal relief
  // Tax payable should not exceed (taxable - threshold)
  const excess = taxable - threshold;
  const relief = Math.max(0, baseTax - excess);
  return { rebate: 0, marginalRelief: relief };
}

export function calcOldRegime(u: UserInput): RegimeResult {
  const gross = u.salary.gross + u.otherIncome;

  // HRA exemption: min(HRA received, city% × basic, rent paid − 10% basic)
  const hraPct = hraExemptionPct(u.city);
  const hraExempt = u.rentPaid > 0 && u.salary.hra > 0
    ? Math.max(0, Math.min(
        u.salary.hra,
        u.salary.basic * hraPct,
        Math.max(0, u.rentPaid - u.salary.basic * 0.1),
      ))
    : 0;

  // Deduction caps (old regime only)
  const ded80C      = Math.min(150000, u.sec80C + u.salary.pf);
  const ded80D_max  = u.age === 'below60' ? 25000 : 50000; // seniors get ₹50K
  const ded80D      = Math.min(ded80D_max, u.sec80D);
  const ded80D_par  = Math.min(u.age !== 'below60' ? 50000 : 25000, u.sec80D_parents);
  const ded80CCD    = Math.min(50000, u.sec80CCD1B);
  const ded24b      = Math.min(200000, u.homeLoanInterest);
  // 80TTA (below 60): savings interest up to ₹10K
  // 80TTB (60+): savings + FD interest up to ₹50K; replaces 80TTA
  const dedTTA_TTB  = u.age === 'below60'
    ? Math.min(10000, u.sec80TTA)
    : Math.min(50000, u.sec80TTB);
  const ded80E      = u.sec80E; // no cap
  const ded80G      = u.sec80G; // simplified: take as entered (no 50/100% split for now)

  const taxable = Math.max(0,
    gross
    - hraExempt
    - u.salary.standardDed
    - u.salary.professional
    - ded80C
    - ded80D
    - ded80D_par
    - ded80CCD
    - ded24b
    - dedTTA_TTB
    - ded80E
    - ded80G,
  );

  const slabs   = getOldSlabs(u.age);
  const baseTax = applySlabs(taxable, slabs);

  // 87A rebate (super-senior gets no 87A)
  const { rebate, marginalRelief: relief87A } = u.age === 'above80'
    ? { rebate: 0, marginalRelief: 0 }
    : apply87AWithMarginalRelief(taxable, baseTax, 500000, 12500);

  const taxAfterRebate = Math.max(0, baseTax - rebate - relief87A);

  // Surcharge
  const surcharge = calcSurcharge(taxable, taxAfterRebate, 'old');
  const taxWithSurcharge = taxAfterRebate + surcharge.amount - surcharge.marginalRelief;
  const cess = Math.max(0, taxWithSurcharge) * 0.04;
  const tax  = Math.max(0, taxWithSurcharge) + cess;

  return {
    gross, taxable, baseTax, rebate, taxAfterRebate,
    surcharge, cess, tax, hraExempt,
    marginalRelief87A: relief87A,
    deductionsUsed: {
      standardDed: u.salary.standardDed,
      hraExempt,
      sec80C: ded80C,
      sec80D: ded80D + ded80D_par,
      sec80CCD1B: ded80CCD,
      homeLoanInterest: ded24b,
      sec80TTA_TTB: dedTTA_TTB,
      sec80E: ded80E,
      sec80G: ded80G,
      professional: u.salary.professional,
    },
  };
}

export function calcNewRegime(u: UserInput): RegimeResult {
  const gross   = u.salary.gross + u.otherIncome;
  // New regime: only standard deduction allowed
  const taxable = Math.max(0, gross - u.salary.standardDed);
  const baseTax = applySlabs(taxable, SLABS_NEW);

  // 87A rebate with marginal relief (nil tax ≤ ₹12L, marginal relief above)
  const { rebate, marginalRelief: relief87A } =
    apply87AWithMarginalRelief(taxable, baseTax, 1200000, 60000);

  const taxAfterRebate = Math.max(0, baseTax - rebate - relief87A);

  // Surcharge (new regime capped at 25%)
  const surcharge = calcSurcharge(taxable, taxAfterRebate, 'new');
  const taxWithSurcharge = taxAfterRebate + surcharge.amount - surcharge.marginalRelief;
  const cess = Math.max(0, taxWithSurcharge) * 0.04;
  const tax  = Math.max(0, taxWithSurcharge) + cess;

  return {
    gross, taxable, baseTax, rebate, taxAfterRebate,
    surcharge, cess, tax, hraExempt: 0,
    marginalRelief87A: relief87A,
    deductionsUsed: {
      standardDed: u.salary.standardDed,
      hraExempt: 0, sec80C: 0, sec80D: 0, sec80CCD1B: 0,
      homeLoanInterest: 0, sec80TTA_TTB: 0, sec80E: 0, sec80G: 0, professional: 0,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Slab slice (for visualization)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Deduction gap analysis
// ─────────────────────────────────────────────────────────────────────────────

export interface DeductionGap {
  code: string;       // old Act section (e.g. "80C")
  newCode: string;    // new Act 2025 section (e.g. "123")
  name: string;
  description: string;
  maxLimit: number;
  used: number;
  gap: number;
  taxSaved: number;   // estimated at 30% + 4% cess
}

/** Section number mapping: old Act 1961 → new Act 2025 (effective FY 2026-27). */
export const SECTION_MAP: Record<string, string> = {
  '80C':        '123',
  '80CCD(1B)':  '124',
  '80CCD(2)':   '125',
  '80D':        '126',
  '80E':        '129',
  '24(b)':      '72',
  '80EEA':      '130',
  '16(ia)':     '22',
  '87A':        '191',
  '80TTA':      '128',
  '80TTB':      '128',
  '10(13A)':    '18',  // HRA
};

export function calcDeductionGaps(u: UserInput, oldResult: RegimeResult): DeductionGap[] {
  const bracket = 0.30 * 1.04; // marginal rate + cess (conservative)
  const ded80CUsed = Math.min(150000, u.sec80C + u.salary.pf);
  const ded80DMax = u.age === 'below60' ? 25000 : 50000;
  const ded80D_parMax = u.age !== 'below60' ? 50000 : 25000;
  const ttaMax = u.age === 'below60' ? 10000 : 0;
  const ttbMax = u.age !== 'below60' ? 50000 : 0;

  const items: DeductionGap[] = [
    {
      code: '80C', newCode: '123',
      name: 'Tax-saving investments',
      description: 'ELSS, PPF, LIC premium, NSC, 5-yr bank FD, tuition fees, home loan principal',
      maxLimit: 150000, used: ded80CUsed,
      gap: Math.max(0, 150000 - ded80CUsed),
      taxSaved: Math.max(0, 150000 - ded80CUsed) * bracket,
    },
    {
      code: '80CCD(1B)', newCode: '124',
      name: 'NPS — extra ₹50K',
      description: 'National Pension System Tier-1, over and above 80C limit',
      maxLimit: 50000, used: Math.min(50000, u.sec80CCD1B),
      gap: Math.max(0, 50000 - u.sec80CCD1B),
      taxSaved: Math.max(0, 50000 - u.sec80CCD1B) * bracket,
    },
    {
      code: '80D', newCode: '126',
      name: 'Health insurance (self)',
      description: `Mediclaim premium — self + spouse + children. Max ₹${ded80DMax / 1000}K (${u.age === 'below60' ? 'below 60' : '60+'})`,
      maxLimit: ded80DMax, used: Math.min(ded80DMax, u.sec80D),
      gap: Math.max(0, ded80DMax - u.sec80D),
      taxSaved: Math.max(0, ded80DMax - u.sec80D) * bracket,
    },
    {
      code: '80D (parents)', newCode: '126',
      name: 'Health insurance (parents)',
      description: `Mediclaim for dependent parents. Max ₹${ded80D_parMax / 1000}K (₹50K if parents are senior)`,
      maxLimit: ded80D_parMax, used: Math.min(ded80D_parMax, u.sec80D_parents),
      gap: Math.max(0, ded80D_parMax - u.sec80D_parents),
      taxSaved: Math.max(0, ded80D_parMax - u.sec80D_parents) * bracket,
    },
    ...(u.salary.hra > 0 ? [{
      code: 'HRA', newCode: '18',
      name: 'House Rent Allowance',
      description: '50% of basic (8 metro cities) or 40% (others). Must pay actual rent.',
      maxLimit: u.salary.hra, used: oldResult.hraExempt,
      gap: Math.max(0, u.salary.hra - oldResult.hraExempt),
      taxSaved: Math.max(0, u.salary.hra - oldResult.hraExempt) * bracket,
    }] : []),
    {
      code: '24(b)', newCode: '72',
      name: 'Home loan interest',
      description: 'Self-occupied property — max ₹2L/yr. Let-out: unlimited but set-off capped.',
      maxLimit: 200000, used: Math.min(200000, u.homeLoanInterest),
      gap: Math.max(0, 200000 - u.homeLoanInterest),
      taxSaved: Math.max(0, 200000 - u.homeLoanInterest) * bracket,
    },
    ...(ttaMax > 0 ? [{
      code: '80TTA', newCode: '128',
      name: 'Savings bank interest',
      description: 'Interest from savings bank account — max ₹10K (below 60 only)',
      maxLimit: ttaMax, used: Math.min(ttaMax, u.sec80TTA),
      gap: Math.max(0, ttaMax - u.sec80TTA),
      taxSaved: Math.max(0, ttaMax - u.sec80TTA) * bracket,
    }] : []),
    ...(ttbMax > 0 ? [{
      code: '80TTB', newCode: '128',
      name: 'Savings & FD interest (senior)',
      description: 'Interest from savings + FD + post office — max ₹50K (60+ only)',
      maxLimit: ttbMax, used: Math.min(ttbMax, u.sec80TTB),
      gap: Math.max(0, ttbMax - u.sec80TTB),
      taxSaved: Math.max(0, ttbMax - u.sec80TTB) * bracket,
    }] : []),
    {
      code: '80E', newCode: '129',
      name: 'Education loan interest',
      description: 'Full interest on loan for higher education — no cap, max 8 years',
      maxLimit: u.sec80E > 0 ? u.sec80E * 2 : 100000, // show if already entering
      used: u.sec80E,
      gap: 0, // no cap — only show if not using
      taxSaved: 0,
    },
  ].filter(d => d.maxLimit > 0 && d.gap > 0);

  return items;
}
