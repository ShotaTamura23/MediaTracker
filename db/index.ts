import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema';

// Configure WebSocket for Neon database
neonConfig.webSocketConstructor = ws;

// Validate database URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in the environment variables. Check your Vercel project settings.');
}

// Create a new pool for serverless environment
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000, // 5 seconds
  max: 1, // Limit connections for serverless
  ssl: {
    rejectUnauthorized: true,
    // Supabaseの場合、追加のSSL設定は不要
  }
});

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Add connection logging
pool.on('connect', () => {
  console.log('New database connection established');
});

pool.on('acquire', () => {
  console.log('Connection acquired from pool');
});

pool.on('remove', () => {
  console.log('Connection removed from pool');
});

// Initialize Drizzle with the pool
export const db = drizzle(pool, { schema });

// Export pool for potential direct usage
export { pool };

// Utility function to check database connection
export async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}