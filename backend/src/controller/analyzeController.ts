// src/controller/analyzeController.ts
import { Request, Response } from 'express';
import { isAnalyzeSmsRequest } from '../types';
import { analyzeRequest } from '../services/analysisService';

export const analyzeSmsHandler = async (req: Request, res: Response) => {
  if (!isAnalyzeSmsRequest(req.body)) {
    res.status(400).json({ error: 'Invalid request. "message" required.' });
    return;
  }

  try {
    const result = await analyzeRequest(req.body);
    res.json(result);
  } catch (err: any) {
    console.error('analyzeSmsHandler error', err);
    res.status(500).json(process.env.NODE_ENV === 'development' ? { error: err.message } : { error: 'Server Error' });
  }
};
