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

// Background task to periodically refresh reviews from all sources (every 24 hours)
async function refreshReviewsPeriodically() {
  const REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  
  const refreshReviews = async () => {
    try {
      log("Background: Refreshing reviews from all sources...");
      
      const { fetchDataForSeoReviews } = await import("./lib/dataForSeoReviews");
      const { fetchFacebookReviews } = await import("./lib/facebookReviews");
      const allReviews: any[] = [];
      
      const placeId = process.env.GOOGLE_PLACE_ID;
      const facebookPageId = process.env.FACEBOOK_PAGE_ID;
      const facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;

      // 1. Fetch ALL Google reviews from DataForSEO (550+ reviews)
      if (placeId) {
        log("Background: Fetching Google reviews from DataForSEO...");
        const dataForSeoReviews = await fetchDataForSeoReviews(placeId);
        log(`Background: DataForSEO returned ${dataForSeoReviews.length} Google reviews`);
        allReviews.push(...dataForSeoReviews);
      }

      // 2. Fetch Facebook reviews
      if (facebookPageId && facebookAccessToken) {
        log("Background: Fetching Facebook reviews...");
        const fbReviews = await fetchFacebookReviews(facebookPageId, facebookAccessToken);
        log(`Background: Facebook returned ${fbReviews.length} reviews`);
        allReviews.push(...fbReviews);
      }

      // 3. Fetch new Google reviews from Places API (max 5, newest)
      log("Background: Fetching newest Google reviews from Places API...");
      const placesReviews = await fetchGoogleReviews();
      log(`Background: Places API returned ${placesReviews.length} reviews`);
      allReviews.push(...placesReviews);

      // Deduplicate reviews
      const uniqueReviews = deduplicateReviews(allReviews);
      log(`Background: After deduplication: ${uniqueReviews.length} unique reviews`);

      if (uniqueReviews.length > 0) {
        await storage.clearGoogleReviews();
        await storage.saveGoogleReviews(uniqueReviews);
        log(`Background: Successfully saved ${uniqueReviews.length} reviews to database`);
      } else {
        log("Background: No reviews fetched from any source");
      }
    } catch (error) {
      log(`Background: Error refreshing reviews - ${error}`);
    }
  };

  // Helper function to deduplicate reviews
  function deduplicateReviews(reviews: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const review of reviews) {
      const key = review.reviewId 
        ? `id:${review.reviewId}`
        : `${review.authorName}:${review.text.slice(0, 100)}:${review.timestamp}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(review);
      }
    }

    return unique;
  }

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
