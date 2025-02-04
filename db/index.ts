import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema';

// Configure WebSocket for database
neonConfig.webSocketConstructor = ws;

// Validate database URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in the environment variables');
}

// Create a new pool optimized for serverless
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 1,
  ssl: true
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

pool.on('acquire', (client: any) => {
  console.log('Connection acquired from pool:', client?.processID);
});

pool.on('remove', (client: any) => {
  console.log('Connection removed from pool:', client?.processID);
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
    const result = await client.query('SELECT NOW()');
    console.log('Database query successful:', result.rows[0]);
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}