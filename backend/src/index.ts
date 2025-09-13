// src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { analyzeSmsHandler } from './controller/analyzeController';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json({ limit: '20kb' }));
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 30),
  message: { error: 'Too many requests, slow down.' }
});
app.use('/api/', limiter);

app.post('/api/analyze-sms', analyzeSmsHandler);
app.get('/health', (_req: Request, res: Response) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json(process.env.NODE_ENV === 'development' ? { error: err?.message ?? 'Server Error' } : { error: 'Server Error' });
});

app.listen(port, () => console.log(`Server listening on :${port}`));
export default app;
