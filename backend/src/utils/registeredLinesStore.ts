import fs from 'fs/promises';
import path from 'path';

export interface RegisteredLineRecord {
  id: string;
  userId: number;
  serviceType: string;
  lineCard: string;
  createdAt: string;
  updatedAt: string;
}

type RegisteredLinesStoreFile = {
  lines: RegisteredLineRecord[];
};

const STORE_PATH = path.resolve(process.cwd(), 'data', 'registered-lines-store.json');

async function readStore(): Promise<RegisteredLinesStoreFile> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as RegisteredLinesStoreFile;
    return { lines: Array.isArray(parsed.lines) ? parsed.lines : [] };
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return { lines: [] };
    }
    throw error;
  }
}

async function writeStore(store: RegisteredLinesStoreFile) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function getRegisteredLinesByUser(userId: number): Promise<RegisteredLineRecord[]> {
  const store = await readStore();
  return store.lines.filter((line) => line.userId === userId);
}

export async function saveRegisteredLines(
  userId: number,
  lines: Array<{ serviceType: string; lineCard: string }>
): Promise<RegisteredLineRecord[]> {
  const store = await readStore();

  // Remove old lines for this user
  store.lines = store.lines.filter((line) => line.userId !== userId);

  // Add new lines
  const now = new Date().toISOString();
  const newLines: RegisteredLineRecord[] = lines.map((line, index) => ({
    id: `${userId}-${now.getTime()}-${index}`,
    userId,
    serviceType: line.serviceType,
    lineCard: line.lineCard,
    createdAt: now,
    updatedAt: now,
  }));

  store.lines.push(...newLines);
  await writeStore(store);

  return newLines;
}

export async function deleteRegisteredLinesByUser(userId: number): Promise<void> {
  const store = await readStore();
  store.lines = store.lines.filter((line) => line.userId !== userId);
  await writeStore(store);
}
