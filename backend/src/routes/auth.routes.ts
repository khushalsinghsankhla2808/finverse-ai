import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/auth.controller';
import protect from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import { registerSchema, loginSchema, refreshSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', protect as any, logout as any);
router.get('/me', protect as any, me as any);

export default router;
