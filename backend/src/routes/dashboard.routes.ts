import { Router } from 'express';
import { getDashboardData, getProfitLossData } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/data', authenticateToken, getDashboardData);

router.get('/profit-loss', authenticateToken, getProfitLossData);

export default router;
