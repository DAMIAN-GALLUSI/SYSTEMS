import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { getAllLocalUsers } from '../utils/authStore';
import { getAllLocalTransactions } from '../utils/transactionStore';

const DB_ERROR_CODES = new Set(['28P01', '42P01', 'ECONNREFUSED', 'ENOTFOUND']);

const isDatabaseFallbackError = (error: any) => {
  return DB_ERROR_CODES.has(error?.code) || /password authentication failed|relation .* does not exist|connect ECONNREFUSED/i.test(error?.message || '');
};

const parseDate = (value: any) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseDescription = (description?: string) => {
  if (!description) {
    return null;
  }

  try {
    const parsed = JSON.parse(description);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const parseNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getDailyBalancingCirculation = (rows: any[]) => {
  if (rows.length < 1) {
    return 0;
  }

  const sortedRows = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const cashInHand = parseNumber(sortedRows[0].cash_in_hand);
  const lineAmountsTotal = sortedRows.reduce((sum: number, row: any) => sum + parseNumber(row.amount), 0);

  return cashInHand + lineAmountsTotal;
};

const getDailyBalancingProfit = (rows: any[]) => {
  const dailyRows = rows.filter((row) => parseDescription(row.description)?.mode === 'daily-balancing-entry');

  if (dailyRows.length < 1) {
    return null;
  }

  const dayTotals = new Map<string, any[]>();

  dailyRows.forEach((row) => {
    const dayKey = new Date(row.created_at).toISOString().slice(0, 10);
    const current = dayTotals.get(dayKey) || [];
    current.push(row);
    dayTotals.set(dayKey, current);
  });

  const orderedDays = Array.from(dayTotals.entries())
    .map(([dayKey, dayRows]) => {
      const sortedRows = [...dayRows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return {
        dayKey,
        circulation: getDailyBalancingCirculation(sortedRows),
      };
    })
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  if (orderedDays.length < 2) {
    return 0;
  }

  const latest = orderedDays[orderedDays.length - 1];
  const previous = orderedDays[orderedDays.length - 2];

  return latest.circulation - previous.circulation;
};

const buildSummary = (rows: any[]) => {
  const totalDeposits = rows
    .filter((t: any) => t.transaction_type === 'deposit')
    .reduce((sum: number, t: any) => sum + parseFloat(String(t.amount)), 0);
  const totalWithdrawals = rows
    .filter((t: any) => t.transaction_type === 'withdraw')
    .reduce((sum: number, t: any) => sum + parseFloat(String(t.amount)), 0);

  const dailyBalancingProfit = getDailyBalancingProfit(rows);

  return {
    totalTransactions: rows.length,
    totalDeposits,
    totalWithdrawals,
    netProfit: dailyBalancingProfit !== null ? dailyBalancingProfit : totalDeposits - totalWithdrawals,
  };
};

const getReportRows = async (req: AuthRequest) => {
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

  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (dbError: any) {
    if (!isDatabaseFallbackError(dbError)) {
      throw dbError;
    }

    console.warn('Database unavailable for reports, using local transaction store.');

    const [localUsers, localTransactions] = await Promise.all([
      getAllLocalUsers(),
      getAllLocalTransactions(),
    ]);

    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const service = typeof serviceType === 'string' ? serviceType : '';

    const userById = new Map(localUsers.map((user) => [user.id, user]));

    const filtered = localTransactions.filter((transaction) => {
      const createdAt = new Date(transaction.created_at);

      if (start && createdAt < start) {
        return false;
      }

      if (end && createdAt > end) {
        return false;
      }

      if (service && transaction.service_type !== service) {
        return false;
      }

      return true;
    });

    const rows = filtered
      .map((transaction) => {
        const user = userById.get(transaction.user_id);
        return {
          id: transaction.id,
          service_type: transaction.service_type,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          cash_in_hand: transaction.cash_in_hand,
          description: transaction.description,
          created_at: transaction.created_at,
          employee_name: user?.full_name || 'Unknown Employee',
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return rows;
  }
};

export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const rows = await getReportRows(req);
    const summary = buildSummary(rows);

    res.json({
      transactions: rows,
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
    const rows = await getReportRows(req);

    // Generate CSV
    const headers = ['ID', 'Service Type', 'Amount', 'Type', 'Cash in Hand', 'Description', 'Employee', 'Date'];
    const csvRows = [headers.join(',')];

    rows.forEach((row: any) => {
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
