/**
 * Taxly Backend Tax Engine — mirrors frontend lib/taxCalc.ts
 * FY 2025-26 (AY 2026-27)
 *
 * Kept as a standalone copy so the backend can be deployed independently
 * without bundling Next.js/frontend code. Must stay in sync with
 * lib/taxCalc.ts in the root.
 *
 * TODO: extract to a shared @taxly/engine package when both reach stability.
 */

export type AgeGroup = 'below60' | '60to80' | 'above80';
export type MetroCity = 'Delhi' | 'Mumbai' | 'Chennai' | 'Kolkata' | 'Bengaluru' | 'Hyderabad' | 'Pune' | 'Ahmedabad' | 'Other';

const METRO_CITIES = new Set(['Delhi','Mumbai','Chennai','Kolkata','Bengaluru','Hyderabad','Pune','Ahmedabad']);

export interface SalaryInput {
  gross: number;
  basic: number;
  hra: number;
  pf: number;
  professional: number;
  standardDed: number;
}

export interface UserInput {
  salary: SalaryInput;
  age: AgeGroup;
  city: MetroCity;
  rentPaid: number;
  sec80C: number;
  sec80D: number;
  sec80D_parents: number;
  sec80CCD1B: number;
  homeLoanInterest: number;
  sec80TTA: number;
  sec80TTB: number;
  sec80E: number;
  sec80G: number;
  otherIncome: number;
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

export interface RegimeResult {
  gross: number;
  taxable: number;
  baseTax: number;
  rebate: number;
  taxAfterRebate: number;
  surcharge: { rate: number; amount: number; marginalRelief: number };
  cess: number;
  tax: number;
  hraExempt: number;
  marginalRelief87A: number;
  deductionsUsed: DeductionBreakdown;
}

export interface SlabDef { upto: number; rate: number; label: string; }

export const SLABS_NEW: SlabDef[] = [
  { upto: 400000,   rate: 0,    label: '0–4L' },
  { upto: 800000,   rate: 0.05, label: '4–8L' },
  { upto: 1200000,  rate: 0.10, label: '8–12L' },
  { upto: 1600000,  rate: 0.15, label: '12–16L' },
  { upto: 2000000,  rate: 0.20, label: '16–20L' },
  { upto: 2400000,  rate: 0.25, label: '20–24L' },
  { upto: Infinity, rate: 0.30, label: '24L+' },
];

const SLABS_OLD_BELOW60: SlabDef[] = [
  { upto: 250000,   rate: 0,    label: '0–2.5L' },
  { upto: 500000,   rate: 0.05, label: '2.5–5L' },
  { upto: 1000000,  rate: 0.20, label: '5–10L' },
  { upto: Infinity, rate: 0.30, label: '10L+' },
];
const SLABS_OLD_SENIOR: SlabDef[] = [
  { upto: 300000,   rate: 0,    label: '0–3L' },
  { upto: 500000,   rate: 0.05, label: '3–5L' },
  { upto: 1000000,  rate: 0.20, label: '5–10L' },
  { upto: Infinity, rate: 0.30, label: '10L+' },
];
const SLABS_OLD_SUPER: SlabDef[] = [
  { upto: 500000,   rate: 0,    label: '0–5L' },
  { upto: 1000000,  rate: 0.20, label: '5–10L' },
  { upto: Infinity, rate: 0.30, label: '10L+' },
];

export function getOldSlabs(age: AgeGroup): SlabDef[] {
  if (age === 'above80') return SLABS_OLD_SUPER;
  if (age === '60to80')  return SLABS_OLD_SENIOR;
  return SLABS_OLD_BELOW60;
}

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

function apply87AWithMarginalRelief(
  taxable: number, baseTax: number, threshold: number, maxRebate: number,
): { rebate: number; marginalRelief: number } {
  if (taxable <= threshold) {
    return { rebate: Math.min(baseTax, maxRebate), marginalRelief: 0 };
  }
  const excess = taxable - threshold;
  const relief = Math.max(0, baseTax - excess);
  return { rebate: 0, marginalRelief: relief };
}

function calcSurcharge(taxableIncome: number, baseTax: number, regime: 'old' | 'new') {
  const thresholds = regime === 'new'
    ? [{ above: 10000000, rate: 0.15 }, { above: 5000000, rate: 0.10 }]
    : [{ above: 50000000, rate: 0.37 }, { above: 20000000, rate: 0.25 }, { above: 10000000, rate: 0.15 }, { above: 5000000, rate: 0.10 }];

  let rate = 0;
  for (const t of thresholds) {
    if (taxableIncome > t.above) { rate = t.rate; break; }
  }
  if (rate === 0) return { rate: 0, amount: 0, marginalRelief: 0 };
  return { rate, amount: baseTax * rate, marginalRelief: 0 };
}

export function calcOldRegime(u: UserInput): RegimeResult {
  const gross = u.salary.gross + u.otherIncome;
  const hraPct = METRO_CITIES.has(u.city) ? 0.5 : 0.4;
  const hraExempt = u.rentPaid > 0 && u.salary.hra > 0
    ? Math.max(0, Math.min(u.salary.hra, u.salary.basic * hraPct, Math.max(0, u.rentPaid - u.salary.basic * 0.1)))
    : 0;

  const ded80C     = Math.min(150000, u.sec80C + u.salary.pf);
  const ded80D_max = u.age === 'below60' ? 25000 : 50000;
  const ded80D     = Math.min(ded80D_max, u.sec80D);
  const ded80D_par = Math.min(u.age !== 'below60' ? 50000 : 25000, u.sec80D_parents);
  const ded80CCD   = Math.min(50000, u.sec80CCD1B);
  const ded24b     = Math.min(200000, u.homeLoanInterest);
  const dedTTA_TTB = u.age === 'below60' ? Math.min(10000, u.sec80TTA) : Math.min(50000, u.sec80TTB);

  const taxable = Math.max(0,
    gross - hraExempt - u.salary.standardDed - u.salary.professional
    - ded80C - ded80D - ded80D_par - ded80CCD - ded24b - dedTTA_TTB - u.sec80E - u.sec80G,
  );

  const slabs = getOldSlabs(u.age);
  const baseTax = applySlabs(taxable, slabs);

  const { rebate, marginalRelief: relief87A } = u.age === 'above80'
    ? { rebate: 0, marginalRelief: 0 }
    : apply87AWithMarginalRelief(taxable, baseTax, 500000, 12500);

  const taxAfterRebate = Math.max(0, baseTax - rebate - relief87A);
  const surcharge = calcSurcharge(taxable, taxAfterRebate, 'old');
  const taxWithSurcharge = taxAfterRebate + surcharge.amount - surcharge.marginalRelief;
  const cess = Math.max(0, taxWithSurcharge) * 0.04;

  return { gross, taxable, baseTax, rebate, taxAfterRebate, surcharge, cess, tax: Math.max(0, taxWithSurcharge) + cess, hraExempt, marginalRelief87A: relief87A, deductionsUsed: { standardDed: u.salary.standardDed, hraExempt, sec80C: ded80C, sec80D: ded80D + ded80D_par, sec80CCD1B: ded80CCD, homeLoanInterest: ded24b, sec80TTA_TTB: dedTTA_TTB, sec80E: u.sec80E, sec80G: u.sec80G, professional: u.salary.professional } };
}

export function calcNewRegime(u: UserInput): RegimeResult {
  const gross = u.salary.gross + u.otherIncome;
  const taxable = Math.max(0, gross - u.salary.standardDed);
  const baseTax = applySlabs(taxable, SLABS_NEW);

  const { rebate, marginalRelief: relief87A } = apply87AWithMarginalRelief(taxable, baseTax, 1200000, 60000);
  const taxAfterRebate = Math.max(0, baseTax - rebate - relief87A);
  const surcharge = calcSurcharge(taxable, taxAfterRebate, 'new');
  const taxWithSurcharge = taxAfterRebate + surcharge.amount - surcharge.marginalRelief;
  const cess = Math.max(0, taxWithSurcharge) * 0.04;

  return { gross, taxable, baseTax, rebate, taxAfterRebate, surcharge, cess, tax: Math.max(0, taxWithSurcharge) + cess, hraExempt: 0, marginalRelief87A: relief87A, deductionsUsed: { standardDed: u.salary.standardDed, hraExempt: 0, sec80C: 0, sec80D: 0, sec80CCD1B: 0, homeLoanInterest: 0, sec80TTA_TTB: 0, sec80E: 0, sec80G: 0, professional: 0 } };
}

export function sliceBySlabs(taxable: number, slabs: SlabDef[]) {
  const out: Array<SlabDef & { amount: number; tax: number }> = [];
  let prev = 0, rem = taxable;
  for (const s of slabs) {
    const take = Math.max(0, Math.min(rem, s.upto - prev));
    if (take > 0 || out.length === 0) out.push({ ...s, amount: take, tax: take * s.rate });
    rem -= take; prev = s.upto;
    if (rem <= 0) break;
  }
  return out;
}

// ── Deduction gap analysis ────────────────────────────────────────────────────

export interface DeductionGap {
  code: string;
  newCode: string;
  name: string;
  description: string;
  maxLimit: number;
  used: number;
  gap: number;
  taxSaved: number;
}

export const SECTION_MAP: Record<string, string> = {
  '80C': '123', '80CCD(1B)': '124', '80CCD(2)': '125', '80D': '126',
  '80E': '129', '24(b)': '72', '87A': '191', '80TTA': '128', '80TTB': '128', '10(13A)': '18',
};

export function calcDeductionGaps(u: UserInput, oldResult: RegimeResult): DeductionGap[] {
  const bracket = 0.30 * 1.04;
  const ded80CUsed = Math.min(150000, u.sec80C + u.salary.pf);
  const ded80DMax  = u.age === 'below60' ? 25000 : 50000;
  const ded80D_parMax = u.age !== 'below60' ? 50000 : 25000;
  const ttaMax = u.age === 'below60' ? 10000 : 0;
  const ttbMax = u.age !== 'below60' ? 50000 : 0;

  const items: DeductionGap[] = [
    { code: '80C',       newCode: '123', name: 'Tax-saving investments',   description: 'ELSS, PPF, LIC, NSC, 5-yr FD, tuition fees', maxLimit: 150000, used: ded80CUsed, gap: Math.max(0, 150000 - ded80CUsed), taxSaved: Math.max(0, 150000 - ded80CUsed) * bracket },
    { code: '80CCD(1B)', newCode: '124', name: 'NPS extra ₹50K',           description: 'National Pension System Tier-1, over 80C', maxLimit: 50000, used: Math.min(50000, u.sec80CCD1B), gap: Math.max(0, 50000 - u.sec80CCD1B), taxSaved: Math.max(0, 50000 - u.sec80CCD1B) * bracket },
    { code: '80D',       newCode: '126', name: `Health insurance (self)`,  description: `Mediclaim — self+family, max ₹${ded80DMax/1000}K`, maxLimit: ded80DMax, used: Math.min(ded80DMax, u.sec80D), gap: Math.max(0, ded80DMax - u.sec80D), taxSaved: Math.max(0, ded80DMax - u.sec80D) * bracket },
    { code: '80D (parents)', newCode: '126', name: 'Health insurance (parents)', description: 'Parents mediclaim', maxLimit: ded80D_parMax, used: Math.min(ded80D_parMax, u.sec80D_parents), gap: Math.max(0, ded80D_parMax - u.sec80D_parents), taxSaved: Math.max(0, ded80D_parMax - u.sec80D_parents) * bracket },
    ...(u.salary.hra > 0 ? [{ code: 'HRA', newCode: '18', name: 'House Rent Allowance', description: 'Rent receipts required', maxLimit: u.salary.hra, used: oldResult.hraExempt, gap: Math.max(0, u.salary.hra - oldResult.hraExempt), taxSaved: Math.max(0, u.salary.hra - oldResult.hraExempt) * bracket }] : []),
    { code: '24(b)', newCode: '72', name: 'Home loan interest', description: 'Self-occupied, max ₹2L/yr', maxLimit: 200000, used: Math.min(200000, u.homeLoanInterest), gap: Math.max(0, 200000 - u.homeLoanInterest), taxSaved: Math.max(0, 200000 - u.homeLoanInterest) * bracket },
    ...(ttaMax > 0 ? [{ code: '80TTA', newCode: '128', name: 'Savings interest',        description: 'Bank savings a/c, max ₹10K', maxLimit: ttaMax, used: Math.min(ttaMax, u.sec80TTA), gap: Math.max(0, ttaMax - u.sec80TTA), taxSaved: Math.max(0, ttaMax - u.sec80TTA) * bracket }] : []),
    ...(ttbMax > 0 ? [{ code: '80TTB', newCode: '128', name: 'Savings + FD interest',  description: 'Senior citizen, max ₹50K', maxLimit: ttbMax, used: Math.min(ttbMax, u.sec80TTB), gap: Math.max(0, ttbMax - u.sec80TTB), taxSaved: Math.max(0, ttbMax - u.sec80TTB) * bracket }] : []),
  ].filter(d => d.maxLimit > 0 && d.gap > 0);

  return items;
}
