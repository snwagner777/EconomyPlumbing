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

const databaseUrl = getDatabaseUrl();
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
