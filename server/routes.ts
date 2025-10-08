import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSubmissionSchema, type InsertGoogleReview } from "@shared/schema";
import Stripe from "stripe";
import { sendContactFormEmail } from "./email";
import { fetchGoogleReviews, filterReviewsByKeywords, getHighRatedReviews } from "./lib/googleReviews";
import { GoogleMyBusinessAuth } from "./lib/googleMyBusinessAuth";
import { fetchAllGoogleMyBusinessReviews } from "./lib/googleMyBusinessReviews";
import { fetchDataForSeoReviews } from "./lib/dataForSeoReviews";
import { fetchFacebookReviews } from "./lib/facebookReviews";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve robots.txt
  app.get("/robots.txt", (req, res) => {
    const robotsPath = path.resolve(import.meta.dirname, "..", "public", "robots.txt");
    if (fs.existsSync(robotsPath)) {
      res.type("text/plain");
      res.sendFile(robotsPath);
    } else {
      res.status(404).send("Not found");
    }
  });

  // Serve sitemap.xml
  app.get("/sitemap.xml", (req, res) => {
    const sitemapPath = path.resolve(import.meta.dirname, "..", "public", "sitemap.xml");
    if (fs.existsSync(sitemapPath)) {
      res.type("application/xml");
      res.sendFile(sitemapPath);
    } else {
      res.status(404).send("Not found");
    }
  });

  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      // Cache blog list for 10 minutes (public, revalidate)
      res.set('Cache-Control', 'public, max-age=600, must-revalidate');
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      // Cache individual blog posts for 1 hour
      res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      // Cache product list for 15 minutes
      res.set('Cache-Control', 'public, max-age=900, must-revalidate');
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      // Cache individual products for 30 minutes
      res.set('Cache-Control', 'public, max-age=1800, must-revalidate');
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(validatedData);
      
      // Send email notification
      try {
        await sendContactFormEmail({
          name: validatedData.name,
          phone: validatedData.phone,
          email: validatedData.email || undefined,
          service: validatedData.service || undefined,
          location: validatedData.location || undefined,
          urgency: validatedData.urgency || undefined,
          message: validatedData.message || undefined,
          pageContext: validatedData.pageContext || undefined,
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue even if email fails - submission is still saved
      }
      
      res.json({ 
        success: true, 
        message: "Thank you for contacting us! We'll get back to you soon.",
        submissionId: submission.id 
      });
    } catch (error: any) {
      res.status(400).json({ message: "Error submitting form: " + error.message });
    }
  });

  // Service area routes
  app.get("/api/service-areas", async (req, res) => {
    try {
      const areas = await storage.getAllServiceAreas();
      // Cache service areas list for 1 hour (rarely changes)
      res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
      res.json(areas);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch service areas" });
    }
  });

  app.get("/api/service-areas/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const area = await storage.getServiceAreaBySlug(slug);
      if (!area) {
        return res.status(404).json({ message: "Service area not found" });
      }
      // Cache individual service areas for 2 hours
      res.set('Cache-Control', 'public, max-age=7200, must-revalidate');
      res.json(area);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch service area" });
    }
  });

  // Aggregate rating stats endpoint for schema markup
  app.get("/api/reviews/stats", async (req, res) => {
    try {
      const reviews = await storage.getGoogleReviews();
      
      if (reviews.length === 0) {
        // Cache empty result for 5 minutes only
        res.set('Cache-Control', 'public, max-age=300, must-revalidate');
        return res.json({
          ratingValue: null,
          reviewCount: 0
        });
      }

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = (totalRating / reviews.length).toFixed(1);
      
      // Cache stats for 30 minutes (same as reviews)
      res.set('Cache-Control', 'public, max-age=1800, must-revalidate');

      res.json({
        ratingValue: avgRating,
        reviewCount: reviews.length
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch review stats" });
    }
  });

  // Multi-source Reviews endpoint: DataForSEO (Google historical), Facebook, Places API (Google new)
  app.get("/api/reviews", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const minRating = req.query.minRating ? parseInt(req.query.minRating as string) : 4;
      const refresh = req.query.refresh === 'true';
      const source = req.query.source as string | undefined; // Optional: filter by source

      let reviews = await storage.getGoogleReviews();

      // Auto-refresh if no reviews exist or manual refresh requested
      if (refresh || reviews.length === 0) {
        const allReviews: InsertGoogleReview[] = [];
        const placeId = process.env.GOOGLE_PLACE_ID;
        const facebookPageId = process.env.FACEBOOK_PAGE_ID;
        const facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;

        // 1. Fetch ALL Google reviews from DataForSEO (550+ reviews)
        if (placeId) {
          console.log('[Reviews API] Fetching Google reviews from DataForSEO...');
          const dataForSeoReviews = await fetchDataForSeoReviews(placeId);
          console.log(`[Reviews API] DataForSEO returned ${dataForSeoReviews.length} Google reviews`);
          allReviews.push(...dataForSeoReviews);
        }

        // 2. Fetch Facebook reviews
        if (facebookPageId && facebookAccessToken) {
          console.log('[Reviews API] Fetching Facebook reviews...');
          const fbReviews = await fetchFacebookReviews(facebookPageId, facebookAccessToken);
          console.log(`[Reviews API] Facebook returned ${fbReviews.length} reviews`);
          allReviews.push(...fbReviews);
        }

        // 3. Fetch new Google reviews from Places API (max 5, newest)
        console.log('[Reviews API] Fetching newest Google reviews from Places API...');
        const placesReviews = await fetchGoogleReviews();
        console.log(`[Reviews API] Places API returned ${placesReviews.length} reviews`);
        allReviews.push(...placesReviews);

        // Deduplicate reviews by reviewId and text+author combination
        const uniqueReviews = deduplicateReviews(allReviews);
        console.log(`[Reviews API] After deduplication: ${uniqueReviews.length} unique reviews`);

        if (uniqueReviews.length > 0) {
          await storage.clearGoogleReviews();
          await storage.saveGoogleReviews(uniqueReviews);
          reviews = await storage.getGoogleReviews();
          console.log(`[Reviews API] Successfully saved ${reviews.length} reviews to database`);
        }
      }

      // Filter by source if specified
      let filteredReviews = reviews;
      if (source) {
        filteredReviews = reviews.filter(r => r.source === source);
      }

      // Filter by category if specified
      if (category) {
        filteredReviews = filteredReviews.filter(r => 
          r.categories && r.categories.includes(category)
        );
      }
      
      // Filter by minimum rating
      filteredReviews = filteredReviews.filter(r => r.rating >= minRating);
      
      const result = filteredReviews.map(r => ({
        id: r.id,
        authorName: r.authorName,
        authorUrl: r.authorUrl ?? null,
        profilePhotoUrl: r.profilePhotoUrl ?? null,
        rating: r.rating,
        text: r.text,
        relativeTime: r.relativeTime,
        timestamp: r.timestamp,
        categories: r.categories || [],
        fetchedAt: r.fetchedAt,
        source: r.source
      }));

      // Add HTTP caching headers (30 min cache to match TanStack Query staleTime)
      // Skip cache for manual refresh requests
      if (!refresh) {
        res.set('Cache-Control', 'public, max-age=1800, must-revalidate');
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch reviews: " + error.message });
    }
  });

  // Helper function to deduplicate reviews
  function deduplicateReviews(reviews: InsertGoogleReview[]): InsertGoogleReview[] {
    const seen = new Set<string>();
    const unique: InsertGoogleReview[] = [];

    for (const review of reviews) {
      // Create unique key from reviewId (if available) or text+author combination
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

  // Google OAuth routes for My Business API
  app.get("/api/oauth/status", async (req, res) => {
    try {
      const token = await storage.getGoogleOAuthToken('google_my_business');
      res.json({ 
        isAuthenticated: !!token,
        hasAccountId: !!token?.accountId,
        hasLocationId: !!token?.locationId,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to check OAuth status: " + error.message });
    }
  });

  app.get("/api/oauth/init", async (req, res) => {
    try {
      const auth = GoogleMyBusinessAuth.getInstance();
      const authUrl = auth.getAuthUrl();
      res.json({ authUrl });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to initialize OAuth: " + error.message });
    }
  });

  app.get("/api/oauth/callback", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).send('Missing authorization code');
      }

      const auth = GoogleMyBusinessAuth.getInstance();
      const tokens = await auth.getTokenFromCode(code);

      if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
        throw new Error('Invalid tokens received');
      }

      // Check if token already exists
      const existingToken = await storage.getGoogleOAuthToken('google_my_business');
      
      if (existingToken) {
        // Update existing token
        await storage.updateGoogleOAuthToken(existingToken.id, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: new Date(tokens.expiry_date),
        });
      } else {
        // Save new token (account/location IDs will be set separately)
        await storage.saveGoogleOAuthToken({
          service: 'google_my_business',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: new Date(tokens.expiry_date),
          accountId: null,
          locationId: null,
        });
      }

      // Redirect to setup completion page
      res.redirect('/admin/oauth-success');
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      res.status(500).send(`OAuth failed: ${error.message}`);
    }
  });

  app.post("/api/oauth/set-ids", async (req, res) => {
    try {
      const { accountId, locationId } = req.body;
      
      if (!accountId || !locationId) {
        return res.status(400).json({ message: 'Missing account ID or location ID' });
      }

      const token = await storage.getGoogleOAuthToken('google_my_business');
      
      if (!token) {
        return res.status(404).json({ message: 'No OAuth token found. Please authenticate first.' });
      }

      await storage.updateGoogleOAuthToken(token.id, {
        accountId,
        locationId,
      });

      res.json({ message: 'Account and location IDs updated successfully' });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update IDs: " + error.message });
    }
  });

  // Save customer info before payment
  app.post("/api/pending-purchase", async (req, res) => {
    try {
      const { paymentIntentId, productId, customerType, customerName, companyName, 
              contactPersonName, street, city, state, zip, phone, email } = req.body;

      if (!paymentIntentId || !productId || !customerType || !street || !city || 
          !state || !zip || !phone || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (customerType === 'residential' && !customerName) {
        return res.status(400).json({ message: "Customer name is required for residential" });
      }

      if (customerType === 'commercial' && (!companyName || !contactPersonName)) {
        return res.status(400).json({ message: "Company name and contact person are required for commercial" });
      }

      const pendingPurchase = await storage.createPendingPurchase({
        paymentIntentId,
        productId,
        customerType,
        customerName: customerName || null,
        companyName: companyName || null,
        contactPersonName: contactPersonName || null,
        street,
        city,
        state,
        zip,
        phone,
        email,
      });

      res.json({ success: true, id: pendingPurchase.id });
    } catch (error: any) {
      console.error('Error saving pending purchase:', error);
      res.status(500).json({ message: "Failed to save customer info: " + error.message });
    }
  });

  // Stripe webhook endpoint (raw body already applied in server/index.ts)
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).send('Webhook secret not configured');
    }

    if (!sig) {
      return res.status(400).send('No signature');
    }

    let event: Stripe.Event;

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`[Stripe Webhook] Signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);

      try {
        // Find pending purchase by payment intent ID
        const pendingPurchase = await storage.getPendingPurchaseByPaymentIntent(paymentIntent.id);

        if (!pendingPurchase) {
          console.warn(`[Stripe Webhook] No pending purchase found for payment intent: ${paymentIntent.id}`);
          return res.json({ received: true, warning: 'No pending purchase found' });
        }

        // Get product to check if ServiceTitan sync is enabled
        const product = await storage.getProductById(pendingPurchase.productId);

        if (!product) {
          console.error(`[Stripe Webhook] Product not found: ${pendingPurchase.productId}`);
          return res.json({ received: true, error: 'Product not found' });
        }

        if (product.serviceTitanEnabled && product.serviceTitanMembershipTypeId) {
          // Create ServiceTitan membership record
          const membership = await storage.createServiceTitanMembership({
            customerType: pendingPurchase.customerType,
            customerName: pendingPurchase.customerName || null,
            companyName: pendingPurchase.companyName || null,
            contactPersonName: pendingPurchase.contactPersonName || null,
            street: pendingPurchase.street,
            city: pendingPurchase.city,
            state: pendingPurchase.state,
            zip: pendingPurchase.zip,
            phone: pendingPurchase.phone,
            email: pendingPurchase.email,
            serviceTitanMembershipTypeId: product.serviceTitanMembershipTypeId,
            serviceTitanCustomerId: null,
            serviceTitanMembershipId: null,
            serviceTitanInvoiceId: null,
            productId: product.id,
            stripePaymentIntentId: paymentIntent.id,
            stripeCustomerId: paymentIntent.customer as string | null,
            amount: paymentIntent.amount,
            syncStatus: 'pending',
            syncError: null,
          });

          console.log(`[Stripe Webhook] Created ServiceTitan membership record: ${membership.id}`);

          // TODO: Trigger ServiceTitan sync (will be implemented in Task 5)
          // For now, just log that sync would happen
          console.log(`[Stripe Webhook] ServiceTitan sync queued for membership: ${membership.id}`);
        }

        // Clean up pending purchase
        await storage.deletePendingPurchase(pendingPurchase.id);
        console.log(`[Stripe Webhook] Deleted pending purchase: ${pendingPurchase.id}`);

        res.json({ received: true, processed: true });
      } catch (error: any) {
        console.error('[Stripe Webhook] Error processing payment:', error);
        return res.status(500).json({ received: true, error: error.message });
      }
    } else {
      // Return 200 for other event types to acknowledge receipt
      res.json({ received: true });
    }
  });

  // Stripe payment intent endpoint
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      
      if (!stripeSecretKey) {
        return res.status(503).json({ 
          message: "Payment processing is not configured. Please contact us directly at (512) 368-9159." 
        });
      }

      const stripe = new Stripe(stripeSecretKey);
      const { productId, quantity = 1 } = req.body;

      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const amount = Math.round(product.price * quantity); // Price is already in cents

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true, // Enables all available payment methods including Apple Pay, Google Pay, Link, etc.
        },
        metadata: {
          productId: product.id,
          productName: product.name,
          quantity: quantity.toString(),
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        paymentIntentId: paymentIntent.id // Return payment intent ID
      });
    } catch (error: any) {
      res.status(500).json({ message: "Payment initialization failed: " + error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
