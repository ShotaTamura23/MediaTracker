import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { createHash } from "crypto";
import { users, insertUserSchema, type SelectUser } from "@db/schema";
import { db, pool } from "@db";
import { eq } from "drizzle-orm";
import { fromZodError } from "zod-validation-error";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const PostgresSessionStore = connectPg(session);

async function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

async function comparePasswords(supplied: string, stored: string) {
  const hashedSupplied = await hashPassword(supplied);
  console.log('Password comparison:', {
    supplied: hashedSupplied,
    stored: stored,
    matches: hashedSupplied === stored
  });
  return hashedSupplied === stored;
}

async function getUserByUsername(username: string) {
  return db.select().from(users).where(eq(users.username, username)).limit(1);
}

export function setupAuth(app: Express) {
  const store = new PostgresSessionStore({ pool, createTableIfMissing: true });
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID!,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      secure: app.get("env") === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log('Attempting login for username:', username);
        const [user] = await getUserByUsername(username);
        if (!user) {
          console.log('User not found');
          return done(null, false, { message: "ユーザー名またはパスワードが正しくありません" });
        }
        const isValidPassword = await comparePasswords(password, user.password);
        console.log('Password validation:', isValidPassword);
        if (!isValidPassword) {
          return done(null, false, { message: "ユーザー名またはパスワードが正しくありません" });
        }
        return done(null, user);
      } catch (err) {
        console.error('Login error:', err);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      const error = fromZodError(result.error);
      return res.status(400).send(error.toString());
    }

    const [existingUser] = await getUserByUsername(result.data.username);
    if (existingUser) {
      return res.status(400).send("このユーザー名は既に使用されています");
    }

    const [user] = await db
      .insert(users)
      .values({
        ...result.data,
        password: await hashPassword(result.data.password),
      })
      .returning();

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  // Admin login endpoint
  app.post("/api/admin/login", (req, res, next) => {
    console.log('Admin login attempt for:', req.body.username);
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('Admin login error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Admin login failed: Invalid credentials');
        return res.status(401).send(info?.message || "認証に失敗しました");
      }
      if (!user.isAdmin) {
        console.log('Admin login failed: Not an admin user');
        return res.status(403).send("管理者権限がありません");
      }
      req.login(user, (err) => {
        if (err) return next(err);
        console.log('Admin login successful');
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Regular login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).send(info?.message || "認証に失敗しました");
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}