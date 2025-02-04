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
-- Drop tables if they exist
--
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS article_restaurants CASCADE;
DROP TABLE IF EXISTS newsletters CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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
INSERT INTO restaurants (name, description, address, latitude, longitude, cuisine_type, price_range, status, website, phone)
VALUES 
('Sushi Express', 'ロンドン中心部の本格的な寿司レストラン。新鮮な魚介類と熟練した職人の技が光ります。', '123 Oxford Street, London', '51.5074', '-0.1278', 'sushi', 'moderate', 'published', 'https://example.com/sushi-express', '+44 20 1234 5678'),
('Ramen House', '伝統的な日本のラーメン店。濃厚な豚骨スープが特徴です。', '45 Baker Street, London', '51.5204', '-0.1568', 'ramen', 'budget', 'published', 'https://example.com/ramen-house', '+44 20 2345 6789'),
('Izakaya Joy', '本格的な居酒屋。日本の伝統的な料理と現代的なフュージョン料理を提供。', '78 Dean Street, London', '51.5147', '-0.1359', 'izakaya', 'expensive', 'published', 'https://example.com/izakaya-joy', '+44 20 3456 7890');

-- Sample articles
INSERT INTO articles (title, slug, content, excerpt, cover_image, author_id, published, type)
VALUES 
('ロンドン最高の寿司', 'best-sushi-london', 
'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"ロンドンで最高の寿司を提供するレストランをご紹介します。新鮮な魚介類と熟練した職人の技が光る、本格的な寿司の世界をお楽しみください。"}]}]}',
'ロンドンの最高級寿司店ガイド', 
'https://example.com/sushi-cover.jpg', 
1, true, 'review'),

('ロンドンのおすすめラーメン5選', 'top-5-ramen-london',
'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"ロンドンで本場の味を楽しめるラーメン店を厳選してご紹介。濃厚な豚骨から あっさりした醤油まで、様々なスープをお楽しみいただけます。"}]}]}',
'本場の味を楽しめるロンドンのラーメン店ガイド',
'https://example.com/ramen-cover.jpg',
1, true, 'list');

-- Sample article-restaurant relations
INSERT INTO article_restaurants (article_id, restaurant_id, "order", description)
VALUES 
(1, 1, 0, 'ロンドンで最も本格的な寿司を味わえる店舗です。'),
(2, 2, 0, '濃厚な豚骨スープが特徴の人気店。');

-- Sample newsletter subscriptions
INSERT INTO newsletters (email, confirmed)
VALUES 
('subscriber1@example.com', true),
('subscriber2@example.com', true),
('pending@example.com', false);

-- Sample bookmarks
INSERT INTO bookmarks (user_id, article_id)
VALUES 
(1, 1),
(1, 2);