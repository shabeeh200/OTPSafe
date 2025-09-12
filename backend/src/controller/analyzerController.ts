// src/controllers/analyzeController.ts
import { Request, Response } from 'express';
import { analyzeSms, redactPII } from './logic/ruleEngine';
import { AnalyzeSmsRequest, AnalyzeSmsResponse, ApiErrorResponse, isAnalyzeSmsRequest } from '../types';

export const analyzeSmsHandler = async (req: Request, res: Response<AnalyzeSmsResponse | ApiErrorResponse>): Promise<void> => {
  try {
    // 1. VALIDATE INPUT USING TYPE GUARD
    if (!isAnalyzeSmsRequest(req.body)) {
      res.status(400).json({ error: 'Invalid request. "message" field of type string is required.' });
      return; // Explicitly return after sending response
    }

    // 2. DESTRUCTURE WITH DEFAULTS (TypeScript knows the shape now)
    const { message, sender, country = 'PK' }: AnalyzeSmsRequest = req.body;

    // 3. RUN THE RULE ENGINE
    const ruleResult = analyzeSms({ message, sender: sender ?? '', country });

    // 4. DECIDE TO USE GEMINI BASED ON CONFIDENCE
    const geminiConfidenceThreshold = 0.8;

    if (ruleResult.confidence >= geminiConfidenceThreshold) {
      // High confidence - Return rule result immediately
      const response: AnalyzeSmsResponse = {
        ...ruleResult,
        source: 'rules'
      };
      res.json(response);
      return;
    }

    // 5. LOW CONFIDENCE - CALL GEMINI FOR ENHANCEMENT
    // Safety First: Redact PII before sending anywhere
    const redactedMessage = redactPII(message);

    // TODO: REPLACE WITH REAL GEMINI API CALL
    // const aiResponse = await aiModel.generateContent(prompt);
    const mockGeminiExplanation = "This message exhibits characteristics of a common phishing attempt in Pakistan, using urgency and brand impersonation to solicit sensitive information like OTPs.";

    // 6. COMBINE RESULTS
    const finalResult: AnalyzeSmsResponse = {
      ...ruleResult,
      llmExplanation: mockGeminiExplanation,
      source: 'llm'
    };

    res.json(finalResult);

  } catch (error) {
    // 7. PROPER ERROR HANDLING
    console.error('AnalyzeSms Error:', error);

    // Check if it's a known error type
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during analysis.';

    const errorResponse: ApiErrorResponse =
      process.env.NODE_ENV === 'development'
        ? { error: 'Internal Server Error', details: errorMessage }
        : { error: 'Internal Server Error' };

    res.status(500).json(errorResponse);
  }
};