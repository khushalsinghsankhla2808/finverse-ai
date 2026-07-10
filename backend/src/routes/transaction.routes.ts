import { Router } from 'express';
import {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  deleteBulkTransactions,
  getMonthSummary,
} from '../controllers/transaction.controller';
import protect from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import { transactionSchema } from '../utils/validation';

const router = Router();

router.use(protect as any);

router.get('/', getTransactions as any);
router.post('/', validate(transactionSchema), createTransaction as any);
router.get('/summary/month', getMonthSummary as any);
router.delete('/bulk', deleteBulkTransactions as any);

router.get('/:id', getTransactionById as any);
router.put('/:id', validate(transactionSchema), updateTransaction as any);
router.delete('/:id', deleteTransaction as any);

export default router;
