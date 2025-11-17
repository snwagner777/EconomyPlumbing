import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Get DATABASE_URL from environment variable
function getDatabaseUrl(): string {
  console.log('[DB Init] getDatabaseUrl called');
  
  if (process.env.DATABASE_URL) {
    console.log('[DB Init] Using DATABASE_URL from environment variable');
    return process.env.DATABASE_URL;
  }
  
  console.error('[DB Init] FATAL: DATABASE_URL environment variable not set');
  throw new Error(
    "DATABASE_URL environment variable must be set. Please configure it in your deployment secrets.",
  );
}

// Lazy initialization to prevent database connection during module load
let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function initializeDatabase() {
  if (!_db) {
    try {
      console.log('[DB Init] Starting database initialization...');
      const databaseUrl = getDatabaseUrl();
      console.log('[DB Init] Got database URL, creating pool...');
      _pool = new Pool({ connectionString: databaseUrl });
      console.log('[DB Init] Pool created, initializing drizzle...');
      _db = drizzle({ client: _pool, schema });
      console.log('[DB Init] Database initialized successfully');
    } catch (error) {
      console.error('[DB Init] FATAL ERROR during initialization:', error);
      console.error('[DB Init] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[DB Init] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }
  return { pool: _pool!, db: _db! };
}

// Export getters that initialize on first call
export function getPool(): Pool {
  return initializeDatabase().pool;
}

export function getDb() {
  return initializeDatabase().db;
}

// Backward compatibility: export db that works with existing code
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop, receiver) {
    const database = initializeDatabase().db;
    const value = (database as any)[prop];
    if (typeof value === 'function') {
      return value.bind(database);
    }
    return value;
  }
});

export const pool = new Proxy({} as Pool, {
  get(target, prop, receiver) {
    const poolInstance = initializeDatabase().pool;
    const value = (poolInstance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(poolInstance);
    }
    return value;
  }
});
