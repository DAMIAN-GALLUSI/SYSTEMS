import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.middleware';
import { getRegisteredLines, saveRegisteredLinesHandler } from '../controllers/registered-lines.controller';

const router = Router();

router.get('/', authenticateToken, getRegisteredLines);

router.post(
  '/',
  authenticateToken,
  [
    body('lines').isArray().notEmpty().withMessage('Lines must be a non-empty array'),
    body('lines.*.serviceType').notEmpty().withMessage('Service type is required'),
    body('lines.*.lineCard').notEmpty().withMessage('Line/card is required'),
  ],
  saveRegisteredLinesHandler
);

export default router;
