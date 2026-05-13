export interface SalaryInput {
  basic: number;
  hra: number;
  lta: number;
  special: number;
  bonus: number;
  pf: number;
  professional: number;
  standardDed: number;
}

export interface UserInput {
  salary: SalaryInput;
  rentPaid: number;
  metro: boolean;
  declared80C: number;
  declared80D: number;
  nps80CCD1B: number;
  homeLoanInterest: number;
}

export interface RegimeResult {
  gross: number;
  taxable: number;
  tax: number;
  baseTax: number;
  cess: number;
  hraExempt?: number;
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

export const SLABS_NEW: SlabDef[] = [
  { upto: 400000,    rate: 0,    label: '0 – 4L' },
  { upto: 800000,    rate: 0.05, label: '4L – 8L' },
  { upto: 1200000,   rate: 0.10, label: '8L – 12L' },
  { upto: 1600000,   rate: 0.15, label: '12L – 16L' },
  { upto: 2000000,   rate: 0.20, label: '16L – 20L' },
  { upto: 2400000,   rate: 0.25, label: '20L – 24L' },
  { upto: Infinity,  rate: 0.30, label: '24L+' },
];

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
  const gross = u.salary.basic + u.salary.hra + u.salary.lta + u.salary.special + u.salary.bonus;
  const hraPercent = u.metro ? 0.5 : 0.4;
  const hraExempt = Math.max(0, Math.min(
    u.salary.hra,
    u.salary.basic * hraPercent,
    Math.max(0, u.rentPaid - u.salary.basic * 0.1),
  ));
  const ded80C = Math.min(150000, u.declared80C + u.salary.pf);
  const ded80D = Math.min(25000, u.declared80D);
  const ded80CCD = Math.min(50000, u.nps80CCD1B);
  const ded24b = Math.min(200000, u.homeLoanInterest);
  const taxable = Math.max(0, gross - hraExempt - u.salary.standardDed - u.salary.professional - ded80C - ded80D - ded80CCD - ded24b);
  let baseTax = applySlabs(taxable, SLABS_OLD);
  if (taxable <= 500000) baseTax = 0;
  const cess = baseTax * 0.04;
  return { gross, taxable, tax: baseTax + cess, baseTax, cess, hraExempt };
}

export function calcNewRegime(u: UserInput): RegimeResult {
  const gross = u.salary.basic + u.salary.hra + u.salary.lta + u.salary.special + u.salary.bonus;
  const taxable = Math.max(0, gross - u.salary.standardDed);
  let baseTax = applySlabs(taxable, SLABS_NEW);
  if (taxable <= 1200000) baseTax = 0;
  const cess = baseTax * 0.04;
  return { gross, taxable, tax: baseTax + cess, baseTax, cess };
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

// Default persona: Rohan, ₹18L CTC, Bengaluru
export const DEFAULT_USER: UserInput = {
  salary: {
    basic: 720000,
    hra: 360000,
    lta: 60000,
    special: 540000,
    bonus: 120000,
    pf: 86400,
    professional: 2400,
    standardDed: 75000,
  },
  rentPaid: 264000,
  metro: true,
  declared80C: 92000,
  declared80D: 18000,
  nps80CCD1B: 0,
  homeLoanInterest: 0,
};
