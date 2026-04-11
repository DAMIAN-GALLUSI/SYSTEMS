import { Response } from 'express';
import { validationResult } from 'express-validator';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { createLocalTransaction } from '../utils/transactionStore';

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

const VALID_TRANSACTION_TYPES = new Set(['deposit', 'withdraw', 'transfer']);

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      serviceType,
      amount,
      transactionType,
      cashInHand,
      description,
      entries,
      placeOfConsumption,
      totalCashOut,
      dailyConsumption,
      notes,
      saveBatchId,
    } = req.body;

    // New payload mode: record user-selected service line/cards with one shared cash-out value.
    if (Array.isArray(entries)) {
      if (entries.length < 1) {
        return res.status(400).json({ message: 'At least one line/card entry is required' });
      }

      const normalizedTransactionType = VALID_TRANSACTION_TYPES.has(transactionType)
        ? transactionType
        : 'withdraw';

      const parsedTotalCashOut = Number(totalCashOut);
      const parsedCashInHand = Number(cashInHand);
      const parsedDailyConsumption = Number(dailyConsumption);
      const safeTotalCashOut = Number.isNaN(parsedTotalCashOut) || parsedTotalCashOut < 0 ? 0 : parsedTotalCashOut;
      const safeCashInHand = Number.isNaN(parsedCashInHand) || parsedCashInHand < 0 ? 0 : parsedCashInHand;
      const safeDailyConsumption = Number.isNaN(parsedDailyConsumption) || parsedDailyConsumption < 0 ? 0 : parsedDailyConsumption;
      const safePlaceOfConsumption = typeof placeOfConsumption === 'string' ? placeOfConsumption : '';
      const safeSaveBatchId = typeof saveBatchId === 'string' ? saveBatchId : '';
      const hasEntryAmounts = entries.some((entry: any) => entry && entry.amount !== undefined && entry.amount !== null && entry.amount !== '');

      const createdTransactions = [];

      try {
        for (let index = 0; index < entries.length; index += 1) {
          const entry = entries[index];
          if (!entry || typeof entry !== 'object') {
            return res.status(400).json({ message: 'Invalid entry format' });
          }

          const entryServiceType = entry.serviceType;
          const lineCard = entry.lineCard;

          if (!VALID_SERVICE_TYPES.has(entryServiceType)) {
            return res.status(400).json({ message: `Invalid service type: ${entryServiceType}` });
          }

          if (!lineCard || typeof lineCard !== 'string') {
            return res.status(400).json({ message: 'Each entry must include a line/card value' });
          }

          let amountForRow = 0;

          if (hasEntryAmounts) {
            const parsedEntryAmount = Number(entry.amount);
            if (Number.isNaN(parsedEntryAmount) || parsedEntryAmount < 0) {
              return res.status(400).json({ message: 'Each entry must include a valid non-negative amount' });
            }
            amountForRow = parsedEntryAmount;
          } else {
            // Backward compatibility with previous shared-total payload.
            amountForRow = index === 0 ? safeTotalCashOut : 0;
          }

          const metadata = {
            lineCard,
            placeOfConsumption: safePlaceOfConsumption,
            totalCashOut: safeTotalCashOut,
            dailyConsumption: safeDailyConsumption,
            notes: typeof notes === 'string' ? notes : '',
            saveBatchId: safeSaveBatchId,
            mode: 'daily-balancing-entry',
            hasEntryAmounts,
            isPrimaryAmountRow: !hasEntryAmounts && index === 0,
          };

          const result = await pool.query(
            `INSERT INTO transactions (user_id, service_type, amount, transaction_type, cash_in_hand, description)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
              userId,
              entryServiceType,
              amountForRow,
              normalizedTransactionType,
              safeCashInHand,
              JSON.stringify(metadata),
            ]
          );

          createdTransactions.push(result.rows[0]);
        }

        return res.status(201).json({
          message: 'Batch transactions created successfully',
          count: createdTransactions.length,
          transactions: createdTransactions,
        });
      } catch (dbError: any) {
        if (!isDatabaseFallbackError(dbError)) {
          throw dbError;
        }

        console.warn('Database unavailable for transaction creation, using local transaction store.');

        // Fallback to local storage
        const localCreatedTransactions = [];
        for (let index = 0; index < entries.length; index += 1) {
          const entry = entries[index];
          const entryServiceType = entry.serviceType;
          let amountForRow = 0;

          if (hasEntryAmounts) {
            amountForRow = Number(entry.amount);
          } else {
            amountForRow = index === 0 ? safeTotalCashOut : 0;
          }

          const localTransaction = await createLocalTransaction({
            userId,
            serviceType: entryServiceType,
            amount: amountForRow,
            transactionType: normalizedTransactionType,
            cashInHand: safeCashInHand,
            description: JSON.stringify({
              lineCard: entry.lineCard,
              placeOfConsumption: safePlaceOfConsumption,
              totalCashOut: safeTotalCashOut,
              dailyConsumption: safeDailyConsumption,
              notes: typeof notes === 'string' ? notes : '',
              saveBatchId: safeSaveBatchId,
              mode: 'daily-balancing-entry',
              hasEntryAmounts,
              isPrimaryAmountRow: !hasEntryAmounts && index === 0,
            }),
          });

          localCreatedTransactions.push(localTransaction);
        }

        return res.status(201).json({
          message: 'Batch transactions created successfully (saved locally)',
          count: localCreatedTransactions.length,
          transactions: localCreatedTransactions,
        });
      }
    }

    // Legacy payload mode: single transaction entry.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!VALID_SERVICE_TYPES.has(serviceType)) {
      return res.status(400).json({ message: 'Invalid service type' });
    }

    if (!VALID_TRANSACTION_TYPES.has(transactionType)) {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }

    if (Number.isNaN(Number(amount)) || Number.isNaN(Number(cashInHand))) {
      return res.status(400).json({ message: 'Amount and cash in hand must be numeric values' });
    }

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
