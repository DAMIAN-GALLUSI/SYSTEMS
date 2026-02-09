import { Router } from 'express';
import { generateReport, downloadReport } from '../controllers/report.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/generate', authenticateToken, authorizeRole('owner'), generateReport);

router.get('/download', authenticateToken, authorizeRole('owner'), downloadReport);

export default router;
