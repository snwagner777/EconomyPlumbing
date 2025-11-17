import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import fs from 'fs';

neonConfig.webSocketConstructor = ws;

// Get DATABASE_URL from either /tmp/replitdb (production) or environment variable (development)
function getDatabaseUrl(): string {
  // Check production database file first
  try {
    if (fs.existsSync('/tmp/replitdb')) {
      const url = fs.readFileSync('/tmp/replitdb', 'utf-8').trim();
      if (url) return url;
    }
  } catch (err) {
    // File doesn't exist or can't be read, fall back to env var
  }
  
  // Fall back to environment variable for development
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Lazy initialization to prevent database connection during module load
let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function initializeDatabase() {
  if (!_db) {
    const databaseUrl = getDatabaseUrl();
    _pool = new Pool({ connectionString: databaseUrl });
    _db = drizzle({ client: _pool, schema });
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
