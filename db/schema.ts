import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  content: jsonb("content").notNull(),
  excerpt: text("excerpt").notNull(),
  coverImage: text("cover_image").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  published: boolean("published").default(false).notNull(),
  type: text("type", { enum: ["review", "list"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  cuisine_type: text("cuisine_type", { 
    enum: ["washoku", "sushi", "ramen", "izakaya", "other"] 
  }).notNull(),
  price_range: text("price_range", { 
    enum: ["budget", "moderate", "expensive", "luxury"] 
  }).notNull(),
  status: text("status", {
    enum: ["published", "unpublished", "draft", "deleted"]
  }).default("draft").notNull(),
  website: text("website"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const article_restaurants = pgTable("article_restaurants", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  order: integer("order").default(0).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  confirmed: boolean("confirmed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  restaurants: many(article_restaurants),
}));

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  articles: many(article_restaurants),
}));

export const articleRestaurantsRelations = relations(article_restaurants, ({ one }) => ({
  article: one(articles, {
    fields: [article_restaurants.articleId],
    references: [articles.id],
  }),
  restaurant: one(restaurants, {
    fields: [article_restaurants.restaurantId],
    references: [restaurants.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [bookmarks.articleId],
    references: [articles.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertArticleSchema = createInsertSchema(articles);
export const selectArticleSchema = createSelectSchema(articles);

export const insertRestaurantSchema = createInsertSchema(restaurants);
export const selectRestaurantSchema = createSelectSchema(restaurants);

export const insertArticleRestaurantSchema = createInsertSchema(article_restaurants);
export const selectArticleRestaurantSchema = createSelectSchema(article_restaurants);

export const insertBookmarkSchema = createInsertSchema(bookmarks);
export const selectBookmarkSchema = createSelectSchema(bookmarks);

export const insertNewsletterSchema = createInsertSchema(newsletters);
export const selectNewsletterSchema = createSelectSchema(newsletters);

// Types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;
export type SelectArticle = typeof articles.$inferSelect;
export type InsertRestaurant = typeof restaurants.$inferInsert;
export type SelectRestaurant = typeof restaurants.$inferSelect;
export type InsertArticleRestaurant = typeof article_restaurants.$inferInsert;
export type SelectArticleRestaurant = typeof article_restaurants.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;
export type SelectBookmark = typeof bookmarks.$inferSelect;
export type InsertNewsletter = typeof newsletters.$inferInsert;
export type SelectNewsletter = typeof newsletters.$inferSelect;