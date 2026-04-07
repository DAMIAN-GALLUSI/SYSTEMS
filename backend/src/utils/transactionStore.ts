import fs from 'fs/promises';
import path from 'path';

export interface LocalTransactionRecord {
  id: number;
  user_id: number;
  service_type: string;
  amount: number;
  transaction_type: string;
  cash_in_hand: number;
  description?: string;
  created_at: string;
}

type TransactionStoreFile = {
  transactions: LocalTransactionRecord[];
};

const STORE_PATH = path.resolve(process.cwd(), 'data', 'transactions-store.json');

async function readStore(): Promise<TransactionStoreFile> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as TransactionStoreFile;
    return { transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [] };
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return { transactions: [] };
    }

    throw error;
  }
}

async function writeStore(store: TransactionStoreFile) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function createLocalTransaction(input: {
  userId: number;
  serviceType: string;
  amount: number;
  transactionType: string;
  cashInHand: number;
  description?: string;
}): Promise<LocalTransactionRecord> {
  const store = await readStore();
  const now = new Date().toISOString();
  const nextId = store.transactions.length > 0 ? Math.max(...store.transactions.map((t) => t.id)) + 1 : 1;

  const transaction: LocalTransactionRecord = {
    id: nextId,
    user_id: input.userId,
    service_type: input.serviceType,
    amount: input.amount,
    transaction_type: input.transactionType,
    cash_in_hand: input.cashInHand,
    description: input.description,
    created_at: now,
  };

  store.transactions.push(transaction);
  await writeStore(store);

  return transaction;
}

export async function getLocalTransactionsByUser(userId: number): Promise<LocalTransactionRecord[]> {
  const store = await readStore();
  return store.transactions.filter((t) => t.user_id === userId);
}

export async function getAllLocalTransactions(): Promise<LocalTransactionRecord[]> {
  const store = await readStore();
  return store.transactions;
}
