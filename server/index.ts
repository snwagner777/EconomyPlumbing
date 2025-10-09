import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fetchGoogleReviews } from "./lib/googleReviews";
import { storage } from "./storage";
import { startMembershipSyncJob } from "./lib/membershipSyncJob";
import { startWeeklyPostScheduler } from "./lib/weeklyPostScheduler";
import { startGoogleDriveImportJob } from "./lib/googleDriveImportJob";

const app = express();

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

// Stripe webhook must use raw body for signature verification
// This must come BEFORE express.json() middleware
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes
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
      log("Background: Refreshing reviews from Google Places API...");
      
      const allReviews: any[] = [];

      // NOTE: DataForSEO was used ONE-TIME to fetch all historical reviews (333 imported)
      // Now we rely on Google Places API for ongoing updates (max 5 newest reviews per refresh)
      // If you need to re-run DataForSEO, temporarily uncomment the code below:
      
      // const { fetchDataForSeoReviews } = await import("./lib/dataForSeoReviews");
      // const placeId = process.env.GOOGLE_PLACE_ID;
      // if (placeId) {
      //   log("Background: Fetching Google reviews from DataForSEO...");
      //   const dataForSeoReviews = await fetchDataForSeoReviews(placeId);
      //   log(`Background: DataForSEO returned ${dataForSeoReviews.length} Google reviews`);
      //   allReviews.push(...dataForSeoReviews);
      // }

      // Fetch new Google reviews from Places API (max 5, newest)
      log("Background: Fetching newest Google reviews from Places API...");
      const placesReviews = await fetchGoogleReviews();
      log(`Background: Places API returned ${placesReviews.length} reviews`);
      allReviews.push(...placesReviews);

      if (allReviews.length === 0) {
        log("Background: No new reviews fetched");
        return;
      }

      // Get existing reviews to check for duplicates
      const existingReviews = await storage.getGoogleReviews();
      
      // Build a map for text+timestamp matching (most reliable for deduplication)
      const existingByContent = new Map<string, typeof existingReviews[0]>();
      for (const review of existingReviews) {
        const contentKey = `${review.text}:${review.timestamp}`;
        existingByContent.set(contentKey, review);
      }

      const newReviews = [];
      const reviewsToReplace = [];

      for (const review of allReviews) {
        // Only keep 4+ star reviews
        if (review.rating < 4) continue;
        
        const contentKey = `${review.text}:${review.timestamp}`;
        const existing = existingByContent.get(contentKey);
        
        if (existing) {
          // If this is a Places API review replacing a DataForSEO review, upgrade it
          if (review.source === 'places_api' && existing.source === 'dataforseo') {
            reviewsToReplace.push({ oldId: existing.id, newReview: review });
            log(`Background: Upgrading DataForSEO review to Places API (better data): "${review.text.slice(0, 50)}..."`);
          }
          // Otherwise skip - already have this exact review
        } else {
          // Brand new review
          newReviews.push(review);
        }
      }

      // Delete old DataForSEO reviews being replaced by Places API versions
      if (reviewsToReplace.length > 0) {
        await storage.deleteGoogleReviews(reviewsToReplace.map(r => r.oldId));
        newReviews.push(...reviewsToReplace.map(r => r.newReview));
        log(`Background: Replaced ${reviewsToReplace.length} DataForSEO reviews with Places API versions`);
      }

      if (newReviews.length > 0) {
        await storage.saveGoogleReviews(newReviews);
        log(`Background: Added ${newReviews.length} new unique reviews (total: ${existingReviews.length - reviewsToReplace.length + newReviews.length})`);
      } else {
        log(`Background: No new reviews to add (${existingReviews.length} existing reviews preserved)`);
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
  
  // Start membership sync background job (non-blocking)
  startMembershipSyncJob();
  
  // Start weekly social media posting scheduler (non-blocking)
  startWeeklyPostScheduler();
  
  // Start Google Drive photo import background job (non-blocking)
  startGoogleDriveImportJob();

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
