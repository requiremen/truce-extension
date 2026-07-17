import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { classifyRouter } from './routes/classify.js';

dotenv.config();

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
