import { Router } from 'express';
import {
  getDashboardMetrics,
  getSpendingBreakdown,
  getTrends,
  getMonthlyComparison,
  getCashFlow,
} from '../controllers/analytics.controller';
import protect from '../middleware/auth.middleware';

const router = Router();

router.use(protect as any);

router.get('/dashboard', getDashboardMetrics as any);
router.get('/spending', getSpendingBreakdown as any);
router.get('/trends', getTrends as any);
router.get('/monthly', getMonthlyComparison as any);
router.get('/cashflow', getCashFlow as any);

export default router;
