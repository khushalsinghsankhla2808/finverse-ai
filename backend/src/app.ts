import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import budgetRoutes from './routes/budget.routes';
import goalRoutes from './routes/goal.routes';
import investmentRoutes from './routes/investment.routes';
import analyticsRoutes from './routes/analytics.routes';
import aiRoutes from './routes/ai.routes';
import reportRoutes from './routes/report.routes';

import protect from './middleware/auth.middleware';
import errorHandler from './middleware/error.middleware';
import { morganMiddleware } from './middleware/logger.middleware';
import {
  authIpLimiter,
  authAccountLimiter,
  authenticatedLimiter,
  globalLimiter,
} from './middleware/rateLimiter.middleware';

const app = express();

// Security Headers
app.use(helmet());

// CORS config
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin} not in allowed list`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

console.log('✅ CORS allowed origins:', allowedOrigins);

// Global Rate Limiting — generous safety net across all /api/* routes
// Tier-specific limits (auth, public, authenticated) do the real work.
app.use('/api/v1/', globalLimiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morganMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ─── Routing Map ─────────────────────────────────────────────────────

// Auth routes — Tier 1: dual-axis per-IP + per-account with exponential backoff
app.use('/api/v1/auth', authIpLimiter, authAccountLimiter, authRoutes);

// Authenticated routes — Tier 3: per-userId (200 req/min)
app.use('/api/v1/transactions', protect as any, authenticatedLimiter, transactionRoutes);
app.use('/api/v1/budgets', protect as any, authenticatedLimiter, budgetRoutes);
app.use('/api/v1/goals', protect as any, authenticatedLimiter, goalRoutes);
app.use('/api/v1/investments', protect as any, authenticatedLimiter, investmentRoutes);
app.use('/api/v1/analytics', protect as any, authenticatedLimiter, analyticsRoutes);
app.use('/api/v1/ai', aiRoutes); // has mixed public/protected routes — limiters applied per-route inside
app.use('/api/v1/reports', reportRoutes); // has mixed public/protected routes — limiters applied per-route inside

// 404 Route handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Requested backend API route not found' });
});

// Global Error Handler (must be last middleware)
app.use(errorHandler as any);

export default app;
