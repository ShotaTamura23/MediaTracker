import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { setupAuth } from '../server/auth';
import { db, checkDatabaseConnection } from '@db';
import { articles, restaurants, users, newsletters } from '@db/schema';
import { eq } from 'drizzle-orm';
import session from 'express-session';

const app = express();

// Configure session for serverless environment
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-secret',
  name: 'sessionId',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Express middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup authentication after session
setupAuth(app);

// API routes with proper error handling
app.get('/api/articles', async (_req, res) => {
  try {
    console.log('Fetching articles...');
    const allArticles = await db.query.articles.findMany({
      with: {
        author: true,
        restaurants: {
          with: {
            restaurant: true
          }
        }
      },
    });
    console.log('Articles fetched successfully:', allArticles.length);
    res.json(allArticles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

app.get('/api/restaurants', async (_req, res) => {
  try {
    console.log('Fetching restaurants...');
    const allRestaurants = await db.query.restaurants.findMany({
      where: eq(restaurants.status, 'published')
    });
    console.log('Restaurants fetched successfully:', allRestaurants.length);
    res.json(allRestaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// User endpoint with improved error handling
app.get('/api/user', (req, res) => {
  try {
    console.log('Checking user authentication...');
    if (!req.isAuthenticated()) {
      console.log('User not authenticated');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    console.log('User authenticated successfully');
    res.json(req.user);
  } catch (error) {
    console.error('Error in user endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Handle all API routes with improved error handling
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test database connection
    console.log('Testing database connection...');
    console.log('Environment variables check:');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
    console.log('- SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Set' : 'Not set');

    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Database connection test failed');
    }
  } catch (error) {
    console.error('Database connection test failed:', error);
    return res.status(500).json({ 
      error: 'Database connection failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_KEY
      }
    });
  }

  return new Promise((resolve, reject) => {
    console.log(`API request received: ${req.method} ${req.url}`);
    app(req, res, (err: any) => {
      if (err) {
        console.error('API Handler Error:', err);
        res.status(500).json({ 
          error: 'Internal server error', 
          details: err instanceof Error ? err.message : 'Unknown error' 
        });
        return reject(err);
      }
      resolve(undefined);
    });
  });
}