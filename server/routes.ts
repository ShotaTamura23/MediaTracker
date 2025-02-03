import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { articles, bookmarks, newsletters, restaurants, article_restaurants } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Articles
  app.get("/api/articles", async (req, res) => {
    const allArticles = await db.query.articles.findMany({
      with: {
        author: true,
        restaurants: {
          with: {
            restaurant: true,
          },
        },
      },
      orderBy: desc(articles.createdAt),
    });

    // Transform the response to include restaurants directly
    const transformedArticles = allArticles.map(article => ({
      ...article,
      restaurants: article.restaurants
        .sort((a, b) => a.order - b.order)
        .map(ar => ({
          ...ar.restaurant,
          description: ar.description,
          order: ar.order,
        })),
    }));

    res.json(transformedArticles);
  });

  // Get article by ID (新規追加)
  app.get("/api/articles/id/:id", async (req, res) => {
    const [article] = await db.query.articles.findMany({
      where: eq(articles.id, parseInt(req.params.id)),
      with: {
        author: true,
        restaurants: {
          with: {
            restaurant: true,
          },
        },
      },
    });

    if (!article) return res.sendStatus(404);

    // Transform the response
    const transformedArticle = {
      ...article,
      restaurants: article.restaurants
        .sort((a, b) => a.order - b.order)
        .map(ar => ({
          ...ar.restaurant,
          description: ar.description,
          order: ar.order,
        })),
    };

    res.json(transformedArticle);
  });

  app.get("/api/articles/:slug", async (req, res) => {
    const [article] = await db.query.articles.findMany({
      where: eq(articles.slug, req.params.slug),
      with: {
        author: true,
        restaurants: {
          with: {
            restaurant: true,
          },
        },
      },
    });

    if (!article) return res.sendStatus(404);

    // Transform the response
    const transformedArticle = {
      ...article,
      restaurants: article.restaurants
        .sort((a, b) => a.order - b.order)
        .map(ar => ({
          ...ar.restaurant,
          description: ar.description,
          order: ar.order,
        })),
    };

    res.json(transformedArticle);
  });

  // Admin-only routes for article management
  app.post("/api/articles", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(403);

    const { restaurants: articleRestaurants, ...articleData } = req.body;

    // Begin transaction
    const article = await db.transaction(async (tx) => {
      // Insert article
      const [newArticle] = await tx.insert(articles)
        .values({
          ...articleData,
          authorId: req.user.id,
        })
        .returning();

      // Insert restaurant relations if any
      if (articleRestaurants && articleRestaurants.length > 0) {
        await tx.insert(article_restaurants)
          .values(
            articleRestaurants.map((r: any) => ({
              articleId: newArticle.id,
              restaurantId: r.id,
              order: r.order,
              description: r.description,
            }))
          );
      }

      return newArticle;
    });

    res.status(201).json(article);
  });

  app.patch("/api/articles/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(403);

    const { restaurants: articleRestaurants, ...articleData } = req.body;
    const articleId = parseInt(req.params.id);

    // Add logging to debug the update
    console.log('Updating article:', articleId);
    console.log('Article data:', articleData);

    const article = await db.transaction(async (tx) => {
      // Update article
      const [updatedArticle] = await tx.update(articles)
        .set({
          ...articleData,
          updatedAt: new Date(), // 更新日時を明示的に設定
        })
        .where(eq(articles.id, articleId))
        .returning();

      if (!updatedArticle) return null;

      // Delete existing restaurant relations
      await tx.delete(article_restaurants)
        .where(eq(article_restaurants.articleId, articleId));

      // Insert new restaurant relations if any
      if (articleRestaurants && articleRestaurants.length > 0) {
        await tx.insert(article_restaurants)
          .values(
            articleRestaurants.map((r: any) => ({
              articleId: updatedArticle.id,
              restaurantId: r.id,
              order: r.order,
              description: r.description,
            }))
          );
      }

      return updatedArticle;
    });

    if (!article) return res.sendStatus(404);

    // Add logging to debug the response
    console.log('Updated article:', article);
    res.json(article);
  });


  app.delete("/api/articles/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(403);
    const [article] = await db.delete(articles)
      .where(eq(articles.id, parseInt(req.params.id)))
      .returning();
    if (!article) return res.sendStatus(404);
    res.sendStatus(200);
  });

  // Restaurants
  app.get("/api/restaurants", async (req, res) => {
    const allRestaurants = await db.select().from(restaurants);
    res.json(allRestaurants);
  });

  // Get only published restaurants
  app.get("/api/restaurants/published", async (req, res) => {
    const publishedRestaurants = await db.select()
      .from(restaurants)
      .where(eq(restaurants.status, "published"));
    res.json(publishedRestaurants);
  });

  // Create restaurant
  app.post("/api/restaurants", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(403);
    const restaurant = await db.insert(restaurants).values(req.body).returning();
    res.status(201).json(restaurant[0]);
  });

  // Update restaurant
  app.patch("/api/restaurants/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(403);
    const [restaurant] = await db.update(restaurants)
      .set(req.body)
      .where(eq(restaurants.id, parseInt(req.params.id)))
      .returning();
    if (!restaurant) return res.sendStatus(404);
    res.json(restaurant);
  });

  // Update restaurant status
  app.patch("/api/restaurants/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(403);
    const [restaurant] = await db.update(restaurants)
      .set({ status: req.body.status })
      .where(eq(restaurants.id, parseInt(req.params.id)))
      .returning();
    if (!restaurant) return res.sendStatus(404);
    res.json(restaurant);
  });

  // Bookmarks
  app.get("/api/bookmarks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userBookmarks = await db.query.bookmarks.findMany({
      where: eq(bookmarks.userId, req.user.id),
      with: { article: true },
    });
    res.json(userBookmarks);
  });

  app.post("/api/bookmarks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const bookmark = await db.insert(bookmarks).values({
      userId: req.user.id,
      articleId: req.body.articleId,
    }).returning();
    res.status(201).json(bookmark[0]);
  });

  app.delete("/api/bookmarks/:articleId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await db.delete(bookmarks).where(
      and(
        eq(bookmarks.userId, req.user.id),
        eq(bookmarks.articleId, parseInt(req.params.articleId))
      )
    );
    res.sendStatus(200);
  });

  // Newsletter
  app.post("/api/newsletter", async (req, res) => {
    const [subscription] = await db.insert(newsletters)
      .values({ email: req.body.email })
      .returning();
    res.status(201).json(subscription);
  });

  const httpServer = createServer(app);
  return httpServer;
}