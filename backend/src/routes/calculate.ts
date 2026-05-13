import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { calcOldRegime, calcNewRegime, sliceBySlabs, SLABS_NEW, getOldSlabs, type UserInput, type AgeGroup, type MetroCity } from '../lib/taxCalc';

export const calculateRouter = Router();

const METRO_CITIES = ['Delhi','Mumbai','Chennai','Kolkata','Bengaluru','Hyderabad','Pune','Ahmedabad','Other'] as const;
const AGE_GROUPS   = ['below60','60to80','above80'] as const;

const SalarySchema = z.object({
  gross:        z.number().min(0),
  basic:        z.number().min(0),
  hra:          z.number().min(0).default(0),
  pf:           z.number().min(0).default(0),
  professional: z.number().min(0).default(2400),
  standardDed:  z.number().min(0).default(75000),
});

const CalculateSchema = z.object({
  salary:           SalarySchema,
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

calculateRouter.post('/', (req: Request, res: Response) => {
  const parsed = CalculateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const u: UserInput = parsed.data as UserInput;
  const old = calcOldRegime(u);
  const nw  = calcNewRegime(u);

  const winner: 'old' | 'new' = old.tax <= nw.tax ? 'old' : 'new';
  const savings = Math.abs(old.tax - nw.tax);
  const monthlyOld = (old.gross - old.tax) / 12;
  const monthlyNew = (nw.gross  - nw.tax)  / 12;

  return res.json({
    old: { ...old, slices: sliceBySlabs(old.taxable, getOldSlabs(u.age)), monthlyInHand: monthlyOld },
    new: { ...nw,  slices: sliceBySlabs(nw.taxable,  SLABS_NEW),          monthlyInHand: monthlyNew },
    winner,
    savings,
    monthlyDelta: Math.abs(monthlyNew - monthlyOld),
  });
});

// At-income — recalculate at a given gross with default deduction profile
calculateRouter.post('/at-income', (req: Request, res: Response) => {
  const schema = z.object({
    grossIncome: z.number().min(100000).max(100000000),
    age:         z.enum(AGE_GROUPS).default('below60'),
    city:        z.enum(METRO_CITIES).default('Other'),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { grossIncome, age, city } = parsed.data;
  const ratio = grossIncome / 1800000;

  const u: UserInput = {
    salary: {
      gross:        grossIncome,
      basic:        Math.round(720000 * ratio),
      hra:          Math.round(360000 * ratio),
      pf:           Math.round(86400 * ratio),
      professional: 2400,
      standardDed:  75000,
    },
    age:              age as AgeGroup,
    city:             city as MetroCity,
    rentPaid:         Math.round(264000 * ratio),
    sec80C:           Math.min(150000, Math.round(92000 * ratio)),
    sec80D:           18000,
    sec80D_parents:   0,
    sec80CCD1B:       0,
    homeLoanInterest: 0,
    sec80TTA:         0,
    sec80TTB:         0,
    sec80E:           0,
    sec80G:           0,
    otherIncome:      0,
  };

  const old = calcOldRegime(u);
  const nw  = calcNewRegime(u);
  const winner: 'old' | 'new' = old.tax <= nw.tax ? 'old' : 'new';

  return res.json({ grossIncome, age, city, oldTax: old.tax, newTax: nw.tax, winner, savings: Math.abs(old.tax - nw.tax) });
});
