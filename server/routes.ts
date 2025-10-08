import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSubmissionSchema } from "@shared/schema";
import Stripe from "stripe";
import { sendContactFormEmail } from "./email";
import { fetchGoogleReviews, filterReviewsByKeywords, getHighRatedReviews } from "./lib/googleReviews";
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
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
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
      res.json(area);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch service area" });
    }
  });

  // Google Reviews endpoint with auto-refresh, category and rating filtering
  app.get("/api/reviews", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const minRating = req.query.minRating ? parseInt(req.query.minRating as string) : 4;
      const refresh = req.query.refresh === 'true';

      let reviews = await storage.getGoogleReviews();

      // Auto-refresh if no reviews exist or manual refresh requested
      if (refresh || reviews.length === 0) {
        const freshReviews = await fetchGoogleReviews();
        if (freshReviews.length > 0) {
          await storage.clearGoogleReviews();
          await storage.saveGoogleReviews(freshReviews);
          reviews = await storage.getGoogleReviews();
        }
      }

      // Filter by category if specified
      let filteredReviews = reviews;
      if (category) {
        filteredReviews = reviews.filter(r => 
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
        fetchedAt: r.fetchedAt
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
        metadata: {
          productId: product.id,
          productName: product.name,
          quantity: quantity.toString(),
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Payment initialization failed: " + error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
