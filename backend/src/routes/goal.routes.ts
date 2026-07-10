import { Router } from 'express';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addMoneyToGoal,
} from '../controllers/goal.controller';
import protect from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import { goalSchema, addMoneySchema } from '../utils/validation';

const router = Router();

router.use(protect as any);

router.get('/', getGoals as any);
router.post('/', validate(goalSchema), createGoal as any);
router.put('/:id', validate(goalSchema), updateGoal as any);
router.delete('/:id', deleteGoal as any);
router.post('/:id/add-money', validate(addMoneySchema), addMoneyToGoal as any);

export default router;
