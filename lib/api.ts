/**
 * Typed API client — all tax calculations go through the backend.
 * Frontend never runs tax math directly.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Shared types (mirrors backend Zod schema) ─────────────────────────────────

export type AgeGroup  = 'below60' | '60to80' | 'above80';
export type MetroCity = 'Delhi'|'Mumbai'|'Chennai'|'Kolkata'|'Bengaluru'|'Hyderabad'|'Pune'|'Ahmedabad'|'Other';

export interface CalculateInput {
  salary: {
    gross: number;
    basic: number;
    hra: number;
    pf: number;
    professional?: number;
    standardDed?: number;
  };
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

export interface SlabSlice {
  upto: number;
  rate: number;
  label: string;
  amount: number;
  tax: number;
}

export interface SurchargeDetail {
  rate: number;
  amount: number;
  marginalRelief: number;
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

export interface RegimeData {
  taxable: number;
  baseTax: number;
  rebate: number;
  marginalRelief: number;
  surcharge: SurchargeDetail;
  cess: number;
  tax: number;
  hraExempt: number;
  monthlyInHand: number;
  deductionsUsed: DeductionBreakdown;
  slices: SlabSlice[];
}

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

export interface Recommendation {
  priority: 'high' | 'medium';
  code: string;
  newCode: string;
  title: string;
  action: string;
  potentialSaving: number;
  deadline?: string;
}

export interface CalculateResult {
  zeroTax: boolean;
  winner: 'old' | 'new';
  savings: number;
  monthlyDelta: number;
  totalGapSaving: number;
  old: RegimeData;
  new: RegimeData;
  gaps: DeductionGap[];
  recommendations: Recommendation[];
}

// ── API call ──────────────────────────────────────────────────────────────────

export async function calculate(input: CalculateInput): Promise<CalculateResult> {
  const res = await fetch(`${API_BASE}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
