import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/auth.controller';
import protect from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../utils/validation';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', protect as any, logout as any);
router.get('/me', protect as any, me as any);

export default router;
