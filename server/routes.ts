import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSubmissionSchema } from "@shared/schema";
import Stripe from "stripe";
import { sendContactFormEmail } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Stripe payment intent endpoint
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      
      if (!stripeSecretKey) {
        return res.status(503).json({ 
          message: "Payment processing is not configured. Please contact us directly at (512) 649-2811." 
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
