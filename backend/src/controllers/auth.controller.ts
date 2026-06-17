import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { createLocalUser, findLocalUserByEmail, updateLocalUserPasswordByEmail } from '../utils/authStore';
import { sendPasswordResetEmail } from '../utils/mailer';

const DB_ERROR_CODES = new Set(['28P01', '42P01', 'ECONNREFUSED', 'ENOTFOUND']);
const RESET_TOKEN_TTL = '1h';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const isDatabaseFallbackError = (error: any) => {
  return DB_ERROR_CODES.has(error?.code) || /password authentication failed|relation .* does not exist|connect ECONNREFUSED/i.test(error?.message || '');
};

const buildToken = (payload: { id: number; email: string; role: string }) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

const buildResetToken = (payload: { email: string }) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: RESET_TOKEN_TTL });
};

const verifyResetToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'secret') as { email: string };
};

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, role } = req.body;

    try {
      // Check if user exists in PostgreSQL
      const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await pool.query(
        'INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
        [email, hashedPassword, fullName, role]
      );

      const createdUser = newUser.rows[0];
      const token = buildToken({ id: createdUser.id, email: createdUser.email, role: createdUser.role });

      return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: createdUser
      });
    } catch (dbError: any) {
      if (!isDatabaseFallbackError(dbError)) {
        throw dbError;
      }

      console.warn('Database unavailable for register, using local auth store.');

      const existingUser = await findLocalUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const createdUser = await createLocalUser({
        email,
        hashedPassword,
        fullName,
        role,
      });

      const token = buildToken({ id: createdUser.id, email: createdUser.email, role: createdUser.role });

      return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          full_name: createdUser.full_name,
          role: createdUser.role,
        }
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user in PostgreSQL
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = buildToken({ id: user.id, email: user.email, role: user.role });

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role
        }
      });
    } catch (dbError: any) {
      if (!isDatabaseFallbackError(dbError)) {
        throw dbError;
      }

      console.warn('Database unavailable for login, using local auth store.');

      const user = await findLocalUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = buildToken({ id: user.id, email: user.email, role: user.role });

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
      [req.user?.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      const result = await pool.query('SELECT id, email, full_name FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (user) {
        const token = buildResetToken({ email: user.email });
        const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
        const delivery = await sendPasswordResetEmail({
          to: user.email,
          fullName: user.full_name,
          resetLink,
        });

        return res.json({
          message: 'If that email exists, a password reset link has been sent.',
          resetLink: delivery.fallback ? resetLink : undefined,
        });
      }

      return res.json({ message: 'If that email exists, a password reset link has been sent.' });
    } catch (dbError: any) {
      if (!isDatabaseFallbackError(dbError)) {
        throw dbError;
      }

      console.warn('Database unavailable for forgot password, using local auth store.');
      const user = await findLocalUserByEmail(email);

      if (user) {
        const token = buildResetToken({ email: user.email });
        const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
        const delivery = await sendPasswordResetEmail({
          to: user.email,
          fullName: user.full_name,
          resetLink,
        });

        return res.json({
          message: 'If that email exists, a password reset link has been sent.',
          resetLink: delivery.fallback ? resetLink : undefined,
        });
      }

      return res.json({ message: 'If that email exists, a password reset link has been sent.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    const decoded = verifyResetToken(token);
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [decoded.email]);
      if (existingUser.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2', [hashedPassword, decoded.email]);

      return res.json({ message: 'Password updated successfully' });
    } catch (dbError: any) {
      if (!isDatabaseFallbackError(dbError)) {
        throw dbError;
      }

      console.warn('Database unavailable for reset password, using local auth store.');
      const updatedUser = await updateLocalUserPasswordByEmail(decoded.email, hashedPassword);

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({ message: 'Password updated successfully' });
    }
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
    }

    if (error?.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid reset link. Please request a new one.' });
    }

    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
