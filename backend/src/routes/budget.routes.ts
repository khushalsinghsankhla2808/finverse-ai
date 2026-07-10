import { Router } from 'express';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  resetBudgetSpent,
} from '../controllers/budget.controller';
import protect from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import { budgetSchema } from '../schemas/budget.schema';
import { idParamSchema } from '../schemas/common.schema';

const router = Router();

router.use(protect as any);

router.get('/', getBudgets as any);
router.post('/', validate(budgetSchema), createBudget as any);
router.put('/:id', validate({ params: idParamSchema, body: budgetSchema }), updateBudget as any);
router.delete('/:id', validate({ params: idParamSchema }), deleteBudget as any);
router.post('/:id/reset', validate({ params: idParamSchema }), resetBudgetSpent as any);

export default router;
