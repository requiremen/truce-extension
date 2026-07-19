import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch, { Headers, Request, Response } from 'node-fetch';

// Load .env FIRST — before any module that reads process.env
dotenv.config();

// Polyfill global fetch for Node 16 (required for Gemini SDK and Gmail API)
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

import { classifyRouter } from './routes/classify.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow Chrome extension origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow chrome-extension:// origins and localhost for dev
    if (!origin || origin.startsWith('chrome-extension://') || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Classification endpoint
app.use('/api', classifyRouter);

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`✨ MailSort AI backend running on http://localhost:${PORT}`);
});
