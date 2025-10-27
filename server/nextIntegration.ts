import express, { type Express } from "express";
import next from "next";
import { type Server } from "http";
import path from "path";
import fs from "fs";
import { createServer as createViteServer, createLogger } from "vite";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

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
 * Routes that should use Express/Vite instead of Next.js
 * - /api: Express API routes
 * - /attached_assets: Static assets served by Express
 * - /admin: Admin dashboard (React SPA via Vite)
 * - /customer-portal: Customer portal (React SPA via Vite)
 * - /assets: Built SPA assets (JS/CSS bundles)
 * - /@vite: Vite development server assets
 * - /src: Vite source files in development
 * All other routes will be handled by Next.js for public pages
 */
const EXPRESS_ONLY_ROUTES = [
  '/api',
  '/attached_assets',
  '/admin',
  '/customer-portal',
  '/assets',
  '/@vite',
  '/src',
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
 * Vite handles admin/portal React SPA routes
 */
export async function setupNextIntegration(app: Express, server: Server) {
  const isDevelopment = app.get("env") === "development";
  
  // Setup Vite middleware for admin/portal React SPA routes
  if (isDevelopment) {
    // Development: Use Vite middleware for HMR and hot reload
    const viteLogger = createLogger();
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          process.exit(1);
        },
      },
      server: {
        middlewareMode: true,
        hmr: { server },
        allowedHosts: true as const,
      },
      appType: "custom",
    });

    // Vite middlewares handle HMR, source maps, and module transformation
    app.use(vite.middlewares);
    
    // Vite HTML handler for admin/portal routes
    app.use("*", async (req, res, next) => {
      const pathname = req.path;
      
      // Only handle admin/portal routes with Vite
      if (!pathname.startsWith('/admin') && !pathname.startsWith('/customer-portal')) {
        return next();
      }
      
      log(`→ Vite SPA: ${pathname}`, "vite");
      
      try {
        const clientTemplate = path.resolve(import.meta.dirname, '..', 'client', 'index.html');
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
    
    log("✓ Vite middleware ready for admin/portal", "vite");
  } else {
    // Production: Serve built SPA from dist directory
    const distPath = path.resolve(import.meta.dirname, '..', 'dist', 'public');
    
    if (!fs.existsSync(distPath)) {
      log("Warning: Client build directory not found. Run 'npm run build' to build the admin/portal SPA.", "vite");
    } else {
      // Serve SPA assets (JS/CSS bundles) from /assets
      // This allows the admin/portal SPA to load its scripts and stylesheets
      const assetsPath = path.resolve(distPath, 'assets');
      if (fs.existsSync(assetsPath)) {
        app.use('/assets', express.static(assetsPath, {
          maxAge: '1y',  // Aggressive caching for hashed assets
          immutable: true,
        }));
      }
      
      // Serve static assets for admin/portal routes (fonts, images, etc.)
      app.use(['/admin', '/customer-portal'], express.static(distPath, { 
        index: false  // Don't auto-serve index.html, we handle it explicitly below
      }));
      
      // SPA HTML handler for admin/portal routes in production
      app.use("*", (req, res, next) => {
        const pathname = req.path;
        
        // Only handle admin/portal routes with SPA
        if (!pathname.startsWith('/admin') && !pathname.startsWith('/customer-portal')) {
          return next();
        }
        
        log(`→ SPA: ${pathname}`, "spa");
        
        const indexPath = path.resolve(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          log("Error: index.html not found in dist directory", "spa");
          next();
        }
      });
      
      log("✓ Admin/portal SPA static files ready", "spa");
    }
  }
  
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
  
  // Next.js request handler for all non-API, non-admin routes
  app.use("*", async (req, res, next) => {
    const pathname = req.path;
    
    // Let Express handle API routes, static assets, and admin/portal
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
