import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  calcOldRegime,
  calcNewRegime,
  sliceBySlabs,
  SLABS_NEW,
  SLABS_OLD,
  UserInput,
} from '../lib/taxCalc';

export const calculateRouter = Router();

const SalarySchema = z.object({
  basic: z.number().min(0),
  hra: z.number().min(0),
  lta: z.number().min(0).default(0),
  special: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  pf: z.number().min(0).default(0),
  professional: z.number().min(0).default(2400),
  standardDed: z.number().min(0).default(75000),
});

const CalculateSchema = z.object({
  salary: SalarySchema,
  rentPaid: z.number().min(0).default(0),
  metro: z.boolean().default(true),
  declared80C: z.number().min(0).default(0),
  declared80D: z.number().min(0).default(0),
  nps80CCD1B: z.number().min(0).default(0),
  homeLoanInterest: z.number().min(0).default(0),
});

calculateRouter.post('/', (req: Request, res: Response) => {
  const parsed = CalculateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const u: UserInput = parsed.data;
  const old = calcOldRegime(u);
  const nw = calcNewRegime(u);

  const winner: 'old' | 'new' = old.tax <= nw.tax ? 'old' : 'new';
  const winnerTax = winner === 'old' ? old.tax : nw.tax;
  const loserTax = winner === 'old' ? nw.tax : old.tax;
  const savings = loserTax - winnerTax;

  const monthlyOld = (old.gross - old.tax) / 12;
  const monthlyNew = (nw.gross - nw.tax) / 12;

  return res.json({
    old: {
      ...old,
      slices: sliceBySlabs(old.taxable, SLABS_OLD),
      monthlyInHand: monthlyOld,
    },
    new: {
      ...nw,
      slices: sliceBySlabs(nw.taxable, SLABS_NEW),
      monthlyInHand: monthlyNew,
    },
    winner,
    savings,
    monthlyDelta: Math.abs(monthlyNew - monthlyOld),
  });
});

// Slider endpoint — recalculate at a given gross income level
calculateRouter.post('/at-income', (req: Request, res: Response) => {
  const schema = z.object({
    grossIncome: z.number().min(100000).max(100000000),
    metro: z.boolean().default(true),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { grossIncome, metro } = parsed.data;
  const ratio = grossIncome / 1800000;

  const u: UserInput = {
    salary: {
      basic: Math.round(720000 * ratio),
      hra: Math.round(360000 * ratio),
      lta: Math.round(60000 * ratio),
      special: Math.round(540000 * ratio),
      bonus: Math.round(120000 * ratio),
      pf: Math.round(86400 * ratio),
      professional: 2400,
      standardDed: 75000,
    },
    rentPaid: Math.round(264000 * ratio),
    metro,
    declared80C: Math.min(150000, Math.round(92000 * ratio)),
    declared80D: 18000,
    nps80CCD1B: 0,
    homeLoanInterest: 0,
  };

  const old = calcOldRegime(u);
  const nw = calcNewRegime(u);
  const winner: 'old' | 'new' = old.tax <= nw.tax ? 'old' : 'new';

  return res.json({
    grossIncome,
    oldTax: old.tax,
    newTax: nw.tax,
    winner,
    savings: Math.abs(old.tax - nw.tax),
  });
});
