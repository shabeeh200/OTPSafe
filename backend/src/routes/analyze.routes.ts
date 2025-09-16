// src/routes/analyze.ts
import { Router } from 'express';
import { analyzeSmsHandler } from '../controllers/analyzerController';
// filepath: src/routes/analyze.routes.ts
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({ windowMs: 60_000, max: 10 });
const router = Router();
// POST /api/analyze-sms
router.use(limiter);
router.post('/analyze-sms', analyzeSmsHandler);

export default router;
