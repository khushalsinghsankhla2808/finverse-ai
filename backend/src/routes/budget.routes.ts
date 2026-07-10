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
import { budgetSchema } from '../utils/validation';

const router = Router();

router.use(protect as any);

router.get('/', getBudgets as any);
router.post('/', validate(budgetSchema), createBudget as any);
router.put('/:id', validate(budgetSchema), updateBudget as any);
router.delete('/:id', deleteBudget as any);
router.post('/:id/reset', resetBudgetSpent as any);

export default router;
