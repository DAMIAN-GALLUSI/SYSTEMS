import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').notEmpty(),
    body('role').isIn(['owner', 'employee'])
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  login
);

router.post(
  '/forgot-password',
  [
    body('email').isEmail()
  ],
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 })
  ],
  resetPassword
);

router.get('/profile', authenticateToken, getProfile);

export default router;
