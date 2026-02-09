import { Response } from 'express';
import { validationResult } from 'express-validator';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { serviceType, amount, transactionType, cashInHand, description } = req.body;
    const userId = req.user?.id;

    const result = await pool.query(
      `INSERT INTO transactions (user_id, service_type, amount, transaction_type, cash_in_hand, description) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, serviceType, amount, transactionType, cashInHand, description]
    );

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: result.rows[0]
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, serviceType } = req.query;

    let query = 'SELECT * FROM transactions WHERE user_id = $1';
    const params: any[] = [userId];

    if (startDate) {
      params.push(startDate);
      query += ` AND created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND created_at <= $${params.length}`;
    }

    if (serviceType) {
      params.push(serviceType);
      query += ` AND service_type = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTransactionsByService = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceType } = req.params;
    const userId = req.user?.id;

    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 AND service_type = $2 ORDER BY created_at DESC',
      [userId, serviceType]
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get transactions by service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
