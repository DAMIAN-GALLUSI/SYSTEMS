import fs from 'fs/promises';
import path from 'path';

export type LocalUserRole = 'owner' | 'employee';

export interface LocalUserRecord {
  id: number;
  email: string;
  password: string;
  full_name: string;
  role: LocalUserRole;
  created_at: string;
  updated_at: string;
}

type AuthStoreFile = {
  users: LocalUserRecord[];
};

const STORE_PATH = path.resolve(process.cwd(), 'data', 'auth-store.json');

async function readStore(): Promise<AuthStoreFile> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    if (raw.trim().length === 0) {
      return { users: [] };
    }

    const parsed = JSON.parse(raw) as AuthStoreFile;
    return { users: Array.isArray(parsed.users) ? parsed.users : [] };
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return { users: [] };
    }

    if (error instanceof SyntaxError) {
      return { users: [] };
    }

    throw error;
  }
}

async function writeStore(store: AuthStoreFile) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function findLocalUserByEmail(email: string) {
  const store = await readStore();
  return store.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function updateLocalUserPasswordByEmail(email: string, hashedPassword: string) {
  const store = await readStore();
  const targetIndex = store.users.findIndex((user) => user.email.toLowerCase() === email.toLowerCase());

  if (targetIndex === -1) {
    return null;
  }

  const now = new Date().toISOString();
  store.users[targetIndex] = {
    ...store.users[targetIndex],
    password: hashedPassword,
    updated_at: now,
  };

  await writeStore(store);
  return store.users[targetIndex];
}

export async function createLocalUser(input: {
  email: string;
  hashedPassword: string;
  fullName: string;
  role: LocalUserRole;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const nextId = store.users.length > 0 ? Math.max(...store.users.map((user) => user.id)) + 1 : 1;

  const user: LocalUserRecord = {
    id: nextId,
    email: input.email,
    password: input.hashedPassword,
    full_name: input.fullName,
    role: input.role,
    created_at: now,
    updated_at: now,
  };

  store.users.push(user);
  await writeStore(store);

  return user;
}

export async function getAllLocalUsers() {
  const store = await readStore();
  return store.users;
}
