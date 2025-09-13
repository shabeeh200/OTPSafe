"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSmsHandler = void 0;
const types_1 = require("../types");
const analysisService_1 = require("../services/analysisService");
const analyzeSmsHandler = async (req, res) => {
    if (!(0, types_1.isAnalyzeSmsRequest)(req.body)) {
        res.status(400).json({ error: 'Invalid request. "message" required.' });
        return;
    }
    try {
        const result = await (0, analysisService_1.analyzeRequest)(req.body);
        res.json(result);
    }
    catch (err) {
        console.error('analyzeSmsHandler error', err);
        res.status(500).json(process.env.NODE_ENV === 'development' ? { error: err.message } : { error: 'Server Error' });
    }
};
exports.analyzeSmsHandler = analyzeSmsHandler;
//# sourceMappingURL=analyzeController.js.map