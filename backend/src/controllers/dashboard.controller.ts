import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get latest cash in hand for each service
    const servicesQuery = `
      SELECT DISTINCT ON (service_type) 
        service_type, 
        cash_in_hand,
        created_at
      FROM transactions 
      WHERE user_id = $1 
      ORDER BY service_type, created_at DESC
    `;

    const servicesResult = await pool.query(servicesQuery, [userId]);

    // Get total profit/loss
    const profitLossQuery = `
      SELECT 
        SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN transaction_type = 'withdraw' THEN amount ELSE 0 END) as total_withdrawals,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE user_id = $1
    `;

    const profitLossResult = await pool.query(profitLossQuery, [userId]);

    res.json({
      services: servicesResult.rows,
      summary: profitLossResult.rows[0]
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfitLossData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        DATE(created_at) as date,
        service_type,
        SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE -amount END) as daily_profit
      FROM transactions 
      WHERE user_id = $1 
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at), service_type
      ORDER BY date ASC
    `;

    const result = await pool.query(query, [userId]);

    // Aggregate by date for total profit/loss
    const aggregatedData = result.rows.reduce((acc: any, curr: any) => {
      const existingDate = acc.find((item: any) => item.date === curr.date);
      if (existingDate) {
        existingDate.profit += parseFloat(curr.daily_profit);
      } else {
        acc.push({
          date: curr.date,
          profit: parseFloat(curr.daily_profit)
        });
      }
      return acc;
    }, []);

    res.json({ profitLossData: aggregatedData, detailedData: result.rows });
  } catch (error) {
    console.error('Get profit/loss data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
