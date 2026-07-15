import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/auth.controller';
import protect from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', protect as any, logout as any);
router.get('/me', protect as any, me as any);

// Profile & account management
router.put('/profile', protect as any, validate(updateProfileSchema), updateProfile as any);
router.put('/password', protect as any, validate(changePasswordSchema), changePassword as any);
router.delete('/account', protect as any, deleteAccount as any);

export default router;
