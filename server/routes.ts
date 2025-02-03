import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { articles, bookmarks, newsletters, restaurants } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Articles
  app.get("/api/articles", async (req, res) => {
    const allArticles = await db.query.articles.findMany({
      with: { author: true },
      orderBy: desc(articles.createdAt),
    });
    res.json(allArticles);
  });

  app.get("/api/articles/:slug", async (req, res) => {
    const [article] = await db.query.articles.findMany({
      where: eq(articles.slug, req.params.slug),
      with: { author: true },
    });
    if (!article) return res.sendStatus(404);
    res.json(article);
  });

  // Admin-only routes for article management
  app.post("/api/articles", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(403);
    const article = await db.insert(articles).values({
      ...req.body,
      authorId: req.user.id,
    }).returning();
    res.status(201).json(article[0]);
  });

  app.patch("/api/articles/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(403);
    const [article] = await db.update(articles)
      .set(req.body)
      .where(eq(articles.id, parseInt(req.params.id)))
      .returning();
    if (!article) return res.sendStatus(404);
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