// src/routes/admin.ts
import { Router, Request, Response, NextFunction } from 'express';
import * as ctrl from '../controllers/adminController';

const router = Router();
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token';

function checkAdminToken(req: Request, res: Response, next: NextFunction) {
  const token = String(req.header('X-Admin-Token') || '');
  if (!token || token !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden' });
  next();
}

router.get('/gemini/status', ctrl.status);
router.post('/gemini/enable', checkAdminToken, ctrl.enable);
router.post('/gemini/disable', checkAdminToken, ctrl.disableFor);

export default router;
