import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { setupAuth } from '../server/auth';
import { db } from '@db';
import { articles, restaurants, users, newsletters } from '@db/schema';
import { eq } from 'drizzle-orm';
import session from 'express-session';

const app = express();

// Configure session for serverless environment
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Setup authentication after session
setupAuth(app);

// Express middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error' });
  next(err);
});

// API routes with proper error handling
app.get('/api/articles', async (_req, res) => {
  try {
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
    res.json(allArticles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/restaurants', async (_req, res) => {
  try {
    const allRestaurants = await db.query.restaurants.findMany({
      where: eq(restaurants.status, 'published')
    });
    res.json(allRestaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User endpoint
app.get('/api/user', (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(req.user);
  } catch (error) {
    console.error('Error in user endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle all API routes with improved error handling
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return new Promise((resolve, reject) => {
    app(req, res, (err: any) => {
      if (err) {
        console.error('API Handler Error:', err);
        res.status(500).json({ error: 'Internal server error' });
        return reject(err);
      }
      resolve(undefined);
    });
  });
}