import { Router } from 'express';
import { generateReport, downloadReport } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/generate', authenticateToken, generateReport);

router.get('/download', authenticateToken, downloadReport);

export default router;
