import { Router } from 'express';
import { generateReport, downloadReportFile } from '../controllers/report.controller';
import protect from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import { reportSchema } from '../utils/validation';

const router = Router();

// Public download endpoint for direct browser tab redirections
router.get('/download/:filename', downloadReportFile);

// Protected report generation
router.post('/generate', protect as any, validate(reportSchema), generateReport as any);

export default router;
