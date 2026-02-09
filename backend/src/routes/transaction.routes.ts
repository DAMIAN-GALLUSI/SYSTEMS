import { Router } from 'express';
import { body } from 'express-validator';
import { createTransaction, getTransactions, getTransactionsByService } from '../controllers/transaction.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/',
  authenticateToken,
  [
    body('serviceType').notEmpty(),
    body('amount').isNumeric(),
    body('transactionType').isIn(['deposit', 'withdraw', 'transfer']),
    body('cashInHand').isNumeric()
  ],
  createTransaction
);

router.get('/', authenticateToken, getTransactions);

router.get('/service/:serviceType', authenticateToken, getTransactionsByService);

export default router;
