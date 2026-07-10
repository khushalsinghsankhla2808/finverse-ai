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
import { transactionSchema, transactionQuerySchema, bulkDeleteSchema } from '../schemas/transaction.schema';
import { idParamSchema } from '../schemas/common.schema';

const router = Router();

router.use(protect as any);

router.get('/', validate({ query: transactionQuerySchema }), getTransactions as any);
router.post('/', validate(transactionSchema), createTransaction as any);
router.get('/summary/month', getMonthSummary as any);
router.delete('/bulk', validate(bulkDeleteSchema), deleteBulkTransactions as any);

router.get('/:id', validate({ params: idParamSchema }), getTransactionById as any);
router.put('/:id', validate({ params: idParamSchema, body: transactionSchema }), updateTransaction as any);
router.delete('/:id', validate({ params: idParamSchema }), deleteTransaction as any);

export default router;
