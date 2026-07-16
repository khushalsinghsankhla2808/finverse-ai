import { Router } from 'express';
import {
  syncUser,
  logout,
  me,
  updateProfile,
  deleteAccount,
} from '../controllers/auth.controller';
import protect from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import {
  updateProfileSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/sync', syncUser as any);
router.post('/logout', protect as any, logout as any);
router.get('/me', protect as any, me as any);

// Profile & account management
router.put('/profile', protect as any, validate(updateProfileSchema), updateProfile as any);
router.delete('/account', protect as any, deleteAccount as any);

export default router;
