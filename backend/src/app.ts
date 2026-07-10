import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

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

const app = express();

// Security Headers
app.use(helmet());

// CORS config
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per IP
  message: { success: false, message: 'Too many requests from this IP, please try again later' },
});
app.use('/api/', apiLimiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morganMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routing Map
app.use('/api/auth', authRoutes);
app.use('/api/transactions', protect as any, transactionRoutes);
app.use('/api/budgets', protect as any, budgetRoutes);
app.use('/api/goals', protect as any, goalRoutes);
app.use('/api/investments', protect as any, investmentRoutes);
app.use('/api/analytics', protect as any, analyticsRoutes);
app.use('/api/ai', protect as any, aiRoutes);
app.use('/api/reports', reportRoutes); // pdf/excel report has inside route protecting, download is public

// 404 Route handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Requested backend API route not found' });
});

// Global Error Handler (must be last middleware)
app.use(errorHandler as any);

export default app;
