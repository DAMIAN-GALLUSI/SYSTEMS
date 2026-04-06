import { Router } from 'express';
import { createTransaction, getTransactions, getTransactionsByService } from '../controllers/transaction.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, createTransaction);

router.get('/', authenticateToken, getTransactions);

router.get('/service/:serviceType', authenticateToken, getTransactionsByService);

export default router;
