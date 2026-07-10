import { Router } from 'express';
import {
  chatWithAI,
  getChatHistory,
  clearChatHistory,
  getAutoInsights,
  getAISuggestions,
} from '../controllers/ai.controller';
import protect from '../middleware/auth.middleware';

const router = Router();

router.get('/suggestions', getAISuggestions as any);

router.use(protect as any);

router.post('/chat', chatWithAI as any);
router.get('/history', getChatHistory as any);
router.delete('/history', clearChatHistory as any);
router.get('/insights', getAutoInsights as any);

export default router;
