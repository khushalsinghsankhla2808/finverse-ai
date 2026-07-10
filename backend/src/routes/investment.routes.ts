import { Router } from 'express';
import {
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
} from '../controllers/investment.controller';
import protect from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import { investmentSchema } from '../schemas/investment.schema';
import { idParamSchema } from '../schemas/common.schema';

const router = Router();

router.use(protect as any);

router.get('/', getInvestments as any);
router.post('/', validate(investmentSchema), createInvestment as any);
router.put('/:id', validate({ params: idParamSchema, body: investmentSchema }), updateInvestment as any);
router.delete('/:id', validate({ params: idParamSchema }), deleteInvestment as any);

export default router;
