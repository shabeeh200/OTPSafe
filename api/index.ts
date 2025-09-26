// api/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../backend/src/index'; // <- adjust path if backend is in a different folder

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Forward request to the express app
  return app(req as any, res as any);
}
