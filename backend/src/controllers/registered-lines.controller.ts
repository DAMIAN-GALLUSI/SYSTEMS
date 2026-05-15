import { Response } from 'express';
import { validationResult } from 'express-validator';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { getRegisteredLinesByUser, saveRegisteredLines } from '../utils/registeredLinesStore';

const DB_ERROR_CODES = new Set(['28P01', '42P01', 'ECONNREFUSED', 'ENOTFOUND']);

const isDatabaseFallbackError = (error: any) => {
  return DB_ERROR_CODES.has(error?.code) || /password authentication failed|relation .* does not exist|connect ECONNREFUSED/i.test(error?.message || '');
};

const VALID_SERVICE_TYPES = new Set([
  'vodacom',
  'airtel',
  'tigo',
  'halotel',
  'lipa_namba_vodacom',
  'lipa_namba_airtel',
  'lipa_namba_tigo',
  'lipa_namba_halotel',
]);

export const getRegisteredLines = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Try PostgreSQL first
      const result = await pool.query(
        'SELECT id, user_id, service_type, line_card, created_at, updated_at FROM registered_lines WHERE user_id = $1 ORDER BY created_at ASC',
        [userId]
      );

      const lines = result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        serviceType: row.service_type,
        lineCard: row.line_card,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return res.status(200).json({ lines });
    } catch (dbError: any) {
      if (!isDatabaseFallbackError(dbError)) {
        throw dbError;
      }

      console.warn('Database unavailable for getRegisteredLines, using local store.');
      const lines = await getRegisteredLinesByUser(userId);
      return res.status(200).json({ lines });
    }
  } catch (error) {
    console.error('Error fetching registered lines:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const saveRegisteredLinesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { lines } = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: 'At least one registered line is required' });
    }

    // Validate each line
    for (const line of lines) {
      if (!line.serviceType || !line.lineCard) {
        return res.status(400).json({ message: 'Each line must have serviceType and lineCard' });
      }
      if (!VALID_SERVICE_TYPES.has(line.serviceType)) {
        return res.status(400).json({ message: `Invalid service type: ${line.serviceType}` });
      }
    }

    try {
      // Try PostgreSQL first
      // Delete existing lines for this user
      await pool.query('DELETE FROM registered_lines WHERE user_id = $1', [userId]);

      // Insert new lines
      const now = new Date().toISOString();
      const insertedLines = [];

      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const result = await pool.query(
          'INSERT INTO registered_lines (user_id, service_type, line_card, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, service_type, line_card, created_at, updated_at',
          [userId, line.serviceType, line.lineCard, now, now]
        );

        insertedLines.push({
          id: result.rows[0].id,
          userId: result.rows[0].user_id,
          serviceType: result.rows[0].service_type,
          lineCard: result.rows[0].line_card,
          createdAt: result.rows[0].created_at,
          updatedAt: result.rows[0].updated_at,
        });
      }

      return res.status(201).json({
        message: 'Registered lines saved successfully',
        lines: insertedLines,
      });
    } catch (dbError: any) {
      if (!isDatabaseFallbackError(dbError)) {
        throw dbError;
      }

      console.warn('Database unavailable for saveRegisteredLines, using local store.');
      const savedLines = await saveRegisteredLines(
        userId,
        lines.map((line) => ({ serviceType: line.serviceType, lineCard: line.lineCard }))
      );

      return res.status(201).json({
        message: 'Registered lines saved successfully',
        lines: savedLines,
      });
    }
  } catch (error) {
    console.error('Error saving registered lines:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
