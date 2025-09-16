// src/controllers/adminController.ts
import { Request, Response } from 'express';
import { getGeminiDisabledUntil, forceEnableGemini, disableGeminiForMinutes, isGeminiDisabled } from '../controllers/services/geminiService'

export const status = (req: Request, res: Response) => {
  res.json({
    disabledUntil: getGeminiDisabledUntil(),
    disabled: isGeminiDisabled(),
    now: Date.now()
  });
};

export const enable = (req: Request, res: Response) => {
  forceEnableGemini();
  res.json({ ok: true });
};

export const disableFor = (req: Request, res: Response) => {
  const mins = Number(req.query.m || req.body?.minutes || process.env.GEMINI_DISABLE_MINUTES || 5);
  disableGeminiForMinutes(mins);
  res.json({ ok: true, disabledForMinutes: mins });
};
