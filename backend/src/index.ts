
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
  origin: allowedOrigins.includes('*') ? true : allowedOrigins,
}));

app.use(express.json({ limit: process.env.EXPRESS_JSON_LIMIT || '20kb' }));


app.use('/analyze', analyzeSmsRoute );
app.use('/admin', adminRouter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

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
  // graceful shutdown logic here? Later
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  // graceful shutdown logic here? Later
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port} (env=${process.env.NODE_ENV || 'dev'})`);
});

app.listen(port, () => console.log(`Listening on ${port}`));

export default app;
