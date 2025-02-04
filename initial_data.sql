--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: japanese_cuisine_db; Type: DATABASE; Schema: -; Owner: postgres
--

-- Drop tables if they exist
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS article_restaurants;
DROP TABLE IF EXISTS newsletters;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS users;

--
-- Create tables
--

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content JSONB NOT NULL,
    excerpt TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id),
    published BOOLEAN NOT NULL DEFAULT false,
    type TEXT NOT NULL,
    is_new_opening BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude TEXT NOT NULL,
    longitude TEXT NOT NULL,
    cuisine_type TEXT NOT NULL,
    price_range TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    website TEXT,
    phone TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE article_restaurants (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES articles(id),
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
    "order" INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    article_id INTEGER NOT NULL REFERENCES articles(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE newsletters (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    confirmed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--
-- Insert initial data
--

-- Admin user (password: admin)
INSERT INTO users (username, password, email, is_admin) 
VALUES ('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin@example.com', true);

-- Sample restaurants
INSERT INTO restaurants (name, description, address, latitude, longitude, cuisine_type, price_range, status)
VALUES 
('Sushi Express', 'Authentic sushi restaurant in central London', '123 Oxford Street, London', '51.5074', '-0.1278', 'sushi', 'moderate', 'published'),
('Ramen House', 'Traditional Japanese ramen shop', '45 Baker Street, London', '51.5204', '-0.1568', 'ramen', 'budget', 'published');

-- Sample articles
INSERT INTO articles (title, slug, content, excerpt, cover_image, author_id, published, type)
VALUES 
('Best Sushi in London', 'best-sushi-london', 
'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Discover the best sushi restaurants in London"}]}]}',
'A guide to London''s finest sushi establishments', 
'https://example.com/sushi-cover.jpg', 
1, true, 'list');

-- Sample article-restaurant relation
INSERT INTO article_restaurants (article_id, restaurant_id, "order")
VALUES (1, 1, 0);
