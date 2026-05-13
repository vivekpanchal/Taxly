import { Router, Request, Response } from 'express';

export const form16Router = Router();

// Mock Form 16 parsing — in production: integrate PDF parser + AI extraction
form16Router.post('/parse', (req: Request, res: Response) => {
  // Simulate parsing delay handled by client; return mock extracted data
  return res.json({
    success: true,
    fields: {
      employer: 'Cohera Systems Pvt. Ltd.',
      employeeName: 'Rohan Iyer',
      pan: 'AXLPI2741K',
      fy: '2025-26',
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
      declared80C: 92000,
      declared80D: 18000,
      tdsDeducted: 187200,
      rentPaid: 264000,
    },
    detectedFields: 9,
  });
});
