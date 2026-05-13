import { Router, Request, Response } from 'express';
import { z } from 'zod';

export const authRouter = Router();

// In-memory OTP store — replace with Redis/DB in production
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

authRouter.post('/send-otp', (req: Request, res: Response) => {
  const schema = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number') });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  const { phone } = parsed.data;
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
  otpStore.set(phone, { otp, expiresAt });

  // In production: send via SMS gateway (e.g., MSG91, Twilio)
  console.log(`[DEV] OTP for +91${phone}: ${otp}`);

  return res.json({ success: true, message: 'OTP sent' });
});

authRouter.post('/verify-otp', (req: Request, res: Response) => {
  const schema = z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/),
    otp: z.string().length(6),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const { phone, otp } = parsed.data;
  const stored = otpStore.get(phone);

  if (!stored) {
    return res.status(400).json({ error: 'OTP not found. Request a new one.' });
  }
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'OTP expired. Request a new one.' });
  }
  if (stored.otp !== otp) {
    return res.status(400).json({ error: 'Incorrect OTP' });
  }

  otpStore.delete(phone);

  // In production: issue JWT or session token
  return res.json({
    success: true,
    token: `mock-token-${phone}-${Date.now()}`,
    user: { phone: `+91${phone}` },
  });
});
