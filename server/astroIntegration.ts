import express, { type Express, type Request, type Response, type NextFunction } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer, createLogger } from "vite";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { type Server } from "http";

const viteLogger = createLogger();

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
 * Routes that should use React SPA (Vite) instead of Astro
 */
const REACT_ROUTES = [
  '/admin',
  '/customer-portal'
];

/**
 * Check if a path should be handled by React SPA
 */
function isReactRoute(pathname: string): boolean {
  return REACT_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Setup hybrid routing: Astro for public pages, React for admin/portal
 */
export async function setupHybridRouting(app: Express, server: Server) {
  const isDevelopment = app.get("env") === "development";
  
  // Load Astro middleware
  let astroHandler: any = null;
  try {
    const astroDistPath = path.resolve(import.meta.dirname, "..", "dist", "server", "entry.mjs");
    
    if (fs.existsSync(astroDistPath)) {
      log("Loading Astro middleware...");
      const astroEntry = await import(astroDistPath);
      astroHandler = astroEntry.handler;
      log("✓ Astro middleware loaded");
    } else {
      log("⚠ Astro not built yet. Falling back to React SPA for all routes.");
    }
  } catch (error) {
    log(`⚠ Error loading Astro middleware: ${error}`);
  }
  
  // Serve Astro's static client assets
  if (astroHandler) {
    const astroClientPath = path.resolve(import.meta.dirname, "..", "dist", "client");
    if (fs.existsSync(astroClientPath)) {
      app.use('/_astro', express.static(astroClientPath + '/_astro'));
      log("✓ Astro client assets mounted at /_astro");
    }
  }
  
  // Setup Vite for development (React SPA)
  let vite: any = null;
  if (isDevelopment) {
    log("Setting up Vite for React SPA (admin/portal)...");
    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    };

    vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          process.exit(1);
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    // Mount Vite middleware only for React routes (/admin, /customer-portal)
    // and Vite's internal routes (/@vite, /node_modules, etc.)
    app.use((req, res, next) => {
      const pathname = req.path;
      // Allow Vite middleware for React routes and Vite internal routes
      if (isReactRoute(pathname) || pathname.startsWith('/@') || pathname.startsWith('/node_modules') || pathname.startsWith('/src/')) {
        vite.middlewares(req, res, next);
      } else {
        next();
      }
    });
    log("✓ Vite middleware mounted (scoped to React routes)");
  } else {
    // In production, serve static React build
    const reactDistPath = path.resolve(import.meta.dirname, "..", "dist", "public");
    if (fs.existsSync(reactDistPath)) {
      app.use(express.static(reactDistPath));
      log("✓ React static files mounted");
    } else {
      log(`⚠ React build not found at ${reactDistPath}. Run 'npm run build' first.`);
    }
  }
  
  // Route dispatcher: Astro for public, React for admin/portal
  app.use("*", async (req: Request, res: Response, next: NextFunction) => {
    const pathname = req.path;
    
    // Check if this is a React route (/admin or /customer-portal)
    if (isReactRoute(pathname)) {
      log(`→ React SPA: ${pathname}`);
      
      if (isDevelopment && vite) {
        // Development: Use Vite to serve React app
        try {
          const clientTemplate = path.resolve(
            import.meta.dirname,
            "..",
            "client",
            "index.html",
          );

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
      } else {
        // Production: Serve static React build
        const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
        const indexPath = path.resolve(distPath, "index.html");
        
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("React build not found. Run 'npm run build' first.");
        }
      }
      return;
    }
    
    // Handle public routes with Astro
    if (astroHandler) {
      log(`→ Astro: ${pathname}`);
      
      try {
        await astroHandler(req, res);
      } catch (error) {
        log(`Error in Astro handler: ${error}`);
        next(error);
      }
    } else {
      // No Astro available, fall back to React SPA for all routes
      log(`→ Fallback to React SPA (Astro unavailable): ${pathname}`);
      
      if (isDevelopment && vite) {
        try {
          const clientTemplate = path.resolve(
            import.meta.dirname,
            "..",
            "client",
            "index.html",
          );

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
      } else {
        const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
        const indexPath = path.resolve(distPath, "index.html");
        
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("No build found. Run builds first.");
        }
      }
    }
  });
}
