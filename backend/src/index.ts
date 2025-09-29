console.log("==== [DEBUG] Server boot sequence starting ====");
import  dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
// import  rateLimit from 'express-rate-limit';// src/index.ts
import analyzeSmsRoute from './routes/analyze.routes'
import adminRouter from './routes/admin.route';
import express, { Request, Response, NextFunction } from 'express';
dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3000);

// Basic middlewares


const rawCors = process.env.CORS_ORIGIN || '*'; // e.g. "http://localhost:5173" or "*" or "https://your-frontend.com"
const allowedOrigins = rawCors === '*' ? ['*'] : rawCors.split(',').map(s => s.replace(/\/+$/, '').trim());

// CORS options that verify origin
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // non-browser requests (curl, server-to-server) often have undefined origin — allow them
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  optionsSuccessStatus: 204,
  allowedHeaders: "Content-Type,Authorization,Accept,Origin,X-Requested-With",
  credentials: false // set to true only if you need cookies/auth
};
app.use((req, _res, next) => {
  if (req.method === 'OPTIONS') console.log('[CORS] preflight', req.method, req.path, 'Origin:', req.headers.origin);
  next();
});

// apply global CORS (before routes)
app.use(cors(corsOptions));

// safe preflight handler using RegExp (NOT a string)
app.options(/.*/, cors(corsOptions));
app.use(helmet());
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

console.log("==== [DEBUG] About to call app.listen on port", port);
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port} (env=${process.env.NODE_ENV || 'dev'})`);
});

export default app;
