import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fetchGoogleReviews } from "./lib/googleReviews";
import { storage } from "./storage";

const app = express();

// Enable gzip/brotli compression for all responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance between compression and speed
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from attached_assets directory with aggressive caching
app.use('/attached_assets', express.static(path.resolve(import.meta.dirname, '..', 'attached_assets'), {
  maxAge: '1y', // Cache for 1 year
  immutable: true, // Assets are immutable (versioned)
  setHeaders: (res, filePath) => {
    // Set cache headers for static assets
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || 
        filePath.endsWith('.png') || filePath.endsWith('.webp') || 
        filePath.endsWith('.svg') || filePath.endsWith('.gif')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Seed service areas if database is empty
async function seedServiceAreas() {
  try {
    log("Checking service areas in database...");
    const existingAreas = await storage.getAllServiceAreas();
    log(`Found ${existingAreas.length} existing service areas`);
    
    if (existingAreas.length > 0) {
      log("Service areas already exist in database");
      return;
    }

    log("Seeding service areas to database...");
    
    // Import service area data from MemStorage
    const { MemStorage } = await import("./storage");
    const memStorage = new MemStorage();
    const serviceAreas = await memStorage.getAllServiceAreas();
    log(`Loaded ${serviceAreas.length} service areas from MemStorage`);
    
    // Insert each service area into database
    let count = 0;
    for (const area of serviceAreas) {
      await storage.createServiceArea(area);
      count++;
      if (count % 5 === 0) {
        log(`Seeded ${count}/${serviceAreas.length} service areas...`);
      }
    }
    
    log(`Successfully seeded ${serviceAreas.length} service areas`);
  } catch (error) {
    log(`ERROR seeding service areas: ${error}`);
    console.error("Full error:", error);
  }
}

// Background task to periodically refresh Google reviews (every 24 hours)
async function refreshReviewsPeriodically() {
  const REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  
  const refreshReviews = async () => {
    try {
      log("Background: Refreshing Google reviews...");
      
      // Try Google My Business API first (if OAuth configured)
      const { fetchAllGoogleMyBusinessReviews } = await import("./lib/googleMyBusinessReviews");
      const gmbReviews = await fetchAllGoogleMyBusinessReviews();
      
      if (gmbReviews.length > 0) {
        await storage.clearGoogleReviews();
        await storage.saveGoogleReviews(gmbReviews);
        log(`Background: Successfully refreshed ${gmbReviews.length} reviews from Google My Business`);
      } else {
        // Fallback to Places API (limited to 5 reviews)
        log("Background: No GMB reviews, falling back to Places API...");
        const placesReviews = await fetchGoogleReviews();
        
        if (placesReviews.length > 0) {
          await storage.clearGoogleReviews();
          await storage.saveGoogleReviews(placesReviews);
          log(`Background: Successfully refreshed ${placesReviews.length} reviews from Places API`);
        } else {
          log("Background: No reviews fetched from Google");
        }
      }
    } catch (error) {
      log(`Background: Error refreshing reviews - ${error}`);
    }
  };

  // Run immediately on startup (non-blocking)
  refreshReviews().catch(err => log(`Background: Initial refresh failed - ${err}`));
  
  // Then run every 24 hours
  setInterval(refreshReviews, REFRESH_INTERVAL);
}

(async () => {
  const server = await registerRoutes(app);
  
  // Seed service areas if needed (non-blocking)
  seedServiceAreas().catch(err => log(`Seed service areas failed - ${err}`));
  
  // Start periodic review refresh (non-blocking)
  refreshReviewsPeriodically();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
