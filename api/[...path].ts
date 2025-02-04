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

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    code: err.code
  });
  res.status(500).json({
    error: 'Internal server error',
    details: err instanceof Error ? err.message : 'Unknown error'
  });
  next(err);
});

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
      details: error instanceof Error ? error.message : 'Unknown error',
      path: '/api/articles'
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
      details: error instanceof Error ? error.message : 'Unknown error',
      path: '/api/restaurants'
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
      details: error instanceof Error ? error.message : 'Unknown error',
      path: '/api/user'
    });
  }
});

// Handle all API routes with improved error handling
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test database connection
    console.log('Testing database connection...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Environment variables check:');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Not set');

    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Database connection test failed');
    }

    return new Promise((resolve, reject) => {
      console.log(`API request received: ${req.method} ${req.url}`);
      app(req, res, (err: any) => {
        if (err) {
          console.error('API Handler Error:', err);
          res.status(500).json({ 
            error: 'Internal server error', 
            details: err instanceof Error ? err.message : 'Unknown error',
            path: req.url
          });
          return reject(err);
        }
        resolve(undefined);
      });
    });
  } catch (error) {
    console.error('Request handler error:', error);
    return res.status(500).json({ 
      error: 'Server initialization failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasSessionSecret: !!process.env.SESSION_SECRET
      }
    });
  }
}
