/**
 * Express app configuration
 * Extracted from server/index.ts to allow Next.js integration
 */

import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import { storage } from "./storage";
import { setupOAuth } from "./replitAuth";
import { createMetadataInjector } from "./lib/metadataInjector";
import { securityHeadersMiddleware } from "./middleware/securityHeaders";
import { handleMailgunWebhook } from "./webhooks/mailgunCustomerData";

export async function createExpressApp() {
  const app = express();

  // ==================================================================
  // CRITICAL: Mailgun webhook interceptor - HIGHEST PRIORITY
  // ==================================================================
  app.use("/api/webhooks/mailgun/customer-data", (req, res, next) => {
    console.log('[Webhook Interceptor] ===== INTERCEPTED REQUEST =====');
    console.log('[Webhook Interceptor] Method:', req.method);
    console.log('[Webhook Interceptor] Path:', req.path);
    
    if (req.method === 'POST') {
      console.log('[Webhook Interceptor] ✓ POST method - calling handler');
      return handleMailgunWebhook(req, res);
    }
    
    console.log('[Webhook Interceptor] Not POST - passing to next middleware');
    next();
  });
  console.log('[Server] Mailgun webhook interceptor registered at /api/webhooks/mailgun/customer-data');

  // Security headers (CSP, HSTS, etc.) - applied first for all responses
  app.use(securityHeadersMiddleware);

  // Enable gzip/brotli compression for all responses
  app.use(compression({
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6 // Balance between compression and speed
  }));

  // Redirect .replit.app domain to custom domain
  app.use((req: Request, res: Response, next: NextFunction) => {
    const host = req.get('host') || '';
    
    // Check if request is from .replit.app domain
    if (host.includes('.replit.app')) {
      const customDomain = 'https://www.plumbersthatcare.com';
      const redirectUrl = `${customDomain}${req.originalUrl}`;
      
      log(`Redirecting .replit.app request to custom domain: ${redirectUrl}`);
      return res.redirect(301, redirectUrl);
    }
    
    next();
  });

  // Setup OAuth authentication
  await setupOAuth(app);
  log("OAuth authentication configured");

  // Register all API routes
  registerRoutes(app);
  log("API routes registered");

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Server-side metadata injection (for non-Next.js requests)
  app.use(createMetadataInjector(storage));

  return app;
}
