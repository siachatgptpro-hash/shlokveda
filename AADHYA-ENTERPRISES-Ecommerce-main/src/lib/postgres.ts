import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const globalForPostgres = globalThis as typeof globalThis & { sholkvedaPostgresPool?: Pool };

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function assertDatabaseConfiguredForProduction(): void {
  const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build';
  if (process.env.NODE_ENV === 'production' && !isProductionBuild && !isPostgresConfigured()) {
    throw new Error('DATABASE_URL must be configured before running the production storefront.');
  }
}

export function getPostgresPool(): Pool {
  if (!isPostgresConfigured()) throw new Error('DATABASE_URL is not configured.');
  if (!globalForPostgres.sholkvedaPostgresPool) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.PG_POOL_MAX || 2),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: true } : undefined,
    });
    pool.on('error', (error) => {
      const pgError = error as NodeJS.ErrnoException;
      console.error('[PostgreSQL pool error]', pgError.code || pgError.name || 'unknown error');
    });
    globalForPostgres.sholkvedaPostgresPool = pool;
  }
  return globalForPostgres.sholkvedaPostgresPool;
}

export async function pgQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> {
  return getPostgresPool().query<T>(text, values as never[]);
}

export async function withPostgresTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPostgresPool().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}
