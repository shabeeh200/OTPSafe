// // types.ts
// export interface AnalyzeRequest {
//   message: string;
//   sender?: string;
//   country?: string;
// }

// export interface TriggeredRule {
//   name: string;
//   weight: number;
//   reason: string;
// }

// export interface AnalyzeResponse {
//   isScam: boolean;
//   confidence: number;
//   reasons: string[];
//   suggestedAction: string[];
//   triggeredRules: TriggeredRule[];
//   redacted: string;
//   llmExplanation?: string; // Optional field for AI explanation
//   source: 'rules' | 'llm' | 'cache'; // NEW: Track where result came from
// }
// src/types.ts

// ==================== REQUEST ====================
// What the client MUST send to the API
export interface AnalyzeSmsRequest {
  message: string;       // Required: The SMS text to analyze
  sender?: string;       // Optional: The sender's number/identifier
  country?: string;      // Optional: Defaults to 'PK'
}

// ==================== RESPONSE ====================
// What the API will ALWAYS return to the client
export interface AnalyzeSmsResponse {
  isScam: boolean;           // Final verdict
  confidence: number;        // Confidence score (0-1)
  reasons: string[];         // List of reasons for the verdict
  suggestedAction: string[]; // Recommended actions for the user
  triggeredRules: TriggeredRule[]; // Details on which rules fired
  redacted: string;          // The PII-redacted version of the message
  llmExplanation?: string;   // Optional: AI-generated insight
  source: 'rules' | 'llm';   // What generated the verdict
}

// Sub-type for the rule details
export interface TriggeredRule {
  name: string;
  weight: number;
  reason: string;
}

// ==================== ERROR ====================
// Standardized error response format
export interface ApiErrorResponse {
  error: string;
  details?: string; // Additional info for debugging in development
}

// Type Guard for better error handling
export function isAnalyzeSmsRequest(body: any): body is AnalyzeSmsRequest {
  return body && typeof body.message === 'string';
}