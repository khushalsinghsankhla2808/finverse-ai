import { Router } from 'express';
import { generateReport, downloadReportFile } from '../controllers/report.controller';
import protect from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import { reportSchema, downloadFilenameSchema } from '../schemas/report.schema';

const router = Router();

// Public download endpoint — validated with strict filename schema to prevent path traversal
router.get('/download/:filename', validate({ params: downloadFilenameSchema }), downloadReportFile);

// Protected report generation
router.post('/generate', protect as any, validate(reportSchema), generateReport as any);

export default router;
