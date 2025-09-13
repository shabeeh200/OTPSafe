"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const analyzeController_1 = require("./controller/analyzeController");
dotenv.config();
const app = (0, express_1.default)();
const port = Number(process.env.PORT || 3000);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express_1.default.json({ limit: '20kb' }));
app.use((0, morgan_1.default)('combined'));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 30),
    message: { error: 'Too many requests, slow down.' }
});
app.use('/api/', limiter);
app.post('/api/analyze-sms', analyzeController_1.analyzeSmsHandler);
app.get('/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
// centralized error handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json(process.env.NODE_ENV === 'development' ? { error: err?.message ?? 'Server Error' } : { error: 'Server Error' });
});
app.listen(port, () => console.log(`Server listening on :${port}`));
exports.default = app;
//# sourceMappingURL=index.js.map