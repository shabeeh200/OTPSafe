"use strict";
// // types.ts
// export interface AnalyzeRequest {
//   message: string;
//   sender?: string;
//   country?: string;
// }
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAnalyzeSmsRequest = isAnalyzeSmsRequest;
// Type Guard for better error handling
function isAnalyzeSmsRequest(body) {
    return body && typeof body.message === 'string';
}
//# sourceMappingURL=types.js.map