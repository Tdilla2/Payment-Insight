import { Pool } from 'pg';
import { getConfig } from './config.js';

let pool: Pool | null = null;

async function getPool(): Promise<Pool> {
  if (pool) return pool;
  const cfg = await getConfig();
  pool = new Pool({
    host: cfg.DB_HOST,
    port: cfg.DB_PORT,
    database: cfg.DB_NAME,
    user: cfg.DB_USER,
    password: cfg.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }, // RDS managed cert
    max: 2,
    idleTimeoutMillis: 30000,
  });
  return pool;
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const p = await getPool();
  const res = await p.query(text, params);
  return res.rows as T[];
}

export async function one<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
