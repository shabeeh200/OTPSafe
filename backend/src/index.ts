import * as express from 'express';
import { Request, Response } from 'express';
import * as dotenv from "dotenv";
import { analyzeSmsHandler } from './controller/analyzerController';

// Load environment variables
dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json());

// Routes
app.post('/api/analyze-sms', analyzeSmsHandler);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Export for testing (if needed)
export default app;