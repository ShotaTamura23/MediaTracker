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

    // Always ensure content is properly parsed
    let parsedContent;
    try {
      parsedContent = typeof article.content === 'string'
        ? JSON.parse(article.content)
        : article.content;
    } catch (error) {
      console.error('Error parsing article content:', error);
      parsedContent = { type: "doc", content: [] };
    }

    const transformedArticle = {
      ...article,
      content: parsedContent,
      restaurants: article.restaurants
        .sort((a, b) => a.order - b.order)
        .map(ar => ({
          ...ar.restaurant,
          description: ar.description,
          order: ar.order,
        })),
    };

    console.log('Retrieved article content structure:', JSON.stringify(transformedArticle.content, null, 2));
    res.json(transformedArticle);
  });

  app.post("/api/articles", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(403);

    try {
      const { restaurants: articleRestaurants, ...articleData } = req.body;

      // Begin transaction
      const article = await db.transaction(async (tx) => {
        // Insert article
        const [newArticle] = await tx.insert(articles)
          .values({
            ...articleData,
            authorId: req.user.id,
            content: typeof articleData.content === 'string'
              ? articleData.content
              : JSON.stringify(articleData.content),
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

      console.log('Created article with content:', article.content);
      res.status(201).json(article);
    } catch (error: any) {
      console.error('Error creating article:', error);

      if (error.code === '23505') {
        res.status(400).json({
          message: 'このスラッグは既に使用されています。別のスラッグを指定してください。',
          code: 'DUPLICATE_SLUG'
        });
      } else {
        res.status(500).json({
          message: '記事の作成中にエラーが発生しました。',
          error: error.message
        });
      }
    }
  });

  app.patch("/api/articles/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(403);

    const { restaurants: articleRestaurants, ...articleData } = req.body;
    const articleId = parseInt(req.params.id);

    try {
      console.log('Received article update data:', JSON.stringify(articleData.content, null, 2));

      const article = await db.transaction(async (tx) => {
        // Ensure content is properly stringified
        let contentToSave;
        try {
          contentToSave = typeof articleData.content === 'string'
            ? articleData.content
            : JSON.stringify(articleData.content);
        } catch (error) {
          console.error('Error stringifying content:', error);
          contentToSave = JSON.stringify({ type: "doc", content: [] });
        }

        console.log('Saving article with content:', contentToSave);

        // Update article
        const [updatedArticle] = await tx.update(articles)
          .set({
            ...articleData,
            content: contentToSave,
            updatedAt: new Date(),
          })
          .where(eq(articles.id, articleId))
          .returning();

        if (!updatedArticle) {
          throw new Error('Article not found');
        }

        // Handle restaurant relations
        await tx.delete(article_restaurants)
          .where(eq(article_restaurants.articleId, articleId));

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

        // Parse content before returning
        let parsedContent;
        try {
          parsedContent = typeof updatedArticle.content === 'string'
            ? JSON.parse(updatedArticle.content)
            : updatedArticle.content;
        } catch (error) {
          console.error('Error parsing updated content:', error);
          parsedContent = { type: "doc", content: [] };
        }

        return {
          ...updatedArticle,
          content: parsedContent
        };
      });

      console.log('Successfully updated article, returning:', JSON.stringify(article.content, null, 2));
      res.json(article);
    } catch (error: any) {
      console.error('Error updating article:', error);
      if (error.code === '23505') {
        res.status(400).json({
          message: 'このスラッグは既に使用されています。別のスラッグを指定してください。',
          code: 'DUPLICATE_SLUG'
        });
      } else {
        res.status(500).json({
          message: '記事の更新中にエラーが発生しました。',
          error: error.message
        });
      }
    }
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
      content: typeof article.content === 'string'
        ? JSON.parse(article.content)
        : article.content,
      restaurants: article.restaurants
        .sort((a, b) => a.order - b.order)
        .map(ar => ({
          ...ar.restaurant,
          description: ar.description,
          order: ar.order,
        })),
    };

    console.log('Retrieved article with content:', transformedArticle.content);
    res.json(transformedArticle);
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