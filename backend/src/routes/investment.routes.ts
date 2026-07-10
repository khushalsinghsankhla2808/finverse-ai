import { Router } from 'express';
import {
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
} from '../controllers/investment.controller';
import protect from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import { investmentSchema } from '../utils/validation';

const router = Router();

router.use(protect as any);

router.get('/', getInvestments as any);
router.post('/', validate(investmentSchema), createInvestment as any);
router.put('/:id', validate(investmentSchema), updateInvestment as any);
router.delete('/:id', deleteInvestment as any);

export default router;
