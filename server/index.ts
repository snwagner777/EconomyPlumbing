import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as path from "path";
import * as fs from "fs";
import { fetchGoogleReviews } from "./lib/googleReviews";
import { storage } from "./storage";
import { startMembershipSyncJob } from "./lib/membershipSyncJob";
// import { startWeeklyPostScheduler } from "./lib/weeklyPostScheduler"; // Disabled - no social media integration yet
import { startAutoBlogGeneration } from "./lib/autoBlogGenerator";
import { startGoogleDriveMonitoring } from "./lib/googleDriveMonitor";
import { startDailyCompositeJob } from "./lib/dailyCompositeJob";
import { startPhotoCleanupJob } from "./lib/photoCleanupJob";
import { startServiceTitanSync } from "./lib/serviceTitanSync";
import { getReferralProcessor } from "./lib/referralProcessor";
import { startGMBAutomation } from "./lib/gmbAutomation";
import { getReviewRequestScheduler } from "./lib/reviewRequestScheduler";
import { getReferralNurtureScheduler } from "./lib/referralNurtureScheduler";
import { setupOAuth } from "./replitAuth";
import { createMetadataInjector } from "./lib/metadataInjector";
import { securityHeadersMiddleware } from "./middleware/securityHeaders";

const app = express();

// ==================================================================
// CRITICAL: Mailgun webhook interceptor - HIGHEST PRIORITY
// ==================================================================
// Use app.use() with path matcher to intercept BEFORE all other middleware (including Vite)
// This takes absolute precedence over everything else
import { handleMailgunWebhook } from "./webhooks/mailgunCustomerData";

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

// 301 Redirects for old URLs from Google Search Console
app.use((req: Request, res: Response, next: NextFunction) => {
  const path = req.path.toLowerCase();
  
  // Define redirect map
  const redirects: Record<string, string> = {
    // B2B pages
    '/b2b': '/commercial-plumbing',
    '/b2b/': '/commercial-plumbing',
    
    // Old shop/store URLs
    '/shop/products': '/store',
    '/shop/p/vip-membership': '/store',
    '/shop/enamel-mug': '/store',
    '/shop/enamel-mug/': '/store',
    '/shop/economy-plumbing-services-mug': '/store',
    '/shop/economy-plumbing-services-mug/': '/store',
    '/shop/stainless-steel-water-bottle-with-a-straw-lid': '/store',
    '/shop/stainless-steel-water-bottle-with-a-straw-lid/': '/store',
    
    // BioPure product redirects
    '/product/bio-pure-septic-&-drain-rv-restore-&-maintain-32-oz': '/store/bio-pure-septic-drain-rv-restore-maintain-32-oz',
    '/shop/p/bio-pure-septic-drain-rv-restore-maintain-32-oz-7-septic-treatments': '/store/bio-pure-septic-drain-rv-restore-maintain-32-oz',
    
    // VIP Membership redirects
    '/product/platinum-vip-membership': '/store',
    '/product/silver-vip-membership': '/store',
    '/product/rental-vip': '/store/rental-vip',
    '/product/commercial-vip': '/store/commercial-vip',
    
    // Old page names
    '/home-old': '/',
    '/index': '/',
    '/products': '/store',
    '/vip-membership': '/membership-benefits',
    
    // Malformed URLs
    '/water-heater-guide88b9d760': '/water-heater-guide',
    
    // Service URL aliases - redirect to canonical versions
    // Removed: allowing both URLs to work for content coverage
    
    // Old service URLs
    '/water-heater-experts-in-austin': '/water-heater-services',
    '/water-heater-experts-in-austin/': '/water-heater-services',
    '/hydro-jetting-drainage-solutions': '/hydro-jetting-services',
    '/hydro-jetting-drainage-solutions/': '/hydro-jetting-services',
    '/sewer-line-repairs-and-replacements-in-austin-tx': '/services',
    '/sewer-line-repairs-and-replacements-in-austin-tx/': '/services',
    '/sewer-lines-repairs-and-replacements-in-austin': '/services',
    '/sewer-lines-repairs-and-replacements-in-austin/': '/services',
    '/20-gas-pipe-repair': '/gas-line-services',
    '/20-gas-pipe-repair/': '/gas-line-services',
    
    // Old blog posts - redirect to blog home or specific posts if available
    '/the-importance-of-water-heater-maintenance-for-austin-homeowners': '/blog',
    '/the-importance-of-water-heater-maintenance-for-austin-homeowners/': '/blog',
    '/why-rheem': '/water-heater-services',
    '/why-rheem/': '/water-heater-services',
    
    // WordPress date archives, categories, tags, authors
    '/2023/08/08': '/blog',
    '/2023/08/08/': '/blog',
    '/category/blog': '/blog',
    '/category/blog/': '/blog',
    '/category/blog/page/2': '/blog',
    '/category/blog/page/2/': '/blog',
    '/category/repairs': '/blog',
    '/category/repairs/': '/blog',
    '/category/repairs/feed': '/blog',
    '/category/repairs/feed/': '/blog',
    '/category/tips': '/blog',
    '/category/tips/': '/blog',
    '/tag/texas': '/blog',
    '/tag/texas/': '/blog',
    '/author/admin': '/blog',
    '/author/admin/': '/blog',
    '/author/staging3-plumbersthatcare-com': '/blog',
    '/author/staging3-plumbersthatcare-com/': '/blog',
    
    // Random image/asset URLs
    '/aronpw-bc40m7skyfq-unsplash-6': '/',
    '/aronpw-bc40m7skyfq-unsplash-6/': '/',
    
    // Malformed URLs with tracking parameters
    '/&opi=79508299': '/',
  };
  
  // Check for exact match
  if (redirects[path]) {
    log(`301 Redirect: ${path} → ${redirects[path]}`);
    return res.redirect(301, redirects[path]);
  }
  
  // Handle shop URLs with query parameters (add-to-cart, attributes, etc.)
  if (path.startsWith('/shop/')) {
    log(`301 Redirect: ${path} → /store`);
    return res.redirect(301, '/store');
  }
  
  // Handle WordPress category/tag/author patterns
  if (path.startsWith('/category/') || path.startsWith('/tag/') || path.startsWith('/author/')) {
    log(`301 Redirect: ${path} → /blog`);
    return res.redirect(301, '/blog');
  }
  
  // Redirect /blog/:slug to /:slug (removing /blog/ from blog post URLs)
  if (path.startsWith('/blog/') && path !== '/blog/') {
    const slug = path.replace('/blog/', '').replace(/\/$/, ''); // Remove /blog/ prefix and trailing slash
    const redirectPath = `/${slug}`;
    log(`301 Redirect: ${path} → ${redirectPath}`);
    return res.redirect(301, redirectPath);
  }
  
  // Handle WordPress date archive patterns (YYYY/MM/DD)
  if (/^\/\d{4}\/\d{2}\/\d{2}\/?/.test(path)) {
    log(`301 Redirect: ${path} → /blog`);
    return res.redirect(301, '/blog');
  }
  
  next();
});

// Block access to source files and development paths
// Note: In development, Vite serves /src/* files, so don't block them
app.use((req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  
  // Only block server-side source files and sensitive directories
  // Allow /src/* in development for Vite
  if (path.startsWith('/server/') ||
      path.startsWith('/node_modules/') ||
      path.endsWith('.env')) {
    log(`403 Forbidden: Blocked access to source file ${path}`);
    return res.status(403).send('Forbidden');
  }
  
  next();
});

// Normalize trailing slashes - 301 redirect all trailing-slash URLs to non-slash version
// This prevents duplicate content issues in SEO tools
app.use((req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  
  // Skip if it's just the root "/" or if it doesn't have a trailing slash
  if (path === '/' || !path.endsWith('/')) {
    return next();
  }
  
  // Remove trailing slash
  const cleanPath = path.slice(0, -1);
  
  // Build redirect URL preserving query parameters
  const redirectUrl = req.query && Object.keys(req.query).length > 0
    ? `${cleanPath}?${new URLSearchParams(req.query as any).toString()}`
    : cleanPath;
  
  log(`301 Redirect: ${path} → ${cleanPath} (trailing slash normalization)`);
  return res.redirect(301, redirectUrl);
});

// Stripe webhook must use raw body for signature verification
// This must come BEFORE express.json() middleware
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes with increased limit for photo uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

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
  // Setup OAuth authentication (Replit Auth for Google/Apple/GitHub login)
  await setupOAuth(app);
  
  const server = await registerRoutes(app);
  
  // Seed service areas if needed (non-blocking)
  seedServiceAreas().catch(err => log(`Seed service areas failed - ${err}`));
  
  // Start periodic review refresh (non-blocking)
  refreshReviewsPeriodically();
  
  // Start membership sync background job (non-blocking)
  startMembershipSyncJob();
  
  // Social media posting disabled - no integration yet
  // startWeeklyPostScheduler();
  
  // Start automated blog generation (checks weekly for unused photos)
  startAutoBlogGeneration(storage);
  
  // Start Google Drive monitoring (checks every 5 minutes for new photos)
  // Note: Duplicate detection now happens during import, before photos are saved
  startGoogleDriveMonitoring();
  
  // Start daily before/after composite creation (runs at 2am daily)
  // Groups photos from same job uploaded in last 24 hours and creates before/after collages
  // DISABLED: User requested to disable automatic composite creation
  // startDailyCompositeJob();
  
  // Start photo cleanup job (runs daily at 3am to delete unused photos older than 60 days)
  startPhotoCleanupJob();
  
  // ServiceTitan customer sync DISABLED - replaced with hourly XLSX import via Mailgun email
  // startServiceTitanSync();
  
  // Start GMB automation (fetches reviews every 6 hours, auto-replies every 15 minutes)
  startGMBAutomation();
  
  // Start review request and referral nurture email schedulers
  console.log('[Schedulers] Starting review request and referral nurture email schedulers...');
  
  const reviewRequestScheduler = getReviewRequestScheduler();
  const referralNurtureScheduler = getReferralNurtureScheduler();
  
  // Review request scheduler - runs every 30 minutes
  setInterval(() => {
    console.log('[Review Request Scheduler] Running scheduled email check...');
    reviewRequestScheduler.processPendingEmails().catch((err: Error) => {
      console.error('[Review Request Scheduler] Error processing emails:', err);
    });
  }, 30 * 60 * 1000); // Every 30 minutes
  
  // Referral nurture scheduler - runs every 30 minutes
  setInterval(() => {
    console.log('[Referral Nurture Scheduler] Running scheduled email check...');
    referralNurtureScheduler.processPendingEmails().catch((err: Error) => {
      console.error('[Referral Nurture Scheduler] Error processing emails:', err);
    });
  }, 30 * 60 * 1000); // Every 30 minutes
  
  // Run both immediately on startup (after 10 seconds)
  setTimeout(() => {
    console.log('[Schedulers] Running initial email processing...');
    reviewRequestScheduler.processPendingEmails().catch((err: Error) => {
      console.error('[Review Request Scheduler] Initial processing error:', err);
    });
    referralNurtureScheduler.processPendingEmails().catch((err: Error) => {
      console.error('[Referral Nurture Scheduler] Initial processing error:', err);
    });
  }, 10000);
  
  // Start custom campaign scheduler (runs every 30 minutes)
  const { startCustomCampaignScheduler } = await import('./lib/customCampaignScheduler');
  startCustomCampaignScheduler();
  
  // Start referral processor (runs every hour to match referees, detect completed jobs, and issue credits)
  const referralProcessor = getReferralProcessor();
  
  // Run immediately on startup
  setTimeout(() => {
    console.log('[Referral Processor] Running initial referral processing...');
    referralProcessor.processPendingReferrals().catch(err => {
      console.error('[Referral Processor] Error during initial processing:', err);
    });
  }, 5000); // Wait 5 seconds after startup
  
  // Then run every hour
  setInterval(() => {
    console.log('[Referral Processor] Running hourly referral processing...');
    referralProcessor.processPendingReferrals().catch(err => {
      console.error('[Referral Processor] Error during hourly processing:', err);
    });
  }, 60 * 60 * 1000); // Every hour

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Add caching headers for static assets in production
  if (app.get("env") !== "development") {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const url = req.url;
      
      // Cache any hashed assets aggressively (they have content hashes so are immutable)
      // Matches patterns like: main-abc123def.js, logo-789xyz.webp, styles-456abc.css
      if (/[.-][a-f0-9]{8,}\.(js|css|woff2?|ttf|otf|eot|svg|webp|png|jpg|jpeg|gif|ico|json)$/i.test(url)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Cache unhashed fonts and icons for 1 year (these rarely change)
      else if (/\.(woff2?|ttf|otf|eot|ico)$/i.test(url)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Cache unhashed images for 1 week (allow for updates)
      else if (/\.(webp|png|jpg|jpeg|gif|svg)$/i.test(url)) {
        res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week
      }
      // Cache manifest and other JSON for 1 day
      else if (/\.(json|xml)$/i.test(url)) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
      }
      // HTML should be cached but always revalidated for freshness
      else if (/\.html$/i.test(url) || url === '/' || !url.includes('.')) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
      
      next();
    });
  }
  
  // Server-side metadata injection
  // Injects title, description, and canonical tags into initial HTML
  // This ensures crawlers see correct metadata WITHOUT JavaScript execution
  app.use(createMetadataInjector(storage));
  
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
