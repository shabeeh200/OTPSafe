// src/controllers/analyzeController.ts
import express from 'express';
import { Request, Response } from 'express';
import { isAnalyzeSmsRequest, AnalyzeSmsRequest, AnalyzeSmsResponse, ApiErrorResponse } from '../types';
import { analyzeRequest } from './services/analysisService';

export const analyzeSmsHandler = async (req: Request, res: Response<AnalyzeSmsResponse | ApiErrorResponse>): Promise<void> => {
  if (!isAnalyzeSmsRequest(req.body)) {
    res.status(400).json({ error: 'Invalid request. "message" field of type string is required.' });
    return;
  }

  const payload: AnalyzeSmsRequest = req.body;

  try {
    const result = await analyzeRequest(payload); // single call to service
    res.json(result);
  } catch (err: any) {
    console.error('analyzeSmsHandler error', err);
    const msg = err instanceof Error ? err.message : 'Server error';
    const response: ApiErrorResponse = process.env.NODE_ENV === 'development'
      ? { error: 'Internal Server Error', details: msg }
      : { error: 'Internal Server Error' };
    res.status(500).json(response);
  }
};
