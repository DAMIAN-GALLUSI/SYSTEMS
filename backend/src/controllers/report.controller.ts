import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, serviceType } = req.query;

    let query = `
      SELECT 
        t.id,
        t.service_type,
        t.amount,
        t.transaction_type,
        t.cash_in_hand,
        t.description,
        t.created_at,
        u.full_name as employee_name
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (startDate) {
      params.push(startDate);
      query += ` AND t.created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND t.created_at <= $${params.length}`;
    }

    if (serviceType) {
      params.push(serviceType);
      query += ` AND t.service_type = $${params.length}`;
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);

    // Calculate summary
    const totalDeposits = result.rows
      .filter((t: any) => t.transaction_type === 'deposit')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
    const totalWithdrawals = result.rows
      .filter((t: any) => t.transaction_type === 'withdraw')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const summary = {
      totalTransactions: result.rows.length,
      totalDeposits,
      totalWithdrawals,
      netProfit: totalDeposits - totalWithdrawals,
    };

    res.json({
      transactions: result.rows,
      summary,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const downloadReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, serviceType } = req.query;

    let query = `
      SELECT 
        t.id,
        t.service_type,
        t.amount,
        t.transaction_type,
        t.cash_in_hand,
        t.description,
        t.created_at,
        u.full_name as employee_name
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (startDate) {
      params.push(startDate);
      query += ` AND t.created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND t.created_at <= $${params.length}`;
    }

    if (serviceType) {
      params.push(serviceType);
      query += ` AND t.service_type = $${params.length}`;
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);

    // Generate CSV
    const headers = ['ID', 'Service Type', 'Amount', 'Type', 'Cash in Hand', 'Description', 'Employee', 'Date'];
    const csvRows = [headers.join(',')];

    result.rows.forEach((row: any) => {
      const values = [
        row.id,
        row.service_type,
        row.amount,
        row.transaction_type,
        row.cash_in_hand,
        row.description || '',
        row.employee_name,
        new Date(row.created_at).toLocaleString()
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
