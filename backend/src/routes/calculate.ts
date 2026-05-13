import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  calcOldRegime, calcNewRegime, calcDeductionGaps,
  sliceBySlabs, SLABS_NEW, getOldSlabs,
  type UserInput, type AgeGroup, type MetroCity,
} from '../lib/taxCalc';

export const calculateRouter = Router();

// ── Zod schema (single source of truth for API contract) ─────────────────────

const METRO_CITIES = ['Delhi','Mumbai','Chennai','Kolkata','Bengaluru','Hyderabad','Pune','Ahmedabad','Other'] as const;
const AGE_GROUPS   = ['below60','60to80','above80'] as const;

const CalculateSchema = z.object({
  salary: z.object({
    gross:        z.number().min(0),
    basic:        z.number().min(0).default(0),
    hra:          z.number().min(0).default(0),
    pf:           z.number().min(0).default(0),
    professional: z.number().min(0).default(2400),
    standardDed:  z.number().min(0).default(75000),
  }),
  age:              z.enum(AGE_GROUPS).default('below60'),
  city:             z.enum(METRO_CITIES).default('Other'),
  rentPaid:         z.number().min(0).default(0),
  sec80C:           z.number().min(0).default(0),
  sec80D:           z.number().min(0).default(0),
  sec80D_parents:   z.number().min(0).default(0),
  sec80CCD1B:       z.number().min(0).default(0),
  homeLoanInterest: z.number().min(0).default(0),
  sec80TTA:         z.number().min(0).default(0),
  sec80TTB:         z.number().min(0).default(0),
  sec80E:           z.number().min(0).default(0),
  sec80G:           z.number().min(0).default(0),
  otherIncome:      z.number().min(0).default(0),
});

// ── Recommendation engine ─────────────────────────────────────────────────────

interface Recommendation {
  priority: 'high' | 'medium';
  code: string;
  newCode: string;
  title: string;
  action: string;
  potentialSaving: number;
  deadline?: string;
}

function buildRecommendations(u: UserInput, winner: 'old' | 'new', gaps: ReturnType<typeof calcDeductionGaps>): Recommendation[] {
  const recs: Recommendation[] = [];

  if (winner === 'old') {
    for (const g of gaps) {
      if (g.code === '80C' && g.gap > 0)
        recs.push({ priority: 'high', code: '80C', newCode: g.newCode, title: 'Top up tax-saving investments', action: `Invest ₹${g.gap.toLocaleString('en-IN')} in ELSS/PPF/NSC before 31 March to claim full ₹1.5L 80C limit.`, potentialSaving: Math.round(g.taxSaved), deadline: 'March 31' });
      if (g.code === '80CCD(1B)' && g.gap > 0)
        recs.push({ priority: 'high', code: '80CCD(1B)', newCode: g.newCode, title: 'Contribute to NPS Tier-1', action: `Put ₹${g.gap.toLocaleString('en-IN')} in NPS Tier-1 (Sec 124 new Act) — extra ₹50K deduction beyond 80C limit.`, potentialSaving: Math.round(g.taxSaved), deadline: 'March 31' });
      if (g.code === '80D' && g.gap > 0)
        recs.push({ priority: 'medium', code: '80D', newCode: g.newCode, title: 'Buy/upgrade health insurance', action: `A mediclaim premium of ₹${g.gap.toLocaleString('en-IN')} for self+family (Sec 126) fills the deduction gap.`, potentialSaving: Math.round(g.taxSaved) });
      if (g.code === '80D (parents)' && g.gap > 0)
        recs.push({ priority: 'medium', code: '80D (parents)', newCode: g.newCode, title: 'Insure dependent parents', action: `Add parents to health insurance — ₹${g.gap.toLocaleString('en-IN')} additional deduction available.`, potentialSaving: Math.round(g.taxSaved) });
      if (g.code === 'HRA' && u.rentPaid === 0)
        recs.push({ priority: 'high', code: 'HRA', newCode: g.newCode, title: 'Submit rent receipts to employer', action: `You have HRA of ₹${u.salary.hra.toLocaleString('en-IN')} in your CTC. Collect rent receipts + landlord PAN and submit to HR before February cut-off.`, potentialSaving: Math.round(g.taxSaved), deadline: 'February' });
      if ((g.code === '80TTA' || g.code === '80TTB') && g.gap > 0)
        recs.push({ priority: 'medium', code: g.code, newCode: g.newCode, title: `Declare savings/FD interest (${g.code})`, action: `Interest income up to ₹${g.maxLimit.toLocaleString('en-IN')} is deductible. Ensure all interest certificates are included in your ITR.`, potentialSaving: Math.round(g.taxSaved) });
    }
  }

  if (winner === 'new') {
    const empNPS = Math.round(u.salary.basic * 0.10);
    const empNPSSave = Math.round(empNPS * 0.30 * 1.04);
    recs.push({ priority: 'high', code: '80CCD(2)', newCode: '125', title: 'Request employer NPS contribution', action: `Ask HR to route up to 10% of basic (≈₹${empNPS.toLocaleString('en-IN')}/yr) as employer NPS contribution under Sec 125 — no upper cap, only unrestricted deduction in new regime.`, potentialSaving: empNPSSave });
    recs.push({ priority: 'medium', code: 'Regime switch?', newCode: '', title: 'Review regime annually', action: 'New regime wins now, but if you increase 80C/HRA/NPS contributions, Old regime may become better. Re-check every March before submitting investment declaration to employer.', potentialSaving: 0 });
  }

  return recs;
}

// ── Main calculate endpoint ───────────────────────────────────────────────────

calculateRouter.post('/', (req: Request, res: Response) => {
  const parsed = CalculateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const u: UserInput = parsed.data as UserInput;
  const old  = calcOldRegime(u);
  const nw   = calcNewRegime(u);
  const gaps = calcDeductionGaps(u, old);

  const winner: 'old' | 'new' = old.tax <= nw.tax ? 'old' : 'new';
  const savings     = Math.abs(old.tax - nw.tax);
  const monthlyOld  = Math.round((old.gross - old.tax) / 12);
  const monthlyNew  = Math.round((nw.gross  - nw.tax)  / 12);
  const totalGapSave = Math.round(gaps.reduce((s, g) => s + g.taxSaved, 0));

  // Zero-tax: new regime taxable ≤ ₹12L → user owes no tax regardless of regime
  const zeroTax     = nw.taxable <= 1200000;
  const recommendations = zeroTax ? [] : buildRecommendations(u, winner, gaps);

  return res.json({
    zeroTax,
    winner,
    savings:           Math.round(savings),
    monthlyDelta:      Math.abs(monthlyNew - monthlyOld),
    totalGapSaving:    totalGapSave,
    old: {
      taxable:         old.taxable,
      baseTax:         Math.round(old.baseTax),
      rebate:          Math.round(old.rebate),
      marginalRelief:  Math.round(old.marginalRelief87A),
      surcharge:       old.surcharge,
      cess:            Math.round(old.cess),
      tax:             Math.round(old.tax),
      hraExempt:       Math.round(old.hraExempt),
      deductionsUsed:  old.deductionsUsed,
      monthlyInHand:   monthlyOld,
      slices:          sliceBySlabs(old.taxable, getOldSlabs(u.age)),
    },
    new: {
      taxable:         nw.taxable,
      baseTax:         Math.round(nw.baseTax),
      rebate:          Math.round(nw.rebate),
      marginalRelief:  Math.round(nw.marginalRelief87A),
      surcharge:       nw.surcharge,
      cess:            Math.round(nw.cess),
      tax:             Math.round(nw.tax),
      monthlyInHand:   monthlyNew,
      deductionsUsed:  nw.deductionsUsed,
      slices:          sliceBySlabs(nw.taxable, SLABS_NEW),
    },
    gaps,
    recommendations,
  });
});
