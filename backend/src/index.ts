import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { calculateRouter } from './routes/calculate';
import { authRouter } from './routes/auth';
import { form16Router } from './routes/form16';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.use('/api/calculate', calculateRouter);
app.use('/api/auth', authRouter);
app.use('/api/form16', form16Router);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`Taxly API running on http://localhost:${PORT}`);
});
