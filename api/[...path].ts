import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { setupAuth } from '../server/auth';
import { db } from '@db';
import { articles, restaurants, users, newsletters } from '@db/schema';

const app = express();
setupAuth(app);

// Express middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.get('/api/articles', async (_req, res) => {
  const allArticles = await db.query.articles.findMany({
    with: {
      author: true,
      restaurants: true,
    },
  });
  res.json(allArticles);
});

app.get('/api/restaurants', async (_req, res) => {
  const allRestaurants = await db.query.restaurants.findMany();
  res.json(allRestaurants);
});

// Handle all API routes
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Forward the request to Express
  return new Promise((resolve, reject) => {
    app(req, res, (err: any) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
