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
import { goalSchema, addMoneySchema } from '../schemas/goal.schema';
import { idParamSchema } from '../schemas/common.schema';

const router = Router();

router.use(protect as any);

router.get('/', getGoals as any);
router.post('/', validate(goalSchema), createGoal as any);
router.put('/:id', validate({ params: idParamSchema, body: goalSchema }), updateGoal as any);
router.delete('/:id', validate({ params: idParamSchema }), deleteGoal as any);
router.post('/:id/add-money', validate({ params: idParamSchema, body: addMoneySchema }), addMoneyToGoal as any);

export default router;
