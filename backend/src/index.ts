import express from 'express';
import  dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import  rateLimit from 'express-rate-limit';
import { analyzeSmsHandler } from './controller/analyzerController';

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3000);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json({ limit: '20kb' }));
app.use(morgan('combined'));

app.use('/api/', rateLimit({
  windowMs: 60*1000,
  max: Number(process.env.RATE_LIMIT_MAX || 30),
  message: JSON.stringify({ error: 'Too many requests' })
}));

app.post('/api/analyze-sms', analyzeSmsHandler);
app.get('/health', (_req, res) => res.json({ status: 'OK', ts: new Date().toISOString() }));

// centralized error handler
app.use((err:any, _req:any, res:any, _next:any) => {
  console.error('Unhandled error:', err);
  res.status(500).json(process.env.NODE_ENV==='development' ? { error: err?.message } : { error: 'Server Error' });
});

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
});
process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', err);
});

app.listen(port, () => console.log(`Listening on ${port}`));
export default app;
