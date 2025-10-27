import express, { type Express } from "express";
import next from "next";
import { type Server } from "http";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Routes that should use Express API instead of Next.js
 * All other routes will be handled by Next.js
 */
const EXPRESS_ONLY_ROUTES = [
  '/api',
  '/attached_assets',
];

/**
 * Check if a path should be handled by Express
 */
function isExpressRoute(pathname: string): boolean {
  return EXPRESS_ONLY_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Setup Next.js integration with Express backend
 * Next.js handles all frontend routes with SSR/ISR
 * Express handles API routes and background jobs
 */
export async function setupNextIntegration(app: Express, server: Server) {
  const isDevelopment = app.get("env") === "development";
  
  // Initialize Next.js
  const nextApp = next({ 
    dev: isDevelopment,
    // In Replit, everything runs on the same port (5000)
    // Next.js dev server is integrated into Express
    hostname: '0.0.0.0',
    port: parseInt(process.env.PORT || '5000', 10),
    // Custom server mode - no separate port
    customServer: true,
  });
  
  const handle = nextApp.getRequestHandler();
  
  log("Preparing Next.js application...", "next");
  await nextApp.prepare();
  log("✓ Next.js application ready", "next");
  
  // Serve Next.js static files
  if (!isDevelopment) {
    const nextStaticPath = path.resolve(import.meta.dirname, '..', '.next', 'static');
    app.use('/_next/static', express.static(nextStaticPath, {
      maxAge: '1y',
      immutable: true,
    }));
    log("✓ Next.js static files mounted", "next");
  }
  
  // Next.js request handler for all non-API routes
  app.use("*", async (req, res, next) => {
    const pathname = req.path;
    
    // Let Express handle API routes and static assets
    if (isExpressRoute(pathname)) {
      return next();
    }
    
    // Next.js handles everything else (public pages, blog, etc.)
    log(`→ Next.js SSR: ${pathname}`, "next");
    
    try {
      await handle(req, res);
    } catch (error) {
      log(`Error in Next.js handler: ${error}`, "next");
      next(error);
    }
  });
}
