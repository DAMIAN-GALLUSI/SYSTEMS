import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { getLocalTransactionsByUser } from '../utils/transactionStore';

type DashboardTransaction = {
  id: number;
  user_id: number;
  service_type: string;
  amount: number | string;
  transaction_type: string;
  cash_in_hand: number | string;
  description?: string;
  created_at: string;
};

type DailySnapshot = {
  date: string;
  circulatingTotal: number;
  profitOrLoss: number;
};

const DB_ERROR_CODES = new Set(['28P01', '42P01', 'ECONNREFUSED', 'ENOTFOUND']);

const isDatabaseFallbackError = (error: any) => {
  return DB_ERROR_CODES.has(error?.code) || /password authentication failed|relation .* does not exist|connect ECONNREFUSED/i.test(error?.message || '');
};

const parseNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getDayKey = (value: string) => new Date(value).toISOString().slice(0, 10);

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

const getTransactionsByUser = async (userId: number): Promise<DashboardTransaction[]> => {
  try {
    const result = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    return result.rows as DashboardTransaction[];
  } catch (error: any) {
    if (!isDatabaseFallbackError(error)) {
      throw error;
    }

    const localTransactions = await getLocalTransactionsByUser(userId);
    return localTransactions as DashboardTransaction[];
  }
};

const buildDailySnapshots = (transactions: DashboardTransaction[]): DailySnapshot[] => {
  const batchesByDay = new Map<
    string,
    Map<string, { latestCreatedAt: string; cashInHand: number; amountSum: number }>
  >();

  for (const transaction of transactions) {
    const dayKey = getDayKey(transaction.created_at);
    const metadata = parseDescription(transaction.description);
    const metadataMode = metadata?.mode;

    // Prefer daily balancing rows; skip unrelated legacy transactions for trend precision.
    if (metadataMode !== 'daily-balancing-entry') {
      continue;
    }

    const batchId = typeof metadata?.saveBatchId === 'string' && metadata.saveBatchId.trim().length > 0
      ? metadata.saveBatchId
      : `${dayKey}-${transaction.created_at}`;

    if (!batchesByDay.has(dayKey)) {
      batchesByDay.set(dayKey, new Map());
    }

    const dayMap = batchesByDay.get(dayKey)!;
    const existing = dayMap.get(batchId);
    const nextCash = parseNumber(transaction.cash_in_hand);
    const nextAmount = parseNumber(transaction.amount);

    if (!existing) {
      dayMap.set(batchId, {
        latestCreatedAt: transaction.created_at,
        cashInHand: nextCash,
        amountSum: nextAmount,
      });
      continue;
    }

    dayMap.set(batchId, {
      latestCreatedAt: new Date(transaction.created_at) > new Date(existing.latestCreatedAt)
        ? transaction.created_at
        : existing.latestCreatedAt,
      cashInHand: Math.max(existing.cashInHand, nextCash),
      amountSum: existing.amountSum + nextAmount,
    });
  }

  const dayRecords = Array.from(batchesByDay.entries())
    .map(([date, batches]) => {
      const latestBatch = Array.from(batches.values()).sort(
        (a, b) => new Date(a.latestCreatedAt).getTime() - new Date(b.latestCreatedAt).getTime()
      ).pop();

      if (!latestBatch) {
        return null;
      }

      return {
        date,
        circulatingTotal: latestBatch.cashInHand + latestBatch.amountSum,
      };
    })
    .filter((entry): entry is { date: string; circulatingTotal: number } => Boolean(entry))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return dayRecords.map((entry, index) => {
    const previous = index > 0 ? dayRecords[index - 1] : null;
    const profitOrLoss = previous ? entry.circulatingTotal - previous.circulatingTotal : 0;

    return {
      date: entry.date,
      circulatingTotal: entry.circulatingTotal,
      profitOrLoss,
    };
  });
};

const getLatestServices = (transactions: DashboardTransaction[]) => {
  const latestByService = new Map<string, DashboardTransaction>();

  for (const transaction of transactions) {
    const existing = latestByService.get(transaction.service_type);
    if (!existing || new Date(transaction.created_at) > new Date(existing.created_at)) {
      latestByService.set(transaction.service_type, transaction);
    }
  }

  return Array.from(latestByService.values()).map((transaction) => ({
    service_type: transaction.service_type,
    cash_in_hand: parseNumber(transaction.cash_in_hand),
    created_at: transaction.created_at,
  }));
};

export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const transactions = await getTransactionsByUser(userId);
    const services = getLatestServices(transactions);
    const dailySnapshots = buildDailySnapshots(transactions);
    const latestSnapshot = dailySnapshots.length > 0 ? dailySnapshots[dailySnapshots.length - 1] : null;
    const previousSnapshot = dailySnapshots.length > 1 ? dailySnapshots[dailySnapshots.length - 2] : null;

    const totalCirculating = latestSnapshot
      ? latestSnapshot.circulatingTotal
      : services.reduce((sum, service) => sum + parseNumber(service.cash_in_hand), 0);

    const currentProfitLoss = latestSnapshot && previousSnapshot
      ? latestSnapshot.circulatingTotal - previousSnapshot.circulatingTotal
      : 0;

    res.json({
      services,
      summary: {
        total_circulating: totalCirculating,
        current_profit_loss: currentProfitLoss,
        previous_total: previousSnapshot?.circulatingTotal || 0,
        total_transactions: transactions.length,
      }
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfitLossData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const parsedDays = Number(req.query.days);
    const days = Number.isNaN(parsedDays) || parsedDays < 1 ? 30 : parsedDays;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const transactions = await getTransactionsByUser(userId);
    const snapshots = buildDailySnapshots(transactions);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const profitLossData = snapshots
      .filter((snapshot) => {
        const snapshotDate = new Date(snapshot.date);
        return snapshotDate >= start && snapshotDate <= today;
      })
      .map((snapshot) => ({
        date: snapshot.date,
        profit: snapshot.profitOrLoss,
        circulatingTotal: snapshot.circulatingTotal,
      }));

    res.json({ profitLossData });
  } catch (error) {
    console.error('Get profit/loss data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
