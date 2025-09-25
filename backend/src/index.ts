
import  dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
// import  rateLimit from 'express-rate-limit';// src/index.ts

dotenv.config();

import express, { Request, Response, NextFunction } from 'express';

// Routers / controllers
import analyzeSmsRoute from './routes/analyze.routes'
import adminRouter from './routes/admin.route';

const app = express();
const port = Number(process.env.PORT || 3000);

// Basic middlewares
app.use(helmet());

const rawCors = process.env.CORS_ORIGIN || '*'; // e.g. "http://localhost:5173" or "*" or "https://your-frontend.com"
const allowedOrigins = rawCors === '*' ? ['*'] : rawCors.split(',').map(s => s.replace(/\/+$/, '').trim());

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests like curl/postman (no origin)
    if (!origin) return callback(null, true);

    // normalize incoming origin (remove trailing slash)
    const normalized = origin.replace(/\/+$/, '');

    if (allowedOrigins.includes('*') || allowedOrigins.includes(normalized)) {
      // echo back the exact origin the browser sent (not the env var)
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Admin-Token'],
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: process.env.EXPRESS_JSON_LIMIT || '20kb' }));

// Routes
app.use('/analyze', analyzeSmsRoute );

// Admin routes (mounted under /admin)
app.use('/admin', adminRouter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err && (err.stack || err));
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json(isDev ? { error: 'Internal Server Error', details: String(err?.message || err) } : { error: 'Internal Server Error' });
});

// Process-level guards
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // optional: graceful shutdown logic here
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  // optional: graceful shutdown logic here
});

// Start
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port} (env=${process.env.NODE_ENV || 'dev'})`);
});

export default app;
