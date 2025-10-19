import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // Require SESSION_SECRET for security
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required for secure sessions");
  }
  
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevent JavaScript access
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection (lax for OAuth redirects)
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: Express.User,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
): void {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertOAuthUser(claims: Express.User['claims']): Promise<void> {
  if (!claims?.sub || !claims?.email) {
    throw new Error('Invalid OAuth claims: missing sub or email');
  }
  
  await storage.upsertOAuthUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupOAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertOAuthUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/oauth/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Rate limiter for OAuth login - 5 attempts per 15 minutes per IP
  const oauthLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: { error: "Too many login attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/api/oauth/login", oauthLoginLimiter, (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/oauth/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, async (err: Error | null, user: Express.User | false) => {
      if (err || !user) {
        console.error("[OAuth] Authentication failed:", err);
        return res.redirect("/admin/oauth-login");
      }

      // Check if the user's email is whitelisted
      const email = user.claims?.email;
      console.log("[OAuth] Callback for email:", email);
      
      if (!email) {
        console.error("[OAuth] No email in claims");
        return res.redirect("/admin/oauth-login");
      }
      
      const isWhitelisted = await storage.isEmailWhitelisted(email);
      console.log("[OAuth] Email whitelisted:", isWhitelisted);
      
      if (!isWhitelisted) {
        console.error("[OAuth] Email not whitelisted:", email);
        return res.redirect("/admin/oauth-login");
      }

      // Login the user first
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("[OAuth] Login error:", loginErr);
          return res.redirect("/admin/oauth-login");
        }
        
        // Set admin flag in session
        req.session.isAdmin = true;
        
        // Save session before redirect
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[OAuth] Session save error:", saveErr);
            return res.redirect("/admin/oauth-login");
          }
          console.log("[OAuth] Login successful, redirecting to /admin");
          return res.redirect("/admin");
        });
      });
    })(req, res, next);
  });

  app.get("/api/oauth/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

// Middleware to check if OAuth user is authenticated
export const isOAuthAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user;

  if (!req.isAuthenticated() || !user || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Middleware to check if OAuth user is whitelisted as admin
export const isOAuthAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user;

  if (!req.isAuthenticated() || !user || !user.claims?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if email is in admin whitelist
  const isWhitelisted = await storage.isEmailWhitelisted(user.claims.email);
  
  if (!isWhitelisted) {
    return res.status(403).json({ message: "Access denied. Your email is not authorized for admin access." });
  }

  next();
};
