import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { getServiceTitanAPI } from "./lib/serviceTitan";
// Marketing imports removed - all marketing infrastructure has been removed

// Declare global types for SSR cache invalidation
declare global {
  var invalidateSSRCache: (() => void) | undefined;
}
import { insertContactSubmissionSchema, insertCustomerSuccessStorySchema, type InsertGoogleReview, companyCamPhotos, blogPosts, importedPhotos, chatbotConversations, chatbotMessages, chatbotAnalytics, chatbotQuickResponses, googleOAuthTokens, googleReviews } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, sql, desc, and, or } from "drizzle-orm";
import Stripe from "stripe";
import multer from "multer";
import { sendContactFormEmail, sendSuccessStoryNotificationEmail } from "./email";
import { fetchGoogleReviews, filterReviewsByKeywords, getHighRatedReviews } from "./lib/googleReviews";
import { GoogleMyBusinessAuth } from "./lib/googleMyBusinessAuth";
import { fetchAllGoogleMyBusinessReviews } from "./lib/googleMyBusinessReviews";

// Configure multer for file uploads (store in memory for processing)
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for large photo uploads
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});
// DataForSEO imports disabled - now using GMB API automation
// import { fetchDataForSeoReviews } from "./lib/dataForSeoReviews";
// import { fetchDataForSeoYelpReviews } from "./lib/dataForSeoYelpReviews";
import { fetchFacebookReviews } from "./lib/facebookReviews";
import { notifySearchEnginesNewPage } from "./lib/sitemapPing";
import { processBlogImage } from "./lib/blogImageProcessor";
import path from "path";
import fs from "fs";
import { ObjectStorageService } from "./objectStorage";
import { analyzeProductionPhoto } from "./lib/productionPhotoAnalyzer";
import OpenAI from "openai";
import { generateH1FromTitle } from "./lib/generateH1";
import sharp from "sharp";

export async function registerRoutes(app: Express): Promise<Server> {
  // Reference: javascript_object_storage integration - public file serving endpoint
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Blog images get 1 year cache, others get 1 hour
      const cacheTtl = filePath.startsWith('blog_images/') ? 31536000 : 3600;
      objectStorageService.downloadObject(file, res, cacheTtl);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve object storage files with full replit-objstore paths
  app.get("/replit-objstore-:bucketId/public/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving object storage file:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve legacy attached_assets files
  app.get("/attached_assets/:filePath(*)", (req, res) => {
    const filePath = req.params.filePath;
    const fullPath = path.resolve(import.meta.dirname, "..", "attached_assets", filePath);
    
    if (fs.existsSync(fullPath)) {
      res.sendFile(fullPath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

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

  // Dynamic sitemap.xml
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const [posts, products] = await Promise.all([
        storage.getBlogPosts(),
        storage.getProducts()
      ]);
      const baseUrl = "https://www.plumbersthatcare.com";
      const now = new Date().toISOString().split('T')[0];
      
      // URLs that redirect (should be excluded from sitemap)
      const redirectUrls = new Set([
        '/hydro-jetting-drainage-solutions',
        '/water-heater-experts-in-austin',
        '/sewer-line-repairs-and-replacements-in-austin-tx',
        '/sewer-lines-repairs-and-replacements-in-austin',
        '/20-gas-pipe-repair',
        '/the-importance-of-water-heater-maintenance-for-austin-homeowners',
        '/why-rheem',
        '/gas-services', // Redirects to /gas-line-services
        '/backflow-testing', // Redirects to /backflow
      ]);
      
      // Static pages with priorities
      const staticPages = [
        { url: '', lastmod: now, changefreq: 'weekly', priority: '1.0' },
        
        // SEO Landing Pages
        { url: 'plumber-near-me', lastmod: now, changefreq: 'weekly', priority: '0.9' },
        
        // Main Service Pages
        { url: 'water-heater-services', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'drain-cleaning', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'leak-repair', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'toilet-faucet', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'backflow', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'commercial-plumbing', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        
        // Additional Service Pages
        { url: 'drainage-solutions', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'faucet-installation', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'garbage-disposal-repair', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'gas-leak-detection', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'gas-line-services', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'hydro-jetting-services', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'permit-resolution-services', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'rooter-services', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'sewage-pump-services', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'services', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'water-heater-guide', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'water-leak-repair', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'water-pressure-solutions', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        
        // Service Area Pages
        { url: 'service-area', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-austin', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-in-cedar-park--tx', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-leander', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'round-rock-plumber', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-georgetown', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-pflugerville', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-liberty-hill', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-buda', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-kyle', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-marble-falls', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-burnet', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-horseshoe-bay', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-kingsland', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-granite-shoals', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-bertram', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'plumber-spicewood', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        
        // Main Pages
        { url: 'about', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'contact', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'faq', lastmod: now, changefreq: 'monthly', priority: '0.7' },
        { url: 'privacy-policy', lastmod: now, changefreq: 'yearly', priority: '0.3' },
        { url: 'refund_returns', lastmod: now, changefreq: 'yearly', priority: '0.3' },
        { url: 'membership-benefits', lastmod: now, changefreq: 'monthly', priority: '0.7' },
        
        // Store Pages
        { url: 'store', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        
        // Blog & Success Stories
        { url: 'blog', lastmod: now, changefreq: 'weekly', priority: '0.8' },
        { url: 'success-stories', lastmod: now, changefreq: 'weekly', priority: '0.8' },
        
        // Appointment & Emergency
        { url: 'schedule-appointment', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'emergency-plumbing', lastmod: now, changefreq: 'monthly', priority: '0.9' },
      ];
      
      // Generate static page URLs
      const staticUrls = staticPages.map(page => `  <url>
    <loc>${baseUrl}/${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');
      
      // Generate blog post URLs (sorted by newest first)
      // Exclude posts that have 301 redirects set up
      const blogUrls = posts
        .filter(post => !redirectUrls.has(`/${post.slug}`))
        .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
        .map(post => {
          const postDate = new Date(post.publishDate).toISOString().split('T')[0];
          return `  <url>
    <loc>${baseUrl}/${post.slug}</loc>
    <lastmod>${postDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
        }).join('\n');
      
      // Product URLs removed - Square Online now manages products
      // Old Ecwid product checkout URLs redirect to /store, causing "3XX redirect in sitemap" error
      const productUrls = '';
      
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${blogUrls}
${productUrls}
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
      res.send(sitemap);
    } catch (error) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('Failed to generate sitemap');
    }
  });

  app.get("/api/blog", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const category = req.query.category as string;

      const allPosts = await storage.getBlogPosts();
      
      // Filter by category if provided
      const filteredPosts = category && category !== "All" 
        ? allPosts.filter(post => post.category === category)
        : allPosts;

      // Calculate pagination
      const total = filteredPosts.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedPosts = filteredPosts.slice(offset, offset + limit);

      // Cache blog list for 10 minutes (public, revalidate)
      res.set('Cache-Control', 'public, max-age=600, must-revalidate');
      res.json({
        posts: paginatedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/categories", async (req, res) => {
    try {
      const allPosts = await storage.getBlogPosts();
      
      // Extract unique categories from all published posts
      const categoriesSet = new Set<string>();
      allPosts.forEach(post => {
        if (post.category) {
          categoriesSet.add(post.category);
        }
      });
      
      // Convert to sorted array (alphabetically)
      const categories = Array.from(categoriesSet).sort();
      
      // Cache categories for 1 hour
      res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get photos available for blog generation (MUST be before :slug wildcard)
  app.get("/api/blog/available-photos", async (req, res) => {
    try {
      const photos = await storage.getPhotosWithoutBlogTopic();
      
      res.json({
        success: true,
        count: photos.length,
        photos: photos.map(p => ({
          id: p.id,
          category: p.category,
          qualityScore: p.qualityScore,
          aiDescription: p.aiDescription,
          photoUrl: p.photoUrl
        }))
      });
    } catch (error: any) {
      console.error("Error fetching available photos:", error);
      res.status(500).json({ message: "Failed to fetch available photos" });
    }
  });

  // Generate historic blog posts by category (MUST be before :slug wildcard)
  app.post("/api/blog/generate-historic-by-category", async (req, res) => {
    try {
      const { category, postsPerCategory = 9 } = req.body;
      
      console.log(`[Historic Blog Generation] Starting generation of ${postsPerCategory} posts per category...`);
      
      // Get all blog categories from database
      const categoryResult = await db.select({ category: blogPosts.category })
        .from(blogPosts)
        .groupBy(blogPosts.category);
      
      const categories = categoryResult.map(r => r.category);
      console.log(`[Historic Blog Generation] Found ${categories.length} categories:`, categories);
      
      // Filter to specific category if provided
      const targetCategories = category ? [category] : categories;
      
      const { suggestBlogTopic, generateBlogPost } = await import("./lib/blogTopicAnalyzer");
      
      const allGeneratedBlogs = [];
      
      for (const targetCategory of targetCategories) {
        console.log(`[Historic Blog Generation] Processing category: ${targetCategory}`);
        
        // Get available photos for this category
        const photos = await storage.getPhotosWithoutBlogTopic();
        const categoryPhotos = photos.filter(p => {
          const photoCategory = p.category?.toLowerCase() || '';
          const targetCat = targetCategory.toLowerCase();
          
          // Match by category name
          return photoCategory.includes(targetCat.replace(/\s+/g, '_')) || 
                 targetCat.includes(photoCategory.replace(/\s+/g, '_'));
        });
        
        console.log(`[Historic Blog Generation] Found ${categoryPhotos.length} unused photos for ${targetCategory}`);
        
        if (categoryPhotos.length === 0) {
          console.warn(`[Historic Blog Generation] No photos available for ${targetCategory}, skipping...`);
          continue;
        }
        
        // Use up to postsPerCategory photos
        const photosToUse = categoryPhotos.slice(0, Math.min(postsPerCategory, categoryPhotos.length));
        
        // Generate blog posts
        for (const photo of photosToUse) {
          try {
            // Step 1: Suggest blog topic (same params as before: gpt-4o, temp 0.8)
            const topicSuggestion = await suggestBlogTopic(photo);
            await storage.updatePhotoWithBlogTopic(photo.id, topicSuggestion.title);
            
            // Step 2: Generate blog post (same params: gpt-4o, temp 0.9)
            const blogPost = await generateBlogPost(photo, topicSuggestion);
            
            // Step 3: Create historic date (1-3 years ago, random)
            const now = new Date();
            const minDaysAgo = 365; // 1 year ago minimum
            const maxDaysAgo = 1095; // 3 years ago maximum
            const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo) + minDaysAgo);
            const publishDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
            
            // Step 4: Process image with smart crop (16:9 @ 1200x675)
            let featuredImage = null;
            let jpegFeaturedImage = null;
            if (photo.photoUrl) {
              try {
                console.log(`[Historic Blog Generation] Processing image for: ${blogPost.title}`);
                const processedImage = await processBlogImage(photo.photoUrl, blogPost.title);
                featuredImage = processedImage.imagePath;
                jpegFeaturedImage = processedImage.jpegImagePath;
                console.log(`[Historic Blog Generation] Cropped images saved - WebP: ${featuredImage}, JPEG: ${jpegFeaturedImage}`);
              } catch (imageError) {
                console.error(`[Historic Blog Generation] ⚠️ Image processing failed, attempting simple conversion:`, imageError);
                // Fallback: Convert WebP to JPEG without cropping
                try {
                  const sharpLib = (await import("sharp")).default;
                  const objectStorage = new ObjectStorageService();
                  
                  // Download WebP image
                  const webpBuffer = await objectStorage.downloadBuffer(photo.photoUrl);
                  if (webpBuffer) {
                    // Convert to JPEG
                    const jpegBuffer = await sharpLib(webpBuffer)
                      .jpeg({ quality: 90 })
                      .toBuffer();
                    
                    // Upload JPEG with same path but .jpg extension
                    const jpegPath = photo.photoUrl.replace(/\.webp$/i, '.jpg');
                    await objectStorage.uploadBuffer(jpegBuffer, jpegPath, 'image/jpeg');
                    
                    featuredImage = photo.photoUrl;
                    jpegFeaturedImage = jpegPath;
                    console.log(`[Historic Blog Generation] ✅ Fallback JPEG created: ${jpegPath}`);
                  } else {
                    // Last resort: use WebP for both (RSS readers may support it)
                    featuredImage = photo.photoUrl;
                    jpegFeaturedImage = photo.photoUrl;
                    console.warn(`[Historic Blog Generation] ⚠️ Using WebP for both formats`);
                  }
                } catch (conversionError) {
                  console.error(`[Historic Blog Generation] ❌ JPEG conversion failed:`, conversionError);
                  // Last resort: use WebP for both
                  featuredImage = photo.photoUrl;
                  jpegFeaturedImage = photo.photoUrl;
                }
              }
            }
            
            // Step 5: Save to database
            const saved = await storage.createBlogPost({
              title: blogPost.title,
              slug: blogPost.slug,
              content: blogPost.content,
              excerpt: blogPost.excerpt,
              metaDescription: blogPost.metaDescription,
              category: blogPost.category,
              featuredImage,
              jpegFeaturedImage,
              author: "Economy Plumbing",
              published: true,
              h1: generateH1FromTitle(blogPost.title),
            });
            
            // Update with historic date and metadata
            await storage.updateBlogPost(saved.id, {
              publishDate,
              imageId: photo.id,
              generatedByAI: true,
            } as any);
            
            // Mark photo as used
            await storage.markPhotoAsUsed(photo.id, saved.id);
            
            allGeneratedBlogs.push({
              ...saved,
              publishDate,
              category: targetCategory
            });
            
            console.log(`[Historic Blog Generation] ✅ Created: "${blogPost.title}" (${targetCategory}, ${publishDate.toISOString().split('T')[0]})`);
          } catch (error: any) {
            console.error(`[Historic Blog Generation] Error generating blog for photo ${photo.id}:`, error);
          }
        }
      }
      
      console.log(`[Historic Blog Generation] Successfully generated ${allGeneratedBlogs.length} historic blog posts`);
      
      // Group by category for response
      const blogsByCategory: Record<string, any[]> = {};
      for (const blog of allGeneratedBlogs) {
        if (!blogsByCategory[blog.category]) {
          blogsByCategory[blog.category] = [];
        }
        blogsByCategory[blog.category].push({
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
          publishDate: blog.publishDate,
          excerpt: blog.excerpt
        });
      }
      
      res.json({
        success: true,
        generated: allGeneratedBlogs.length,
        categories: Object.keys(blogsByCategory).length,
        blogsByCategory,
        message: `Successfully generated ${allGeneratedBlogs.length} historic blog posts across ${Object.keys(blogsByCategory).length} categories`
      });
    } catch (error: any) {
      console.error("[Historic Blog Generation] Error:", error);
      res.status(500).json({
        message: "Historic blog generation failed",
        error: error.message
      });
    }
  });

  // Helper function to convert images to JPEG for RSS feeds
  const convertImageToJPEG = async (encodedPath: string, res: any) => {
    try {
      // Decode the base64-encoded path
      const imageUrl = Buffer.from(encodedPath, 'base64').toString('utf-8');
      
      let imageBuffer: Buffer;

      // Handle different image sources
      if (imageUrl.startsWith('http')) {
        // External URL
        const response = await fetch(imageUrl);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        // Local/object storage path
        const sharp = await import('sharp');
        const fs = await import('fs/promises');
        const { ObjectStorageService } = await import('./objectStorage');
        const objectStorage = new ObjectStorageService();
        
        // Normalize path for object storage
        let normalizedPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        
        // Remove bucket-specific prefix patterns
        // Pattern: replit-objstore-{id}/public/ or public-objects/
        if (normalizedPath.includes('/public/')) {
          normalizedPath = normalizedPath.split('/public/')[1];
        } else if (normalizedPath.startsWith('public-objects/')) {
          normalizedPath = normalizedPath.substring('public-objects/'.length);
        }
        
        try {
          // Try object storage first
          const file = await objectStorage.searchPublicObject(normalizedPath);
          if (file) {
            const [buffer] = await file.download();
            imageBuffer = buffer;
          } else {
            // Fall back to local filesystem with original path (without leading slash)
            const fsPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
            imageBuffer = await fs.readFile(fsPath);
          }
        } catch {
          // Last resort: try filesystem with original path (without leading slash)
          const fsPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
          imageBuffer = await fs.readFile(fsPath);
        }
      }

      // Convert to JPEG
      const sharp = await import('sharp');
      const jpegBuffer = await sharp.default(imageBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();

      // Cache for 1 year (images don't change)
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(jpegBuffer);
    } catch (error: any) {
      console.error("Error converting image to JPEG:", error);
      res.status(500).json({ message: "Failed to convert image" });
    }
  };

  // Convert blog image to JPEG for RSS feeds - with .jpg extension for RSS reader compatibility
  app.get("/api/blog/images/:encodedPath.jpg", async (req, res) => {
    await convertImageToJPEG(req.params.encodedPath, res);
  });

  // Convert success story image to JPEG for RSS feeds - with .jpg extension for RSS reader compatibility
  app.get("/api/success-stories/images/:encodedPath.jpg", async (req, res) => {
    await convertImageToJPEG(req.params.encodedPath, res);
  });

  // Legacy endpoint - kept for backwards compatibility
  app.get("/api/blog/image-jpeg", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "url parameter is required" });
      }

      let imageBuffer: Buffer;

      // Handle different image sources
      if (imageUrl.startsWith('http')) {
        // External URL
        const response = await fetch(imageUrl);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        // Local/object storage path
        const sharp = await import('sharp');
        const fs = await import('fs/promises');
        const { ObjectStorageService } = await import('./objectStorage');
        const objectStorage = new ObjectStorageService();
        
        // Normalize path for object storage: remove leading slash and 'public-objects/' prefix
        let normalizedPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        if (normalizedPath.startsWith('public-objects/')) {
          normalizedPath = normalizedPath.substring('public-objects/'.length);
        }
        
        try {
          // Try object storage first
          const file = await objectStorage.searchPublicObject(normalizedPath);
          if (file) {
            const [buffer] = await file.download();
            imageBuffer = buffer;
          } else {
            // Fall back to local filesystem
            imageBuffer = await fs.readFile(normalizedPath);
          }
        } catch {
          // Last resort: try filesystem
          imageBuffer = await fs.readFile(normalizedPath);
        }
      }

      // Convert to JPEG
      const sharp = await import('sharp');
      const jpegBuffer = await sharp.default(imageBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();

      // Cache for 1 year (images don't change)
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(jpegBuffer);
    } catch (error: any) {
      console.error("Error converting blog image to JPEG:", error);
      res.status(500).json({ message: "Failed to convert image" });
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

  // Create new blog post (triggers sitemap ping)
  app.post("/api/blog", async (req, res) => {
    try {
      // Automatically generate H1 if not provided
      const postData = {
        ...req.body,
        h1: req.body.h1 || generateH1FromTitle(req.body.title)
      };
      
      const newPost = await storage.createBlogPost(postData);
      
      // Notify search engines about new page
      notifySearchEnginesNewPage('blog post');
      
      // Invalidate SSR cache (new content published)
      if (global.invalidateSSRCache) global.invalidateSSRCache();
      
      res.status(201).json(newPost);
    } catch (error) {
      console.error('[Blog] Error creating blog post:', error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  // Process blog image to create smart crop
  app.post("/api/blog/process-image", async (req, res) => {
    try {
      const { imagePath, blogTitle } = req.body;
      
      if (!imagePath) {
        return res.status(400).json({ message: "imagePath is required" });
      }

      console.log(`📸 [API] Processing blog image: ${imagePath}`);
      const processedImages = await processBlogImage(imagePath, blogTitle);
      
      res.json({ 
        original: imagePath,
        cropped: processedImages.imagePath,
        jpegCropped: processedImages.jpegImagePath,
        focalPointX: processedImages.focalPointX,
        focalPointY: processedImages.focalPointY,
        message: "Image processed successfully" 
      });
    } catch (error) {
      console.error('[API] Error processing blog image:', error);
      res.status(500).json({ message: "Failed to process image" });
    }
  });

  // Public API: Get page metadata by path
  app.get("/api/page-metadata", async (req, res) => {
    try {
      const path = req.query.path as string;
      
      if (!path) {
        return res.status(400).json({ message: "Path parameter is required" });
      }

      const metadata = await storage.getPageMetadataByPath(path);
      
      if (!metadata) {
        return res.status(404).json({ message: "No custom metadata found for this page" });
      }

      // Cache for 5 minutes
      res.set('Cache-Control', 'public, max-age=300, must-revalidate');
      res.json(metadata);
    } catch (error) {
      console.error('[API] Error fetching page metadata:', error);
      res.status(500).json({ message: "Failed to fetch page metadata" });
    }
  });

  // RSS Feed
  app.get("/rss.xml", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      const baseUrl = "https://www.plumbersthatcare.com";
      
      const rssItems = posts
        .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
        .map(post => {
          const postUrl = `${baseUrl}/${post.slug}`;
          
          // Use pre-generated JPEG version for RSS feed
          let imageUrl = `${baseUrl}/attached_assets/logo.jpg`; // Default fallback
          
          if (post.jpegFeaturedImage) {
            // Use the pre-generated JPEG version (created at blog post creation)
            imageUrl = post.jpegFeaturedImage.startsWith('http') 
              ? post.jpegFeaturedImage 
              : `${baseUrl}${post.jpegFeaturedImage}`;
          } else if (post.featuredImage) {
            // Fallback: use featuredImage if no JPEG version exists (for old posts)
            imageUrl = post.featuredImage.startsWith('http') 
              ? post.featuredImage 
              : `${baseUrl}${post.featuredImage}`;
          }
          
          // HTML-escape the title for safe use in attributes
          const escapedTitle = post.title
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
          
          // Always use JPEG for RSS feed enclosures
          const imageType = 'image/jpeg';
          
          // Create content with image embedded for better RSS reader display
          const contentWithImage = post.featuredImage 
            ? `<img src="${imageUrl}" alt="${escapedTitle}" style="max-width: 100%; height: auto; margin-bottom: 1em;" /><br/>${post.content}`
            : post.content;
          
          return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${new Date(post.publishDate).toUTCString()}</pubDate>
      <description><![CDATA[${post.metaDescription || post.excerpt || ''}]]></description>
      <content:encoded><![CDATA[${contentWithImage}]]></content:encoded>
      <category>${post.category}</category>
      <author>${post.author}</author>
      ${post.featuredImage ? `<enclosure url="${imageUrl}" type="${imageType}" length="0" />` : ''}
      ${post.featuredImage ? `<media:content url="${imageUrl}" type="${imageType}" medium="image"><media:title><![CDATA[${post.title}]]></media:title></media:content>` : ''}
    </item>`;
        }).join('\n');

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Economy Plumbing Services Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Expert plumbing tips, water heater advice, and home maintenance guides from Economy Plumbing Austin</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>`;

      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
      res.send(rss);
    } catch (error) {
      console.error('RSS feed error:', error);
      res.status(500).send('Failed to generate RSS feed');
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

  // Create new product (triggers sitemap ping)
  app.post("/api/products", async (req, res) => {
    try {
      const newProduct = await storage.createProduct(req.body);
      
      // Notify search engines about new product page
      notifySearchEnginesNewPage('product');
      
      res.status(201).json(newProduct);
    } catch (error) {
      console.error('[Products] Error creating product:', error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update product
  app.patch("/api/products/:id", async (req, res) => {
    try {
      const updatedProduct = await storage.updateProduct(req.params.id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      console.error('[Products] Error updating product:', error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Create new service area (triggers sitemap ping)
  app.post("/api/service-areas", async (req, res) => {
    try {
      const newArea = await storage.createServiceArea(req.body);
      
      // Notify search engines about new service area page
      notifySearchEnginesNewPage('service area');
      
      res.status(201).json(newArea);
    } catch (error) {
      console.error('[Service Areas] Error creating service area:', error);
      res.status(500).json({ message: "Failed to create service area" });
    }
  });

  // OTP Authentication endpoints for Customer Portal
  app.post("/api/otp/send", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      // Get Twilio SMS service
      const { getTwilioSMS } = await import('./lib/twilioSMS');
      const twilioSMS = getTwilioSMS();
      
      if (!twilioSMS) {
        return res.status(503).json({ message: "SMS service not available. Please call us instead." });
      }

      // Create OTP code
      const { getOTPStore } = await import('./lib/otpStore');
      const otpStore = getOTPStore();
      const code = otpStore.createOTP(phoneNumber);
      
      if (!code) {
        return res.status(429).json({ message: "Please wait a minute before requesting another code" });
      }

      // Send via SMS
      const sent = await twilioSMS.sendOTP(phoneNumber, code);
      
      if (!sent) {
        return res.status(500).json({ message: "Failed to send verification code. Please try again." });
      }

      console.log(`[OTP] Sent code to ${phoneNumber}`);
      res.json({ message: "Verification code sent!" });
    } catch (error: any) {
      console.error('[OTP] Error sending code:', error);
      res.status(500).json({ message: "Error sending code: " + error.message });
    }
  });

  app.post("/api/otp/verify", async (req, res) => {
    try {
      const { phoneNumber, code } = req.body;
      
      if (!phoneNumber || !code) {
        return res.status(400).json({ message: "Phone number and code are required" });
      }

      // Verify OTP
      const { getOTPStore } = await import('./lib/otpStore');
      const otpStore = getOTPStore();
      const valid = otpStore.verifyOTP(phoneNumber, code);
      
      if (!valid) {
        return res.status(401).json({ message: "Invalid or expired code" });
      }

      console.log(`[OTP] ✅ Verified for ${phoneNumber}`);
      
      // Return success - client can now proceed with customer lookup
      res.json({ 
        verified: true,
        message: "Phone number verified!" 
      });
    } catch (error: any) {
      console.error('[OTP] Error verifying code:', error);
      res.status(500).json({ message: "Error verifying code: " + error.message });
    }
  });

  // Spam protection: Rate limiting map (IP -> last submission timestamp)
  const submissionRateLimit = new Map<string, number>();
  const RATE_LIMIT_WINDOW = 60000; // 1 minute

  app.post("/api/contact", async (req, res) => {
    try {
      // Get client IP
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      
      // Spam protection 1: Honeypot field check
      // Bots fill this field, humans don't see it
      if (req.body.website || req.body.url || req.body.company_website) {
        console.log('[Spam] Honeypot triggered for IP:', clientIp);
        return res.status(400).json({ message: "Invalid form submission" });
      }
      
      // Spam protection 2: Rate limiting per IP
      const now = Date.now();
      const lastSubmission = submissionRateLimit.get(clientIp);
      if (lastSubmission && (now - lastSubmission) < RATE_LIMIT_WINDOW) {
        console.log('[Spam] Rate limit exceeded for IP:', clientIp);
        return res.status(429).json({ 
          message: "Too many submissions. Please wait a moment before trying again." 
        });
      }
      
      // Spam protection 3: Timestamp validation (reject if submitted too quickly)
      // Check if formStartTime was sent (in milliseconds)
      if (req.body.formStartTime) {
        const formStartTime = parseInt(req.body.formStartTime);
        const fillTime = now - formStartTime;
        if (fillTime < 3000) { // Less than 3 seconds to fill form
          console.log('[Spam] Form filled too quickly (bot suspected) for IP:', clientIp, 'Fill time:', fillTime);
          return res.status(400).json({ message: "Invalid form submission" });
        }
      }
      
      // Remove spam protection fields before validation
      const { website, url, company_website, formStartTime, ...contactData } = req.body;
      const validatedData = insertContactSubmissionSchema.parse(contactData);
      const submission = await storage.createContactSubmission(validatedData);
      
      // Update rate limit tracking
      submissionRateLimit.set(clientIp, now);
      
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

  // ============================================
  // CUSTOM REVIEW SYSTEM ENDPOINTS
  // ============================================

  // Public: Submit a review (with spam protection)
  app.post("/api/reviews/submit", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const now = Date.now();
      
      // Spam protection: Rate limiting per IP
      const lastSubmission = submissionRateLimit.get(clientIp);
      if (lastSubmission && (now - lastSubmission) < RATE_LIMIT_WINDOW) {
        console.log('[Spam] Rate limit exceeded for review from IP:', clientIp);
        return res.status(429).json({ 
          message: "Too many submissions. Please wait a moment before trying again." 
        });
      }
      
      // Honeypot check
      if (req.body.website || req.body.url) {
        console.log('[Spam] Honeypot triggered for review from IP:', clientIp);
        return res.status(400).json({ message: "Invalid form submission" });
      }
      
      // Remove spam fields and validate
      const { website, url, ...reviewData } = req.body;
      
      // Validate required fields
      if (!reviewData.customerName || !reviewData.rating || !reviewData.text) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Insert review into database
      const review = await storage.createCustomReview({
        ...reviewData,
        ipAddress: clientIp,
        userAgent: userAgent,
        status: 'pending', // All reviews start as pending moderation
        source: reviewData.requestId ? 'email_link' : 'website',
      });
      
      // Update rate limit tracking
      submissionRateLimit.set(clientIp, now);
      
      console.log(`[Review] New submission from ${reviewData.customerName} (${review.rating} stars)`);

      // If 4+ star review AND we have customer email + ID, create referral nurture campaign
      if (review.rating >= 4 && reviewData.email && reviewData.serviceTitanCustomerId) {
        try {
          const { getReferralNurtureScheduler } = await import('./lib/referralNurtureScheduler');
          const scheduler = getReferralNurtureScheduler();
          
          const campaignId = await scheduler.createCampaignForReviewer(
            reviewData.serviceTitanCustomerId,
            reviewData.email,
            review.id
          );
          
          if (campaignId) {
            console.log(`[Review] Created referral nurture campaign ${campaignId} for ${reviewData.email}`);
          }
        } catch (campaignError: any) {
          // Don't fail the whole request if campaign creation fails
          console.error('[Review] Error creating referral campaign:', campaignError);
        }
      }
      
      res.json({ 
        success: true, 
        message: "Thank you for your review! It will be published after moderation.",
        reviewId: review.id 
      });
    } catch (error: any) {
      console.error('[Review] Submission error:', error);
      res.status(400).json({ message: "Error submitting review: " + error.message });
    }
  });

  // Public: Submit private feedback (for negative ratings)
  app.post("/api/reviews/private-feedback", async (req, res) => {
    try {
      const { customerId, rating, feedback, customerName, customerEmail } = req.body;

      // Validate required fields
      if (!rating || !feedback) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Log the private feedback (you can extend this to save to database if needed)
      console.log('[Private Feedback] Received:', {
        customerId,
        customerName,
        customerEmail,
        rating,
        feedback,
        timestamp: new Date().toISOString()
      });

      res.json({ 
        success: true, 
        message: "Thank you for your feedback. We'll review it and work to improve."
      });
    } catch (error: any) {
      console.error('[Private Feedback] Error:', error);
      res.status(400).json({ message: "Error submitting feedback: " + error.message });
    }
  });

  // Public: Submit review feedback (rating-first flow for /request-review page)
  app.post("/api/review-feedback", async (req, res) => {
    try {
      const { rating, feedback, reviewRequestId, customerId, customerEmail } = req.body;
      const { reviewFeedback } = await import("@shared/schema");

      // Validate required fields
      if (!rating || !feedback) {
        return res.status(400).json({ message: "Rating and feedback are required" });
      }

      // Insert feedback into database
      const [newFeedback] = await db
        .insert(reviewFeedback)
        .values({
          reviewRequestId: reviewRequestId || '',
          customerId: customerId || 0,
          rating,
          feedbackText: feedback,
          submittedAt: new Date(),
        })
        .returning();

      console.log(`[Review Feedback] Received ${rating}-star feedback from /request-review page`);

      // If 4+ star review AND we have customer email, create referral nurture campaign
      if (rating >= 4 && customerEmail && customerId) {
        try {
          const { getReferralNurtureScheduler } = await import('./lib/referralNurtureScheduler');
          const scheduler = getReferralNurtureScheduler();
          
          const campaignId = await scheduler.createCampaignForReviewer(
            customerId,
            customerEmail,
            reviewRequestId || newFeedback.id
          );
          
          if (campaignId) {
            console.log(`[Review Feedback] Created referral nurture campaign ${campaignId} for ${customerEmail}`);
          }
        } catch (campaignError: any) {
          // Don't fail the whole request if campaign creation fails
          console.error('[Review Feedback] Error creating referral campaign:', campaignError);
        }
      }

      res.json({ 
        success: true, 
        message: "Thank you for your feedback. We'll use it to improve our service.",
        feedbackId: newFeedback.id
      });
    } catch (error: any) {
      console.error('[Review Feedback] Error:', error);
      res.status(500).json({ message: "Error submitting feedback: " + error.message });
    }
  });

  // Public: Get approved reviews for display (merges Google reviews + custom reviews)
  app.get("/api/reviews", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const featured = req.query.featured === 'true';
      const category = req.query.category as string | undefined;
      const minRating = req.query.minRating ? parseInt(req.query.minRating as string) : undefined;
      
      // Get both Google reviews and custom reviews
      const [googleReviews, customReviews] = await Promise.all([
        storage.getGoogleReviews(),
        storage.getApprovedReviews({ limit: undefined, featured })
      ]);
      
      // Map custom reviews to GoogleReview format for unified display
      const mappedCustomReviews = customReviews.map((review) => ({
        id: review.id,
        authorName: review.customerName,
        authorUrl: null,
        profilePhotoUrl: review.photoUrls && review.photoUrls.length > 0 ? review.photoUrls[0] : null,
        rating: review.rating,
        text: review.text,
        relativeTime: `${Math.floor((Date.now() - new Date(review.submittedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`,
        timestamp: Math.floor(new Date(review.submittedAt).getTime() / 1000),
        categories: [] as string[],
        source: 'custom_review',
        reviewId: review.id,
      }));
      
      // Merge and sort all reviews by timestamp (newest first)
      let allReviews = [...googleReviews, ...mappedCustomReviews].sort(
        (a, b) => b.timestamp - a.timestamp
      );
      
      // Apply category filter if provided
      if (category) {
        allReviews = allReviews.filter(review => 
          review.categories && Array.isArray(review.categories) && review.categories.includes(category)
        );
      }
      
      // Apply minimum rating filter if provided
      if (minRating) {
        allReviews = allReviews.filter(review => review.rating >= minRating);
      }
      
      // Apply limit if provided
      if (limit) {
        allReviews = allReviews.slice(0, limit);
      }
      
      res.json(allReviews);
    } catch (error: any) {
      console.error('[Review] Error fetching reviews:', error);
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });

  // Referral submission endpoint
  app.post("/api/referrals/submit", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      
      // Spam protection: Rate limiting per IP
      const lastSubmission = submissionRateLimit.get(clientIp);
      if (lastSubmission && (now - lastSubmission) < RATE_LIMIT_WINDOW) {
        console.log('[Spam] Rate limit exceeded for referral from IP:', clientIp);
        return res.status(429).json({ 
          message: "Too many submissions. Please wait a moment before trying again." 
        });
      }
      
      // Update rate limit tracking
      submissionRateLimit.set(clientIp, now);
      
      // Validate referral data
      const { referrerName, referrerPhone, referrerEmail, refereeName, refereePhone, refereeEmail } = req.body;
      
      if (!referrerName || !referrerPhone || !refereeName || !refereePhone) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Try to find referrer's ServiceTitan customer ID from DATABASE (fast!)
      const { customersXlsx, contactsXlsx } = await import('@shared/schema');
      let referrerCustomerId: number | null = null;
      
      try {
        // Search by phone in contacts_xlsx
        let referrerContact = await db
          .select({ customerId: contactsXlsx.customerId })
          .from(contactsXlsx)
          .where(sql`${contactsXlsx.normalizedValue} LIKE ${`%${referrerPhone.replace(/\D/g, '')}%`}`)
          .limit(1);
        
        // If not found by phone and email provided, try email
        if (referrerContact.length === 0 && referrerEmail) {
          referrerContact = await db
            .select({ customerId: contactsXlsx.customerId })
            .from(contactsXlsx)
            .where(sql`${contactsXlsx.normalizedValue} LIKE ${`%${referrerEmail.toLowerCase()}%`}`)
            .limit(1);
        }
        
        if (referrerContact.length > 0 && referrerContact[0].customerId) {
          referrerCustomerId = referrerContact[0].customerId;
          console.log(`[Referral] ✅ Matched referrer to customer ${referrerCustomerId} (database)`);
        } else {
          console.log('[Referral] ❌ Could not find referrer in database - not a customer');
          // REJECT: Referrer must be an existing customer
          return res.status(400).json({
            success: false,
            message: "We couldn't find your account in our system. You must be an existing customer to refer friends. If you believe this is an error, please call us at (512) 392-4689.",
            notCustomer: true
          });
        }
      } catch (error) {
        console.error('[Referral] Error looking up referrer in database:', error);
        return res.status(500).json({
          success: false,
          message: "Error validating your account. Please try again or call us at (512) 392-4689.",
        });
      }

      // CRITICAL: Check if referee is ALREADY a customer (ineligible for referral)
      // Use DATABASE check for speed (instant vs hours for API)
      let refereeCustomerId: number | null = null;
      let isExistingCustomer = false;
      
      try {
        // Search for referee in customers_xlsx by phone/email
        let refereeContact = await db
          .select({ customerId: contactsXlsx.customerId })
          .from(contactsXlsx)
          .where(sql`${contactsXlsx.normalizedValue} LIKE ${`%${refereePhone.replace(/\D/g, '')}%`}`)
          .limit(1);
        
        // If not found by phone and email provided, try email
        if (refereeContact.length === 0 && refereeEmail) {
          refereeContact = await db
            .select({ customerId: contactsXlsx.customerId })
            .from(contactsXlsx)
            .where(sql`${contactsXlsx.normalizedValue} LIKE ${`%${refereeEmail.toLowerCase()}%`}`)
            .limit(1);
        }
        
        if (refereeContact.length > 0 && refereeContact[0].customerId) {
          isExistingCustomer = true;
          refereeCustomerId = refereeContact[0].customerId;
          console.log(`[Referral] ❌ Referee "${refereeName}" is ALREADY a customer (ID: ${refereeCustomerId}) - ineligible`);
          
          // REJECT with friendly message
          return res.status(400).json({ 
            success: false,
            message: `It looks like ${refereeName} is already a valued customer! Referrals are for new customers only. Thank you for thinking of us!`,
            alreadyCustomer: true
          });
        } else {
          console.log(`[Referral] ✅ Referee "${refereeName}" is NOT yet a customer - eligible`);
        }
      } catch (error) {
        console.error('[Referral] Error checking referee in database:', error);
        // Continue - we'll check later
      }
      
      // Store referral in database
      const { referrals } = await import('@shared/schema');
      const [referral] = await db.insert(referrals).values({
        referrerName,
        referrerPhone,
        referrerCustomerId,
        refereeName,
        refereePhone,
        refereeEmail: refereeEmail || null,
        refereeCustomerId: isExistingCustomer ? refereeCustomerId : null,
        status: 'pending',
        creditNotes: isExistingCustomer ? 'Referee was already a customer when referral submitted - ineligible' : null,
      }).returning();
      
      console.log(`[Referral] Created referral ${referral.id} - Referrer: ${referrerName}, Referee: ${refereeName}`);
      
      // Send welcome email to referee (if email provided)
      if (refereeEmail) {
        try {
          const { generateRefereeWelcomeEmail } = await import('./lib/aiEmailGenerator');
          const { refereeWelcomeEmails } = await import('@shared/schema');
          const { canSendEmail, addUnsubscribeFooter, addUnsubscribeFooterPlainText } = await import('./lib/emailPreferenceEnforcer');
          
          // Check email preferences before sending
          const prefCheck = await canSendEmail(refereeEmail, { type: 'referral' });
          
          if (!prefCheck.canSend) {
            console.log(`[Referral] Skipping welcome email - ${prefCheck.reason}`);
            return;
          }
          
          console.log(`[Referral] Generating welcome email for ${refereeName}...`);
          
          // Generate AI-powered welcome email
          const emailContent = await generateRefereeWelcomeEmail({
            refereeName,
            referrerName,
            phoneNumber: undefined,
          });
          
          // Add unsubscribe footer
          const htmlWithFooter = addUnsubscribeFooter(emailContent.bodyHtml, prefCheck.unsubscribeUrl!);
          const plainWithFooter = addUnsubscribeFooterPlainText(emailContent.bodyPlain, prefCheck.unsubscribeUrl!);
          
          // Save to database
          const [welcomeEmail] = await db.insert(refereeWelcomeEmails).values({
            referralId: referral.id,
            refereeName,
            refereeEmail,
            referrerName,
            subject: emailContent.subject,
            htmlContent: htmlWithFooter,
            plainTextContent: plainWithFooter,
            status: 'queued',
            generatedByAI: true,
            aiPrompt: `Welcome email for referee ${refereeName}, referred by ${referrerName}`,
          }).returning();
          
          // Send via Resend with unsubscribe headers
          const { getResendClient } = await import('./lib/resendClient');
          const { client: resend, fromEmail } = await getResendClient();
          
          await resend.emails.send({
            from: fromEmail,
            to: refereeEmail,
            subject: emailContent.subject,
            html: htmlWithFooter,
            text: plainWithFooter,
            headers: {
              'List-Unsubscribe': prefCheck.listUnsubscribeHeader!,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          });
          
          // Mark as sent
          await db.update(refereeWelcomeEmails)
            .set({ 
              status: 'sent',
              sentAt: new Date(),
            })
            .where(sql`${refereeWelcomeEmails.id} = ${welcomeEmail.id}`);
          
          console.log(`[Referral] ✅ Welcome email sent to ${refereeName} (${refereeEmail})`);
        } catch (emailError: any) {
          console.error('[Referral] Error sending welcome email:', emailError);
          // Don't fail the entire referral submission if email fails
        }
      } else {
        console.log(`[Referral] No email provided for referee ${refereeName} - skipping welcome email`);
      }
      
      // Generate personalized referral link
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://plumbersthatcare.com' 
        : (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000');
      
      const referralLink = `${baseUrl}/referred-by/${referrerCustomerId}`;
      
      res.json({ 
        success: true, 
        message: "Referral submitted successfully! Share this link with your friend to track the referral.",
        referralId: referral.id,
        referralLink,
        referrerId: referrerCustomerId,
        referrerName,
      });
    } catch (error: any) {
      console.error('[Referral] Error:', error);
      res.status(500).json({ message: "Error submitting referral: " + error.message });
    }
  });

  // Get referrer info for landing page
  app.get("/api/referrals/referrer/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }

      // Look up referrer info from customers_xlsx
      const { customersXlsx } = await import('@shared/schema');
      const [customer] = await db
        .select({
          name: customersXlsx.name,
          customerId: customersXlsx.customerId,
        })
        .from(customersXlsx)
        .where(sql`${customersXlsx.customerId} = ${customerId}`)
        .limit(1);

      if (!customer) {
        return res.status(404).json({ message: "Referrer not found" });
      }

      res.json({
        name: customer.name,
        customerId: customer.customerId,
      });
    } catch (error: any) {
      console.error('[Referral] Error fetching referrer info:', error);
      res.status(500).json({ message: "Error fetching referrer information" });
    }
  });

  // Capture referee contact info from landing page
  app.post("/api/referrals/capture-landing", async (req, res) => {
    try {
      const { referrerCustomerId, refereeName, refereeEmail, refereePhone } = req.body;

      if (!referrerCustomerId || !refereeName || (!refereeEmail && !refereePhone)) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get referrer info
      const { customersXlsx } = await import('@shared/schema');
      const [referrer] = await db
        .select({
          name: customersXlsx.name,
        })
        .from(customersXlsx)
        .where(sql`${customersXlsx.customerId} = ${referrerCustomerId}`)
        .limit(1);

      if (!referrer) {
        return res.status(404).json({ message: "Referrer not found" });
      }

      // Create pending referral with expiration (30 days)
      const { pendingReferrals } = await import('@shared/schema');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Generate tracking cookie
      const trackingCookie = `ref_${referrerCustomerId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const [pendingReferral] = await db.insert(pendingReferrals).values({
        referrerCustomerId,
        referrerName: referrer.name,
        refereeName,
        refereeEmail: refereeEmail || null,
        refereePhone: refereePhone || null,
        trackingCookie,
        expiresAt,
      }).returning();

      console.log(`[Referral] Created pending referral ${pendingReferral.id} - Referrer: ${referrer.name}, Referee: ${refereeName}`);

      res.json({
        success: true,
        message: "Contact information captured successfully",
        trackingCookie,
      });
    } catch (error: any) {
      console.error('[Referral] Error capturing landing contact:', error);
      res.status(500).json({ message: "Error capturing contact information" });
    }
  });

  // Get or create referral code for a customer
  app.get("/api/referrals/code/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }

      // Get customer info from ServiceTitan
      const { getServiceTitanAPI } = await import('./lib/serviceTitan');
      const serviceTitan = getServiceTitanAPI();
      
      // Try to find customer
      const customerData = await serviceTitan.getCustomer(customerId);
      if (!customerData) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Generate referral code from name (e.g., "John Smith" → "JOHN-SMITH")
      const generateCode = (name: string): string => {
        return name
          .toUpperCase()
          .replace(/[^A-Z0-9\s]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .substring(0, 30); // Limit length
      };

      const code = generateCode(customerData.name || `CUSTOMER-${customerId}`);
      
      // Store/update referral code mapping
      const { referralCodes } = await import('@shared/schema');
      await db.insert(referralCodes).values({
        code,
        customerId,
        customerName: customerData.name || `Customer ${customerId}`,
        customerPhone: customerData.phoneNumber || null,
      }).onConflictDoUpdate({
        target: referralCodes.code,
        set: {
          customerId,
          customerName: customerData.name || `Customer ${customerId}`,
          customerPhone: customerData.phoneNumber || null,
        }
      });

      console.log(`[Referrals] Created/updated referral code mapping: ${code} → Customer ${customerId}`);
      
      // Use localhost in development, production domain otherwise
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://www.plumbersthatcare.com'
        : 'http://localhost:5000';
      const referralUrl = `${baseUrl}/ref/${code}`;

      // Get link stats
      const clicksResult = await db.execute(sql`
        SELECT COUNT(*) as clicks, SUM(CASE WHEN converted THEN 1 ELSE 0 END) as conversions
        FROM referral_link_clicks
        WHERE referral_code = ${code}
      `);
      
      const stats = clicksResult.rows[0] as any;
      
      res.json({
        code,
        url: referralUrl,
        clicks: parseInt(stats?.clicks || '0'),
        conversions: parseInt(stats?.conversions || '0')
      });
    } catch (error: any) {
      console.error('[Referrals] Error generating referral code:', error);
      res.status(500).json({ message: "Error generating referral code" });
    }
  });

  // Track referral link click
  app.post("/api/referrals/track-click", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Referral code is required" });
      }

      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || '';
      const referrerUrl = req.headers['referer'] || '';

      // Record click
      await db.execute(sql`
        INSERT INTO referral_link_clicks (referral_code, clicked_at, ip_address, user_agent, referrer_url)
        VALUES (${code}, NOW(), ${clientIp}, ${userAgent}, ${referrerUrl})
      `);

      console.log(`[Referral Link] Click tracked for code: ${code}`);
      res.json({ tracked: true });
    } catch (error: any) {
      console.error('[Referrals] Error tracking click:', error);
      res.status(500).json({ message: "Error tracking click" });
    }
  });

  // Capture referee info from referral landing page
  app.post("/api/referrals/capture-referee", async (req, res) => {
    try {
      const { referralCode, refereeName, refereePhone, refereeEmail } = req.body;
      
      if (!referralCode || !refereeName || !refereePhone) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      console.log(`[Referrals] Capturing referee: ${refereeName} (${refereePhone}) referred by code: ${referralCode}`);

      // Look up referrer from code mapping
      const { referralCodes } = await import('@shared/schema');
      const [codeMapping] = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.code, referralCode))
        .limit(1);

      if (!codeMapping) {
        console.error(`[Referrals] Referral code not found: ${referralCode}`);
        return res.status(404).json({ message: "Invalid referral code" });
      }

      console.log(`[Referrals] Found referrer: Customer ${codeMapping.customerId} (${codeMapping.customerName})`);

      const { getServiceTitanAPI } = await import('./lib/serviceTitan');
      const serviceTitan = getServiceTitanAPI();

      // Check if referee is already a customer (mark as ineligible if they are)
      let refereeCustomerId: number | null = null;
      let creditNotes: string | null = null;

      try {
        const existingCustomerId = await serviceTitan.searchCustomerWithFallback(refereePhone);
        if (existingCustomerId) {
          refereeCustomerId = existingCustomerId;
          creditNotes = 'ineligible - already a customer at time of referral';
          console.log(`[Referrals] Referee "${refereeName}" is already a customer (ID: ${existingCustomerId}) - marking as ineligible`);
        }
      } catch (error) {
        console.error('[Referrals] Error checking referee:', error);
      }

      // Create referral record with proper referrer info from code mapping
      const { referrals } = await import('@shared/schema');
      
      const [referral] = await db.insert(referrals).values({
        referralCode,
        referrerName: codeMapping.customerName,
        referrerPhone: codeMapping.customerPhone || 'UNKNOWN',
        referrerCustomerId: codeMapping.customerId, // Already have the correct customer ID!
        refereeName,
        refereePhone,
        refereeEmail: refereeEmail || null,
        refereeCustomerId,
        status: creditNotes ? 'contacted' : 'pending', // If already a customer, skip to contacted
        submittedAt: new Date(),
        creditNotes,
      }).returning();

      console.log(`[Referrals] Created referral record: ${referral.id}`);
      res.json({ success: true, referralId: referral.id });
    } catch (error: any) {
      console.error('[Referrals] Error capturing referee:', error);
      res.status(500).json({ message: "Error saving referral information" });
    }
  });

  // Get referrals for a specific customer (Customer Portal)
  app.get("/api/referrals/customer/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }

      const { referrals } = await import('@shared/schema');
      const { or } = await import('drizzle-orm');
      
      // Get referrals where customer is either the referrer or referee
      const customerReferrals = await db
        .select()
        .from(referrals)
        .where(
          or(
            eq(referrals.referrerCustomerId, customerId),
            eq(referrals.refereeCustomerId, customerId)
          )
        )
        .orderBy(sql`${referrals.submittedAt} DESC`);

      res.json({ referrals: customerReferrals });
    } catch (error: any) {
      console.error('[Referrals] Error fetching customer referrals:', error);
      res.status(500).json({ message: "Error fetching referrals" });
    }
  });

  // Get referral leaderboard (top referrers)
  app.get("/api/referrals/leaderboard", async (req, res) => {
    try {
      const { referrals } = await import('@shared/schema');
      const { count } = await import('drizzle-orm');
      
      // Get top referrers by counting successful referrals
      const leaderboard = await db
        .select({
          referrerName: referrals.referrerName,
          referralCount: count(referrals.id),
        })
        .from(referrals)
        .where(eq(referrals.status, 'credited'))
        .groupBy(referrals.referrerName)
        .orderBy(sql`count(${referrals.id}) DESC`)
        .limit(10);

      // Anonymize names (First name + Last initial)
      const anonymizedLeaderboard = leaderboard.map(entry => {
        const nameParts = entry.referrerName.trim().split(' ');
        const firstName = nameParts[0];
        const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] + '.' : '';
        return {
          name: `${firstName} ${lastInitial}`.trim(),
          referralCount: entry.referralCount,
        };
      });

      res.json({ leaderboard: anonymizedLeaderboard });
    } catch (error: any) {
      console.error('[Referrals] Error fetching leaderboard:', error);
      res.status(500).json({ message: "Error fetching leaderboard" });
    }
  });

  // Get top customers leaderboard (by completed job count from database)
  // ⚡ Fast database-driven query - no API calls! Updated by job sync.
  app.get("/api/customers/leaderboard", async (req, res) => {
    try {
      const { customersXlsx } = await import('@shared/schema');
      const { desc, and, gte } = await import('drizzle-orm');
      
      console.log('[Customers Leaderboard] Fetching top 5 active customers from database...');
      
      // Calculate date 6 years ago (exclude customers with no service in 6+ years)
      const sixYearsAgo = new Date();
      sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
      
      // Get top 5 customers by job count (must have service in last 6 years)
      const topCustomers = await db
        .select({
          name: customersXlsx.name,
          jobCount: customersXlsx.jobCount,
        })
        .from(customersXlsx)
        .where(and(
          sql`${customersXlsx.jobCount} > 0`,
          gte(customersXlsx.lastServiceDate, sixYearsAgo)
        ))
        .orderBy(desc(customersXlsx.jobCount))
        .limit(5);

      if (!topCustomers.length) {
        return res.json({ leaderboard: [] });
      }

      // Anonymize names (First name + Last initial)
      const anonymizedLeaderboard = topCustomers.map(entry => {
        const nameParts = entry.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] + '.' : '';
        return {
          name: `${firstName} ${lastInitial}`.trim(),
          jobCount: entry.jobCount,
        };
      });

      console.log(`[Customers Leaderboard] ✅ Returning ${anonymizedLeaderboard.length} customers`);
      res.json({ leaderboard: anonymizedLeaderboard });
    } catch (error: any) {
      console.error('[Customers] Error fetching leaderboard:', error);
      res.status(500).json({ message: "Error fetching customer leaderboard" });
    }
  });

  // Trigger ServiceTitan jobs sync (Admin only)
  app.post("/api/admin/servicetitan/sync-jobs", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log('[Admin] Triggering ServiceTitan jobs sync...');
      const { getServiceTitanAPI } = await import('./lib/serviceTitan');
      const serviceTitan = getServiceTitanAPI();
      
      const result = await serviceTitan.syncAllJobs();
      
      res.json({
        message: "Jobs sync completed successfully",
        ...result
      });
    } catch (error: any) {
      console.error('[Admin] Error syncing jobs:', error);
      res.status(500).json({ message: "Error syncing jobs", error: error.message });
    }
  });

  // Record manual referral credit usage (Admin only)
  app.post("/api/admin/referrals/record-credit-usage", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { referralCreditUsage } = await import('@shared/schema');
      const { getReferralProcessor } = await import('./lib/referralProcessor');
      
      // Validate request body
      const { customerId, jobId, jobNumber, amountUsed, usedAt } = req.body;
      
      if (!customerId || !jobId || !jobNumber || !amountUsed) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if already recorded
      const existing = await db
        .select()
        .from(referralCreditUsage)
        .where(eq(referralCreditUsage.jobId, jobId))
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ message: "Credit usage for this job already recorded" });
      }

      // Record the usage
      await db.insert(referralCreditUsage).values({
        customerId: parseInt(customerId),
        jobId,
        jobNumber,
        amountUsed: Math.round(parseFloat(amountUsed) * 100), // Convert dollars to cents
        usedAt: usedAt ? new Date(usedAt) : new Date(),
      });

      // Update the customer's credit balance note
      const processor = getReferralProcessor();
      await processor.deductFromCreditNote(
        parseInt(customerId),
        parseFloat(amountUsed), // Amount in dollars
        jobNumber,
        usedAt ? new Date(usedAt) : new Date()
      );

      res.json({ 
        message: "Credit usage recorded successfully",
        customerId,
        jobNumber,
        amountUsed
      });
    } catch (error: any) {
      console.error('[Admin] Error recording credit usage:', error);
      res.status(500).json({ message: "Error recording credit usage", error: error.message });
    }
  });

  // Get all referrals (Admin Dashboard)
  app.get("/api/admin/referrals", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { referrals } = await import('@shared/schema');
      
      const allReferrals = await db
        .select()
        .from(referrals)
        .orderBy(sql`${referrals.submittedAt} DESC`)
        .limit(1000); // Limit to last 1000 referrals

      res.json({ referrals: allReferrals });
    } catch (error: any) {
      console.error('[Admin] Error fetching referrals:', error);
      res.status(500).json({ message: "Error fetching referrals" });
    }
  });

  // Update referral status (Admin Dashboard)
  app.patch("/api/admin/referrals/:referralId", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { referralId } = req.params;
      const { status, creditNotes } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const { referrals } = await import('@shared/schema');
      
      const updateData: any = {
        status,
        updatedAt: new Date()
      };
      
      if (creditNotes) {
        updateData.creditNotes = creditNotes;
      }
      
      // If manually marking as credited, set credited timestamp
      if (status === 'credited' && !creditNotes) {
        updateData.creditedAt = new Date();
        updateData.creditedBy = 'manual';
      }

      const [updatedReferral] = await db
        .update(referrals)
        .set(updateData)
        .where(eq(referrals.id, referralId))
        .returning();

      if (!updatedReferral) {
        return res.status(404).json({ message: "Referral not found" });
      }

      res.json({ referral: updatedReferral });
    } catch (error: any) {
      console.error('[Admin] Error updating referral:', error);
      res.status(500).json({ message: "Error updating referral" });
    }
  });

  // Manually issue credit for a referral (Admin Dashboard)
  app.post("/api/admin/referrals/:referralId/issue-credit", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { referralId } = req.params;
      const { amount, memo } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      const { referrals } = await import('@shared/schema');
      
      // Get referral
      const [referral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.id, referralId))
        .limit(1);

      if (!referral) {
        return res.status(404).json({ message: "Referral not found" });
      }

      if (!referral.referrerCustomerId) {
        return res.status(400).json({ message: "No referrer customer ID found" });
      }

      // Issue credit via ServiceTitan API
      const { getServiceTitanAPI } = await import('./lib/serviceTitan');
      const serviceTitan = getServiceTitanAPI();
      
      const credit = await serviceTitan.createCustomerCredit(
        referral.referrerCustomerId,
        amount,
        memo || `Manual referral credit for ${referral.refereeName}`
      );

      // Update referral
      const [updatedReferral] = await db
        .update(referrals)
        .set({
          status: 'credited',
          creditedAt: new Date(),
          creditedBy: 'manual',
          creditAmount: amount,
          creditNotes: `Manual credit issued: ServiceTitan adjustment #${credit.id}`,
          updatedAt: new Date()
        })
        .where(eq(referrals.id, referralId))
        .returning();

      res.json({ referral: updatedReferral, credit });
    } catch (error: any) {
      console.error('[Admin] Error issuing credit:', error);
      res.status(500).json({ message: "Error issuing credit: " + error.message });
    }
  });

  // Get referral statistics (Admin Dashboard)
  app.get("/api/admin/referral-stats", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { referrals } = await import('@shared/schema');
      
      const stats = await db
        .select({
          status: referrals.status,
          count: sql<number>`count(*)::int`,
          totalCredits: sql<number>`sum(CASE WHEN ${referrals.status} = 'credited' THEN ${referrals.creditAmount} ELSE 0 END)::int`
        })
        .from(referrals)
        .groupBy(referrals.status);

      const totalReferrals = stats.reduce((sum, stat) => sum + stat.count, 0);
      const totalCreditsIssued = stats.reduce((sum, stat) => sum + (stat.totalCredits || 0), 0);

      res.json({ 
        stats,
        totalReferrals,
        totalCreditsIssued: totalCreditsIssued / 100 // Convert cents to dollars
      });
    } catch (error: any) {
      console.error('[Admin] Error fetching referral stats:', error);
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  // Get customer data metrics (Admin Dashboard)
  app.get("/api/admin/customer-metrics", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { customersXlsx } = await import('@shared/schema');
      
      const metrics = await db
        .select({
          totalCustomers: sql<number>`count(*)::int`,
          customersWithRevenue: sql<number>`count(CASE WHEN ${customersXlsx.lifetimeValue} > 0 THEN 1 END)::int`,
          totalLifetimeRevenue: sql<number>`COALESCE(sum(${customersXlsx.lifetimeValue}), 0)::bigint`,
          avgLifetimeRevenue: sql<number>`COALESCE(avg(${customersXlsx.lifetimeValue}), 0)::int`,
          maxLifetimeRevenue: sql<number>`COALESCE(max(${customersXlsx.lifetimeValue}), 0)::bigint`
        })
        .from(customersXlsx);

      res.json(metrics[0] || {
        totalCustomers: 0,
        customersWithRevenue: 0,
        totalLifetimeRevenue: 0,
        avgLifetimeRevenue: 0,
        maxLifetimeRevenue: 0
      });
    } catch (error: any) {
      console.error('[Admin] Error fetching customer metrics:', error);
      res.status(500).json({ message: "Error fetching customer metrics" });
    }
  });

  // Get customer data import history (Admin Dashboard)
  app.get("/api/admin/customer-imports", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { customerDataImports } = await import('@shared/schema');
      
      const imports = await db
        .select()
        .from(customerDataImports)
        .orderBy(sql`${customerDataImports.startedAt} DESC`)
        .limit(20);

      res.json(imports);
    } catch (error: any) {
      console.error('[Admin] Error fetching customer imports:', error);
      res.status(500).json({ message: "Error fetching customer imports" });
    }
  });

  // Get top customers by lifetime value (Admin Dashboard)
  app.get("/api/admin/top-customers", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { customersXlsx } = await import('@shared/schema');
      const { desc, and, gte } = await import('drizzle-orm');
      
      const period = req.query.period as string || 'all';
      const requestedLimit = parseInt(req.query.limit as string) || 20;
      const limit = Math.min(Math.max(requestedLimit, 1), 100); // Clamp between 1-100
      
      // Calculate date threshold based on period
      let dateThreshold: Date | null = null;
      const now = new Date();
      
      if (period === '1year') {
        dateThreshold = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      } else if (period === '2years') {
        dateThreshold = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      } else if (period === '3years') {
        dateThreshold = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
      }
      
      // Build query with optional date filter
      const conditions = [];
      conditions.push(sql`${customersXlsx.lifetimeValue} > 0`);
      
      if (dateThreshold) {
        conditions.push(gte(customersXlsx.lastServiceDate, dateThreshold));
      }
      
      const topCustomers = await db
        .select({
          id: customersXlsx.id,
          name: customersXlsx.name,
          lifetimeValue: customersXlsx.lifetimeValue,
          jobCount: customersXlsx.jobCount,
          lastServiceDate: customersXlsx.lastServiceDate,
          lastServiceType: customersXlsx.lastServiceType,
        })
        .from(customersXlsx)
        .where(and(...conditions))
        .orderBy(desc(customersXlsx.lifetimeValue))
        .limit(limit);

      res.json({ topCustomers });
    } catch (error: any) {
      console.error('[Admin] Error fetching top customers:', error);
      res.status(500).json({ message: "Error fetching top customers" });
    }
  });

  // Customer Success Story submission with spam protection and photo upload
  app.post("/api/success-stories", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      
      // Spam protection 1: Honeypot field check
      if (req.body.website || req.body.url || req.body.company_website) {
        console.log('[Spam] Honeypot triggered for success story from IP:', clientIp);
        return res.status(400).json({ message: "Invalid form submission" });
      }
      
      // Spam protection 2: Rate limiting (1 minute window)
      const lastSubmission = submissionRateLimit.get(clientIp);
      if (lastSubmission && (now - lastSubmission < 60000)) {
        console.log('[Spam] Rate limit exceeded for IP:', clientIp);
        return res.status(429).json({ 
          message: "Too many submissions. Please wait a moment before trying again." 
        });
      }
      
      // Spam protection 3: Timestamp validation
      if (req.body.formStartTime) {
        const formStartTime = parseInt(req.body.formStartTime);
        const fillTime = now - formStartTime;
        if (fillTime < 3000) {
          console.log('[Spam] Success story form filled too quickly for IP:', clientIp, 'Fill time:', fillTime);
          return res.status(400).json({ message: "Invalid form submission" });
        }
      }
      
      // Remove spam protection fields and extract photo data
      const { website, url, company_website, formStartTime, beforePhoto, afterPhoto, ...storyData } = req.body;
      
      // Validate that photos are provided
      if (!beforePhoto || !afterPhoto) {
        return res.status(400).json({ message: "Both before and after photos are required" });
      }
      
      // Initialize Object Storage Service
      const objectStorageService = new ObjectStorageService();
      
      // Upload photos to object storage (.private directory since they need approval)
      const publicSearchPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0];
      if (!publicSearchPath) {
        throw new Error('Object storage not configured');
      }
      
      // Extract bucket ID from path like /replit-objstore-xxx/public
      const bucketId = publicSearchPath.split('/').filter(p => p.startsWith('replit-objstore-'))[0];
      if (!bucketId) {
        throw new Error('Could not determine bucket ID');
      }
      
      const timestamp = Date.now();
      
      // Import image optimizer
      const { optimizeImage } = await import('./lib/imageOptimizer');
      
      // Optimize and convert photos to WebP (handles HEIC conversion automatically)
      const beforeBuffer = await optimizeImage(beforePhoto, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 85,
        format: 'webp'
      });
      const afterBuffer = await optimizeImage(afterPhoto, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 85,
        format: 'webp'
      });
      
      const beforePhotoPath = `/${bucketId}/.private/success_stories/before_${timestamp}.webp`;
      const afterPhotoPath = `/${bucketId}/.private/success_stories/after_${timestamp}.webp`;
      
      const beforeUrl = await objectStorageService.uploadBuffer(beforeBuffer, beforePhotoPath, 'image/webp');
      const afterUrl = await objectStorageService.uploadBuffer(afterBuffer, afterPhotoPath, 'image/webp');
      
      // Create success story with photo URLs
      const storyWithPhotos = {
        ...storyData,
        beforePhotoUrl: beforeUrl,
        afterPhotoUrl: afterUrl
      };
      
      const validatedData = insertCustomerSuccessStorySchema.parse(storyWithPhotos);
      const story = await storage.createCustomerSuccessStory(validatedData);
      
      // Update rate limit tracking
      submissionRateLimit.set(clientIp, now);
      
      // Send email notification to admin
      try {
        await sendSuccessStoryNotificationEmail({
          customerName: validatedData.customerName,
          email: validatedData.email || undefined,
          phone: validatedData.phone || undefined,
          story: validatedData.story,
          serviceCategory: validatedData.serviceCategory,
          location: validatedData.location,
          beforePhotoUrl: beforeUrl,
          afterPhotoUrl: afterUrl,
          storyId: story.id
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue even if email fails - submission is still saved
      }
      
      res.json({ 
        success: true, 
        message: "Thank you for sharing your story! We'll review it and publish it soon.",
        storyId: story.id 
      });
    } catch (error: any) {
      console.error('Success story submission error:', error);
      res.status(400).json({ message: "Error submitting story: " + error.message });
    }
  });

  // Track 404 errors
  app.post("/api/track-404", async (req, res) => {
    try {
      const { requestedUrl, referrer } = req.body;
      const userAgent = req.get('user-agent');
      const ipAddress = req.ip || req.socket.remoteAddress;

      // Save to database
      await storage.create404Error({
        requestedUrl,
        referrer,
        userAgent,
        ipAddress,
        emailSent: false,
      });

      // Send email alert immediately
      const { send404AlertEmail } = await import('./lib/resendClient');
      try {
        await send404AlertEmail(requestedUrl, referrer, userAgent, ipAddress);
        console.log(`[404 Monitor] Email sent for 404: ${requestedUrl}`);
      } catch (emailError) {
        console.error('[404 Monitor] Failed to send email:', emailError);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('[404 Monitor] Error tracking 404:', error);
      res.status(500).json({ message: "Failed to track 404" });
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

        // 1. Google reviews now fetched via GMB API automation (every 6 hours)
        // DataForSEO no longer needed - historical data preserved in database
        // if (placeId) {
        //   console.log('[Reviews API] Fetching Google reviews from DataForSEO...');
        //   const dataForSeoReviews = await fetchDataForSeoReviews(placeId);
        //   console.log(`[Reviews API] DataForSEO returned ${dataForSeoReviews.length} Google reviews`);
        //   allReviews.push(...dataForSeoReviews);
        // }

        // 2. Fetch Facebook reviews
        if (facebookPageId && facebookAccessToken) {
          console.log('[Reviews API] Fetching Facebook reviews...');
          const fbReviews = await fetchFacebookReviews(facebookPageId, facebookAccessToken);
          console.log(`[Reviews API] Facebook returned ${fbReviews.length} reviews`);
          allReviews.push(...fbReviews);
        }

        // 3. Yelp reviews - DataForSEO disabled (not needed for current requirements)
        // const yelpAlias = 'economy-plumbing-services-austin-3';
        // console.log('[Reviews API] Fetching Yelp reviews from DataForSEO...');
        // const yelpReviews = await fetchDataForSeoYelpReviews(yelpAlias);
        // console.log(`[Reviews API] DataForSEO returned ${yelpReviews.length} Yelp reviews`);
        // allReviews.push(...yelpReviews);

        // 4. Fetch new Google reviews from Places API (max 5, newest)
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
    // SECURITY: Require admin authentication
    if (!req.isAuthenticated?.()) {
      return res.status(401).json({ message: "Unauthorized - Admin access required" });
    }
    
    try {
      const token = await storage.getGoogleOAuthToken('google_my_business');
      
      if (!token) {
        return res.json({ 
          isAuthenticated: false,
          hasAccountId: false,
          hasLocationId: false,
        });
      }
      
      // Check if token is expired and refresh if needed
      const now = new Date();
      const isExpired = new Date(token.expiryDate) <= now;
      
      if (isExpired && token.refreshToken) {
        try {
          console.log('[OAuth Status] Token expired, refreshing...');
          const auth = GoogleMyBusinessAuth.getInstance();
          const newTokens = await auth.refreshAccessToken(token.refreshToken);
          
          if (newTokens.access_token && newTokens.expiry_date) {
            await storage.updateGoogleOAuthToken(token.id, {
              accessToken: newTokens.access_token,
              expiryDate: new Date(newTokens.expiry_date),
              ...(newTokens.refresh_token && { refreshToken: newTokens.refresh_token })
            });
            console.log('[OAuth Status] Token refreshed successfully');
          }
        } catch (refreshError: any) {
          console.error('[OAuth Status] Failed to refresh token:', refreshError.message);
          return res.json({ 
            isAuthenticated: false,
            hasAccountId: !!token.accountId,
            hasLocationId: !!token.locationId,
          });
        }
      }
      
      res.json({ 
        isAuthenticated: true,
        hasAccountId: !!token.accountId,
        hasLocationId: !!token.locationId,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to check OAuth status: " + error.message });
    }
  });

  app.get("/api/google/oauth/init", async (req, res) => {
    // SECURITY: Require admin authentication
    if (!req.isAuthenticated?.()) {
      return res.status(401).json({ message: "Unauthorized - Admin access required" });
    }
    
    try {
      const auth = GoogleMyBusinessAuth.getInstance();
      const authUrl = auth.getAuthUrl();
      console.log('[GMB OAuth] Redirecting to:', authUrl);
      console.log('[GMB OAuth] Client ID:', process.env.GOOGLE_OAUTH_CLIENT_ID?.substring(0, 20) + '...');
      // Redirect user to Google OAuth consent screen
      res.redirect(authUrl);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to initialize OAuth: " + error.message });
    }
  });

  app.get("/api/google/oauth/callback", async (req, res) => {
    // SECURITY: Require admin authentication for OAuth callback
    if (!req.isAuthenticated?.()) {
      return res.status(401).send('Unauthorized - Admin access required');
    }
    
    try {
      const { code, error } = req.query;
      
      // Log what we received from Google
      console.log('[GMB OAuth] Callback received:', { code: !!code, error, allParams: req.query });
      
      // Check if Google returned an error
      if (error) {
        console.error('[GMB OAuth] Google returned error:', error);
        return res.status(400).send(`Google OAuth error: ${error}`);
      }
      
      if (!code || typeof code !== 'string') {
        console.error('[GMB OAuth] No authorization code received');
        return res.status(400).send('Missing authorization code');
      }

      const auth = GoogleMyBusinessAuth.getInstance();
      const tokens = await auth.getTokenFromCode(code);

      if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
        throw new Error('Invalid tokens received');
      }

      // Set credentials for API calls
      auth.setCredentials(tokens);

      // Auto-fetch account and location IDs from Google
      let accountId: string | null = null;
      let locationId: string | null = null;

      try {
        const client = auth.getClient();
        const accessTokenRaw = await client.getAccessToken();
        const token = typeof accessTokenRaw === 'string' ? accessTokenRaw : accessTokenRaw?.token;

        if (token) {
          // Fetch accounts
          const accountsResponse = await fetch('https://mybusiness.googleapis.com/v4/accounts', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (accountsResponse.ok) {
            const accountsData = await accountsResponse.json();
            const accounts = accountsData.accounts || [];
            
            if (accounts.length > 0) {
              // Extract account ID from name (format: accounts/{accountId})
              const accountMatch = accounts[0].name?.match(/accounts\/([^/]+)$/);
              accountId = accountMatch ? accountMatch[1] : null;

              if (accountId) {
                // Fetch locations for this account
                const locationsResponse = await fetch(
                  `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations`,
                  { headers: { 'Authorization': `Bearer ${token}` } }
                );

                if (locationsResponse.ok) {
                  const locationsData = await locationsResponse.json();
                  const locations = locationsData.locations || [];
                  
                  if (locations.length > 0) {
                    // Extract location ID from name (format: accounts/{accountId}/locations/{locationId})
                    const locationMatch = locations[0].name?.match(/locations\/([^/]+)$/);
                    locationId = locationMatch ? locationMatch[1] : null;
                    
                    console.log('[OAuth] Auto-fetched IDs:', { accountId, locationId });
                  }
                }
              }
            }
          }
        }
      } catch (fetchError: any) {
        console.warn('[OAuth] Could not auto-fetch account/location IDs:', fetchError.message);
      }

      // Check if token already exists
      const existingToken = await storage.getGoogleOAuthToken('google_my_business');
      
      if (existingToken) {
        // Update existing token
        await storage.updateGoogleOAuthToken(existingToken.id, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: new Date(tokens.expiry_date),
          ...(accountId && { accountId }),
          ...(locationId && { locationId }),
        });
      } else {
        // Save new token with auto-fetched IDs
        await storage.saveGoogleOAuthToken({
          service: 'google_my_business',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: new Date(tokens.expiry_date),
          accountId,
          locationId,
        });
      }

      // Redirect to setup completion page
      res.redirect('/admin/gmb-setup?success=true');
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

  /* ============================================================================
   * DISABLED: Custom Store Endpoints (Replaced by Square Online - October 2025)
   * 
   * The following endpoints were used for the custom-built store with Stripe
   * integration. They are now disabled because the store has been converted to
   * use Square Online, which handles all product management, checkout, and payments.
   * 
   * Keeping these commented out for reference in case they're needed later.
   * ============================================================================ */

  /*
  // DISABLED: Save customer info before payment
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

      // Update payment intent metadata with customer info for success page
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (stripeSecretKey) {
        try {
          const stripe = new Stripe(stripeSecretKey);
          
          // Retrieve existing payment intent to preserve existing metadata
          const existingIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          
          // Merge customer metadata with existing metadata (preserve productName, quantity, etc.)
          await stripe.paymentIntents.update(paymentIntentId, {
            metadata: {
              ...existingIntent.metadata, // Preserve existing fields
              productId,
              customerType,
              customerName: customerName || '',
              companyName: companyName || '',
              contactPersonName: contactPersonName || '',
              email,
              phone,
              street,
              city,
              state,
              zip,
            },
          });
        } catch (stripeError: any) {
          console.error('Error updating payment intent metadata:', stripeError);
          // Don't fail the request if metadata update fails
        }
      }

      res.json({ success: true, id: pendingPurchase.id });
    } catch (error: any) {
      console.error('Error saving pending purchase:', error);
      res.status(500).json({ message: "Failed to save customer info: " + error.message });
    }
  });
  */

  // DISABLED:   // Stripe webhook endpoint (raw body already applied in server/index.ts)
  // DISABLED:   app.post("/api/webhooks/stripe", async (req, res) => {
  // DISABLED:     const sig = req.headers['stripe-signature'];
  // DISABLED:     const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  // DISABLED: 
  // DISABLED:     if (!webhookSecret) {
  // DISABLED:       console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
  // DISABLED:       return res.status(500).send('Webhook secret not configured');
  // DISABLED:     }
  // DISABLED: 
  // DISABLED:     if (!sig) {
  // DISABLED:       return res.status(400).send('No signature');
  // DISABLED:     }
  // DISABLED: 
  // DISABLED:     let event: Stripe.Event;
  // DISABLED: 
  // DISABLED:     try {
  // DISABLED:       const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // DISABLED:       event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  // DISABLED:     } catch (err: any) {
  // DISABLED:       console.error(`[Stripe Webhook] Signature verification failed:`, err.message);
  // DISABLED:       return res.status(400).send(`Webhook Error: ${err.message}`);
  // DISABLED:     }
  // DISABLED: 
  // DISABLED:     // Handle the event
  // DISABLED:     if (event.type === 'payment_intent.succeeded') {
  // DISABLED:       const paymentIntent = event.data.object as Stripe.PaymentIntent;
  // DISABLED:       console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);
  // DISABLED: 
  // DISABLED:       try {
  // DISABLED:         // Find pending purchase by payment intent ID
  // DISABLED:         const pendingPurchase = await storage.getPendingPurchaseByPaymentIntent(paymentIntent.id);
  // DISABLED: 
  // DISABLED:         if (!pendingPurchase) {
  // DISABLED:           console.warn(`[Stripe Webhook] No pending purchase found for payment intent: ${paymentIntent.id}`);
  // DISABLED:           return res.json({ received: true, warning: 'No pending purchase found' });
  // DISABLED:         }
  // DISABLED: 
  // DISABLED:         // Get product to check if ServiceTitan sync is enabled
  // DISABLED:         const product = await storage.getProductById(pendingPurchase.productId);
  // DISABLED: 
  // DISABLED:         if (!product) {
  // DISABLED:           console.error(`[Stripe Webhook] Product not found: ${pendingPurchase.productId}`);
  // DISABLED:           return res.json({ received: true, error: 'Product not found' });
  // DISABLED:         }
  // DISABLED: 
  // DISABLED:         if (product.serviceTitanEnabled && product.serviceTitanMembershipTypeId) {
  // DISABLED:           // Create ServiceTitan membership record
  // DISABLED:           const membership = await storage.createServiceTitanMembership({
  // DISABLED:             customerType: pendingPurchase.customerType,
  // DISABLED:             customerName: pendingPurchase.customerName || null,
  // DISABLED:             companyName: pendingPurchase.companyName || null,
  // DISABLED:             contactPersonName: pendingPurchase.contactPersonName || null,
  // DISABLED:             street: pendingPurchase.street,
  // DISABLED:             city: pendingPurchase.city,
  // DISABLED:             state: pendingPurchase.state,
  // DISABLED:             zip: pendingPurchase.zip,
  // DISABLED:             phone: pendingPurchase.phone,
  // DISABLED:             email: pendingPurchase.email,
  // DISABLED:             serviceTitanMembershipTypeId: product.serviceTitanMembershipTypeId,
  // DISABLED:             serviceTitanCustomerId: null,
  // DISABLED:             serviceTitanMembershipId: null,
  // DISABLED:             serviceTitanInvoiceId: null,
  // DISABLED:             productId: product.id,
  // DISABLED:             stripePaymentIntentId: paymentIntent.id,
  // DISABLED:             stripeCustomerId: paymentIntent.customer as string | null,
  // DISABLED:             amount: paymentIntent.amount,
  // DISABLED:             syncStatus: 'pending',
  // DISABLED:             syncError: null,
  // DISABLED:           });
  // DISABLED: 
  // DISABLED:           console.log(`[Stripe Webhook] Created ServiceTitan membership record: ${membership.id}`);
  // DISABLED: 
  // DISABLED:           // TODO: Trigger ServiceTitan sync (will be implemented in Task 5)
  // DISABLED:           // For now, just log that sync would happen
  // DISABLED:           console.log(`[Stripe Webhook] ServiceTitan sync queued for membership: ${membership.id}`);
  // DISABLED:         }
  // DISABLED: 
  // DISABLED:         // Send sales notification email
  // DISABLED:         try {
  // DISABLED:           const { sendSalesNotificationEmail } = await import('./email');
  // DISABLED:           await sendSalesNotificationEmail({
  // DISABLED:             productName: product.name,
  // DISABLED:             productPrice: product.price,
  // DISABLED:             customerType: pendingPurchase.customerType as 'residential' | 'commercial',
  // DISABLED:             customerName: pendingPurchase.customerName || undefined,
  // DISABLED:             companyName: pendingPurchase.companyName || undefined,
  // DISABLED:             contactPersonName: pendingPurchase.contactPersonName || undefined,
  // DISABLED:             email: pendingPurchase.email,
  // DISABLED:             phone: pendingPurchase.phone,
  // DISABLED:             street: pendingPurchase.street,
  // DISABLED:             city: pendingPurchase.city,
  // DISABLED:             state: pendingPurchase.state,
  // DISABLED:             zip: pendingPurchase.zip,
  // DISABLED:             stripePaymentIntentId: paymentIntent.id,
  // DISABLED:           });
  // DISABLED:           console.log(`[Stripe Webhook] Sales notification email sent for payment: ${paymentIntent.id}`);
  // DISABLED:         } catch (emailError: any) {
  // DISABLED:           // Don't fail the webhook if email fails
  // DISABLED:           console.error('[Stripe Webhook] Failed to send sales notification email:', emailError.message);
  // DISABLED:         }
  // DISABLED: 
  // DISABLED:         // Clean up pending purchase
  // DISABLED:         await storage.deletePendingPurchase(pendingPurchase.id);
  // DISABLED:         console.log(`[Stripe Webhook] Deleted pending purchase: ${pendingPurchase.id}`);
  // DISABLED: 
  // DISABLED:         res.json({ received: true, processed: true });
  // DISABLED:       } catch (error: any) {
  // DISABLED:         console.error('[Stripe Webhook] Error processing payment:', error);
  // DISABLED:         return res.status(500).json({ received: true, error: error.message });
  // DISABLED:       }
  // DISABLED:     } else {
  // DISABLED:       // Return 200 for other event types to acknowledge receipt
  // DISABLED:       res.json({ received: true });
  // DISABLED:     }
  // DISABLED:   });

  // DISABLED:   // Get purchase success details
  // DISABLED:   app.get("/api/purchase-success/:paymentIntentId", async (req, res) => {
  // DISABLED:     try {
  // DISABLED:       const { paymentIntentId } = req.params;
  // DISABLED:       const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  // DISABLED:       
  // DISABLED:       if (!stripeSecretKey) {
  // DISABLED:         return res.status(503).json({ 
  // DISABLED:           message: "Payment processing is not configured." 
  // DISABLED:         });
  // DISABLED:       }
  // DISABLED: 
  // DISABLED:       const stripe = new Stripe(stripeSecretKey);
  // DISABLED:       
  // DISABLED:       // Retrieve payment intent from Stripe
  // DISABLED:       const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  // DISABLED:       
  // DISABLED:       if (paymentIntent.status !== 'succeeded') {
  // DISABLED:         return res.status(400).json({ message: "Payment not completed" });
  // DISABLED:       }
  // DISABLED: 
  // DISABLED:       // Try to get pending purchase first (may not exist if webhook processed already)
  // DISABLED:       const pendingPurchase = await storage.getPendingPurchaseByPaymentIntent(paymentIntentId);
  // DISABLED:       
  // DISABLED:       let customerInfo = null;
  // DISABLED:       let productId = null;
  // DISABLED:       
  // DISABLED:       if (pendingPurchase) {
  // DISABLED:         // Use pending purchase data
  // DISABLED:         customerInfo = {
  // DISABLED:           customerType: pendingPurchase.customerType,
  // DISABLED:           customerName: pendingPurchase.customerName,
  // DISABLED:           companyName: pendingPurchase.companyName,
  // DISABLED:           contactPersonName: pendingPurchase.contactPersonName,
  // DISABLED:           email: pendingPurchase.email,
  // DISABLED:           phone: pendingPurchase.phone,
  // DISABLED:           street: pendingPurchase.street,
  // DISABLED:           city: pendingPurchase.city,
  // DISABLED:           state: pendingPurchase.state,
  // DISABLED:           zip: pendingPurchase.zip,
  // DISABLED:         };
  // DISABLED:         productId = pendingPurchase.productId;
  // DISABLED:       } else {
  // DISABLED:         // Webhook already processed - get info from payment intent metadata
  // DISABLED:         productId = paymentIntent.metadata?.productId;
  // DISABLED:         
  // DISABLED:         if (productId && paymentIntent.metadata) {
  // DISABLED:           customerInfo = {
  // DISABLED:             customerType: paymentIntent.metadata.customerType || 'residential',
  // DISABLED:             customerName: paymentIntent.metadata.customerName || null,
  // DISABLED:             companyName: paymentIntent.metadata.companyName || null,
  // DISABLED:             contactPersonName: paymentIntent.metadata.contactPersonName || null,
  // DISABLED:             email: paymentIntent.metadata.email || '',
  // DISABLED:             phone: paymentIntent.metadata.phone || '',
  // DISABLED:             street: paymentIntent.metadata.street || '',
  // DISABLED:             city: paymentIntent.metadata.city || '',
  // DISABLED:             state: paymentIntent.metadata.state || '',
  // DISABLED:             zip: paymentIntent.metadata.zip || '',
  // DISABLED:           };
  // DISABLED:         }
  // DISABLED:       }
  // DISABLED: 
  // DISABLED:       if (!customerInfo || !productId) {
  // DISABLED:         return res.status(404).json({ message: "Purchase details not found" });
  // DISABLED:       }
  // DISABLED: 
  // DISABLED:       const product = await storage.getProductById(productId);
  // DISABLED:       if (!product) {
  // DISABLED:         return res.status(404).json({ message: "Product not found" });
  // DISABLED:       }
  // DISABLED: 
  // DISABLED:       res.json({
  // DISABLED:         product,
  // DISABLED:         customerInfo,
  // DISABLED:         transactionId: paymentIntentId,
  // DISABLED:       });
  // DISABLED:     } catch (error: any) {
  // DISABLED:       console.error("[Purchase Success] Error:", error);
  // DISABLED:       res.status(500).json({ message: error.message });
  // DISABLED:     }
  // DISABLED:   });

  // DISABLED:   // Stripe payment intent endpoint
  // DISABLED:   app.post("/api/create-payment-intent", async (req, res) => {
  // DISABLED:     try {
  // DISABLED:       const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  // DISABLED:       
  // DISABLED:       if (!stripeSecretKey) {
  // DISABLED:         return res.status(503).json({ 
  // DISABLED:           message: "Payment processing is not configured. Please contact us directly at (512) 368-9159." 
  // DISABLED:         });
  // DISABLED:       }
  // DISABLED: 
  // DISABLED:       const stripe = new Stripe(stripeSecretKey);
  // DISABLED:       const { productId, quantity = 1 } = req.body;
  // DISABLED: 
  // DISABLED:       const product = await storage.getProductById(productId);
  // DISABLED:       if (!product) {
  // DISABLED:         return res.status(404).json({ message: "Product not found" });
  // DISABLED:       }
  // DISABLED: 
  // DISABLED:       const amount = Math.round(product.price * quantity); // Price is already in cents
  // DISABLED: 
  // DISABLED:       const paymentIntent = await stripe.paymentIntents.create({
  // DISABLED:         amount,
  // DISABLED:         currency: "usd",
  // DISABLED:         automatic_payment_methods: {
  // DISABLED:           enabled: true, // Enables all available payment methods including Apple Pay, Google Pay, Link, etc.
  // DISABLED:         },
  // DISABLED:         metadata: {
  // DISABLED:           productId: product.id,
  // DISABLED:           productName: product.name,
  // DISABLED:           quantity: quantity.toString(),
  // DISABLED:         },
  // DISABLED:       });
  // DISABLED: 
  // DISABLED:       res.json({ 
  // DISABLED:         clientSecret: paymentIntent.client_secret,
  // DISABLED:         amount: paymentIntent.amount,
  // DISABLED:         paymentIntentId: paymentIntent.id // Return payment intent ID
  // DISABLED:       });
  // DISABLED:     } catch (error: any) {
  // DISABLED:       res.status(500).json({ message: "Payment initialization failed: " + error.message });
  // DISABLED:     }
  // DISABLED:   });

  // Photo quality testing endpoint
  app.post("/api/photos/analyze", async (req, res) => {
    try {
      const { photoUrl, description } = req.body;
      
      if (!photoUrl) {
        return res.status(400).json({ message: "Photo URL is required" });
      }

      // SECURITY: Validate URL to prevent SSRF attacks
      const { validatePhotoUrl } = await import("./lib/urlValidator");
      const validation = validatePhotoUrl(photoUrl);
      
      if (!validation.isValid) {
        console.warn(`[Security] Rejected photo URL: ${photoUrl} - ${validation.error}`);
        return res.status(400).json({ 
          message: "Invalid photo URL", 
          error: validation.error 
        });
      }

      const { analyzePhotoQuality } = await import("./lib/photoQualityAnalyzer");
      const analysis = await analyzePhotoQuality(validation.sanitizedUrl!, description);

      res.json({
        success: true,
        analysis,
      });
    } catch (error: any) {
      console.error("Error analyzing photo:", error);
      res.status(500).json({ 
        message: "Photo analysis failed", 
        error: error.message 
      });
    }
  });

  // Fetch and filter photos from ServiceTitan
  app.post("/api/photos/import", async (req, res) => {
    try {
      const { projectId, token, jobDescription } = req.body;
      
      if (!projectId || !token) {
        return res.status(400).json({ 
          message: "Project ID and access token are required" 
        });
      }

      const { fetchAndFilterServiceTitanPhotos } = await import("./lib/serviceTitanPhotos");
      const filteredPhotos = await fetchAndFilterServiceTitanPhotos(
        projectId,
        token,
        jobDescription
      );

      // Save to database
      const savedPhotos = await storage.savePhotos(filteredPhotos);

      res.json({
        success: true,
        imported: savedPhotos.length,
        photos: savedPhotos,
      });
    } catch (error: any) {
      console.error("Error importing photos:", error);
      res.status(500).json({ 
        message: "Photo import failed", 
        error: error.message 
      });
    }
  });

  // Get photos by category
  app.get("/api/photos", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const unused = req.query.unused === 'true';

      let photos: any[];
      if (unused) {
        photos = await storage.getUnusedPhotos(category);
      } else if (category) {
        photos = await storage.getPhotosByCategory(category);
      } else {
        photos = [];
      }

      res.json(photos);
    } catch (error: any) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ 
        message: "Failed to fetch photos", 
        error: error.message 
      });
    }
  });

  // Trigger automatic import of photos from ServiceTitan jobs (last 30 days)
  app.post("/api/photos/import-servicetitan", async (req, res) => {
    try {
      const { daysAgo = 30 } = req.body;

      const { createServiceTitanProjectPhotosAPI } = await import("./lib/serviceTitanProjectPhotos");
      const api = createServiceTitanProjectPhotosAPI();

      if (!api) {
        return res.status(400).json({
          message: "ServiceTitan credentials not configured. Please check SERVICETITAN_CLIENT_ID, SERVICETITAN_CLIENT_SECRET, SERVICETITAN_TENANT_ID, and SERVICETITAN_APP_KEY environment variables."
        });
      }

      const totalImported = await api.importRecentJobPhotos(daysAgo);

      res.json({
        success: true,
        imported: totalImported,
        message: `Successfully imported ${totalImported} quality photos from ServiceTitan jobs in the last ${daysAgo} days`
      });
    } catch (error: any) {
      console.error("Error importing ServiceTitan photos:", error);
      res.status(500).json({
        message: "Failed to import photos from ServiceTitan",
        error: error.message
      });
    }
  });

  // Helper function to categorize photos based on AI analysis
  function categorizePhotoFromAnalysis(aiDescription: string, tags: string[]): string {
    const combined = `${aiDescription} ${tags.join(" ")}`.toLowerCase();

    // Check toilet FIRST before checking "tank" (toilet tanks contain "tank")
    if (
      combined.includes("toilet") ||
      combined.includes("commode") ||
      combined.includes("toilet tank")
    ) {
      return "toilet";
    }
    
    // Water heater - be more specific, avoid matching "toilet tank"
    if (
      combined.includes("water heater") ||
      combined.includes("tankless") ||
      combined.includes("hot water tank") ||
      combined.includes("heater")
    ) {
      return "water_heater";
    }
    
    if (combined.includes("drain") || combined.includes("clog")) {
      return "drain";
    }
    if (combined.includes("leak") || combined.includes("drip")) {
      return "leak";
    }
    if (combined.includes("faucet") || combined.includes("sink")) {
      return "faucet";
    }
    if (combined.includes("gas") || combined.includes("line")) {
      return "gas";
    }
    if (combined.includes("backflow") || combined.includes("prevention")) {
      return "backflow";
    }
    if (combined.includes("commercial") || combined.includes("business")) {
      return "commercial";
    }
    
    return "general";
  }

  // DISABLED: Zapier webhook endpoint (was used for photo imports, now disabled for security)
  // To re-enable: uncomment this endpoint and add authentication
  /*
  app.post("/api/photos/webhook", async (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`\n========================================`);
    console.log(`[Zapier Webhook] ${timestamp}`);
    console.log(`[Zapier Webhook] Incoming request from: ${req.ip}`);
    console.log(`[Zapier Webhook] Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[Zapier Webhook] Body:`, JSON.stringify(req.body, null, 2));
    console.log(`========================================\n`);
    
    try {
      const { photos, jobId, jobDescription, customerName } = req.body;

      // Support both single photo and batch of photos
      const photoArray = Array.isArray(photos) ? photos : [{ photoUrl: req.body.photoUrl, jobId, jobDescription, customerName }];

      if (!photoArray.length || !photoArray[0].photoUrl) {
        console.log(`[Zapier Webhook] ❌ ERROR: Missing photoUrl`);
        return res.status(400).json({
          message: "Photo URL is required. Send either 'photoUrl' or 'photos' array with photoUrl in each object."
        });
      }

      console.log(`[Zapier Webhook] ✅ Received ${photoArray.length} photo(s) for processing`);

      const { analyzePhotoQuality } = await import("./lib/photoQualityAnalyzer");
      const processedPhotos = [];
      const rejectedPhotos = [];

      // Process each photo through AI quality analysis
      for (const photo of photoArray) {
        if (!photo.photoUrl) {
          rejectedPhotos.push({ error: "Missing photoUrl", photo });
          continue;
        }

        try {
          console.log(`[Zapier Webhook] Analyzing photo: ${photo.photoUrl}`);
          const analysis = await analyzePhotoQuality(photo.photoUrl, photo.jobDescription || jobDescription);

          if (!analysis.shouldKeep) {
            console.log(`[Zapier Webhook] ❌ Rejected - ${analysis.reasoning}`);
            rejectedPhotos.push({ 
              photoUrl: photo.photoUrl, 
              reason: analysis.reasoning,
              score: analysis.qualityScore
            });
            continue;
          }

          // Categorize photo
          const category = categorizePhotoFromAnalysis(analysis.reasoning, analysis.categories);

          // Download photo and convert to WebP with retry logic
          const sharp = await import('sharp');
          
          // Helper function to retry fetch with exponential backoff
          const fetchWithRetry = async (url: string, maxRetries = 3): Promise<Buffer> => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                console.log(`[Zapier Webhook] Fetching photo (attempt ${attempt}/${maxRetries})...`);
                const response = await fetch(url);
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return Buffer.from(await response.arrayBuffer());
              } catch (error: any) {
                console.error(`[Zapier Webhook] Fetch attempt ${attempt} failed:`, error.message);
                if (attempt === maxRetries) {
                  throw new Error(`Failed to download photo after ${maxRetries} attempts: ${error.message}`);
                }
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                console.log(`[Zapier Webhook] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
            throw new Error('Retry logic failed unexpectedly');
          };
          
          // Fetch the photo from CompanyCam URL with retry
          const photoBuffer = await fetchWithRetry(photo.photoUrl);
          
          // Convert to WebP with high quality (85 = excellent quality, good compression)
          const webpBuffer = await sharp.default(photoBuffer)
            .webp({ quality: 85 })
            .toBuffer();
          
          console.log(`[Zapier Webhook] 🔄 Converted to WebP (${Math.round((1 - webpBuffer.length / photoBuffer.length) * 100)}% smaller)`);
          
          // Generate unique filename with .webp extension
          const timestamp = Date.now();
          const photoIdHash = Buffer.from(photo.photoUrl).toString('base64').substring(0, 16);
          const fileName = `companycam_${timestamp}_${photoIdHash}.webp`;
          
          // Upload to Object Storage (persists in published deployments)
          const { ObjectStorageService } = await import('./objectStorage');
          const objectStorage = new ObjectStorageService();
          
          // Get public object path from env with robust error handling
          let publicPath: string;
          try {
            const publicSearchPaths = objectStorage.getPublicObjectSearchPaths();
            if (!publicSearchPaths || publicSearchPaths.length === 0) {
              throw new Error('PUBLIC_OBJECT_SEARCH_PATHS is empty or not configured');
            }
            publicPath = publicSearchPaths[0];
          } catch (error: any) {
            throw new Error(`Object Storage not configured: ${error.message}. Please set PUBLIC_OBJECT_SEARCH_PATHS environment variable.`);
          }
          
          // Upload to: /bucket-name/public/imported_photos/{category}/{filename}.webp
          const objectStoragePath = `${publicPath}/imported_photos/${category}/${fileName}`;
          
          // Upload with retry logic (similar to previous disk write retries)
          const uploadWithRetry = async (buffer: Buffer, path: string, maxRetries = 3): Promise<void> => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                await objectStorage.uploadBuffer(buffer, path, 'image/webp');
                return; // Success!
              } catch (error: any) {
                console.error(`[Zapier Webhook] Upload attempt ${attempt} failed:`, error.message);
                if (attempt === maxRetries) {
                  throw new Error(`Failed to upload to Object Storage after ${maxRetries} attempts: ${error.message}`);
                }
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                console.log(`[Zapier Webhook] Retrying upload in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          };
          
          await uploadWithRetry(webpBuffer, objectStoragePath);
          console.log(`[Zapier Webhook] ☁️ Uploaded to Object Storage: ${objectStoragePath}`);

          // Generate unique photo ID from URL hash
          const photoId = Buffer.from(photo.photoUrl).toString('base64').substring(0, 32);
          const projectId = photo.jobId || jobId || 'zapier-import';

          // Generate web-facing URL for frontend access
          // Server route /public-objects/* will search object storage
          const publicUrl = `/public-objects/imported_photos/${category}/${fileName}`;

          const processedPhoto = {
            companyCamPhotoId: photoId,
            companyCamProjectId: projectId,
            photoUrl: publicUrl, // Web-facing URL (accessible by frontend)
            thumbnailUrl: publicUrl, // Same file for now
            category,
            aiDescription: analysis.reasoning,
            tags: analysis.categories,
            qualityAnalyzed: true,
            isGoodQuality: analysis.isGoodQuality,
            shouldKeep: analysis.shouldKeep,
            qualityScore: analysis.qualityScore,
            qualityReasoning: analysis.reasoning,
            analyzedAt: new Date(),
            uploadedAt: new Date(),
          };

          processedPhotos.push(processedPhoto);
          console.log(`[Zapier Webhook] ✅ Accepted - Category: ${category}, Score: ${analysis.qualityScore}/10`);
        } catch (error: any) {
          console.error(`[Zapier Webhook] Error processing photo ${photo.photoUrl}:`, error);
          rejectedPhotos.push({ 
            photoUrl: photo.photoUrl, 
            error: error.message 
          });
        }
      }

      // Save accepted photos to database
      const savedPhotos = processedPhotos.length > 0 
        ? await storage.savePhotos(processedPhotos)
        : [];

      console.log(`[Zapier Webhook] Complete: ${savedPhotos.length} saved, ${rejectedPhotos.length} rejected`);

      // Automatically detect before/after pairs if we have multiple photos from the same job
      let composites: any[] = [];
      if (savedPhotos.length >= 2 && jobId) {
        try {
          console.log(`[Zapier Webhook] Checking for before/after pairs from job ${jobId}...`);
          const { processBeforeAfterPairs } = await import("./lib/beforeAfterComposer");
          const newComposites = await processBeforeAfterPairs(savedPhotos, jobId);
          
          for (const composite of newComposites) {
            const saved = await storage.saveBeforeAfterComposite(composite);
            composites.push(saved);
          }
          
          if (composites.length > 0) {
            console.log(`[Zapier Webhook] ✅ Created ${composites.length} before/after composite(s)`);
          }
        } catch (error: any) {
          console.error(`[Zapier Webhook] Error creating before/after composites:`, error);
          // Don't fail the whole request if composite creation fails
        }
      }

      res.json({
        success: true,
        imported: savedPhotos.length,
        rejected: rejectedPhotos.length,
        compositesCreated: composites.length,
        photos: savedPhotos,
        composites,
        rejectedPhotos: rejectedPhotos,
        message: `Successfully imported ${savedPhotos.length} quality photos${composites.length > 0 ? ` and created ${composites.length} before/after composite(s)` : ''}. Rejected ${rejectedPhotos.length} low-quality/irrelevant photos.`
      });
    } catch (error: any) {
      console.error("[Zapier Webhook] Error:", error);
      res.status(500).json({
        message: "Photo webhook processing failed",
        error: error.message
      });
    }
  });
  */

  // Import photos from Google Drive folder
  app.post("/api/photos/import-google-drive", async (req, res) => {
    try {
      const { folderId } = req.body;

      if (!folderId) {
        return res.status(400).json({ 
          message: "Google Drive folder ID is required" 
        });
      }

      console.log(`[Google Drive Import] Starting import from folder: ${folderId}`);

      const { getImagesFromFolder, downloadFileAsBuffer } = await import("./lib/googleDriveClient");
      const { analyzePhotoQuality } = await import("./lib/photoQualityAnalyzer");

      // Get all images from the folder
      const files = await getImagesFromFolder(folderId);
      console.log(`[Google Drive Import] Found ${files.length} images in folder`);

      const savedPhotos = [];
      const rejectedPhotos = [];
      const photosByCategory: Record<string, any[]> = {};

      // Process each image and save to database incrementally
      for (const file of files) {
        try {
          console.log(`[Google Drive Import] Processing: ${file.name}`);

          // Check if photo already exists in database (skip duplicates)
          const photoId = file.id || Buffer.from(file.name || '').toString('base64').substring(0, 32);
          const existingPhoto = await db.select().from(companyCamPhotos)
            .where(eq(companyCamPhotos.companyCamPhotoId, photoId))
            .limit(1);
          
          if (existingPhoto.length > 0) {
            console.log(`[Google Drive Import] ⏭️  Skipping ${file.name} (already in database)`);
            continue;
          }

          // Download file as buffer to get a URL we can analyze
          const buffer = await downloadFileAsBuffer(file.id!);
          const base64Image = `data:${file.mimeType};base64,${buffer.toString('base64')}`;

          // Analyze with AI
          const analysis = await analyzePhotoQuality(base64Image, file.name || '');

          if (!analysis.shouldKeep) {
            console.log(`[Google Drive Import] ❌ Rejected ${file.name} - ${analysis.reasoning}`);
            console.log(`[Google Drive Import] 🗑️  Skipping save to server (keeping original in Google Drive)`);
            
            rejectedPhotos.push({
              fileName: file.name,
              reason: analysis.reasoning,
              score: analysis.qualityScore
            });
            continue;
          }

          // Categorize
          const category = categorizePhotoFromAnalysis(analysis.reasoning, analysis.categories);

          // Convert to WebP and save locally to server
          const fs = await import('fs/promises');
          const path = await import('path');
          const sharp = await import('sharp');
          
          // Convert to WebP with high quality (85 = excellent quality, good compression)
          const webpBuffer = await sharp.default(buffer)
            .webp({ quality: 85 })
            .toBuffer();
          
          console.log(`[Google Drive Import] 🔄 Converted to WebP (${Math.round((1 - webpBuffer.length / buffer.length) * 100)}% smaller)`);
          
          // Create category subfolder
          const categoryFolder = path.join('attached_assets/imported_photos', category);
          await fs.mkdir(categoryFolder, { recursive: true });
          
          // Generate unique filename with .webp extension
          const timestamp = Date.now();
          const sanitizedName = file.name?.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.(jpg|jpeg|png)$/i, '') || 'unnamed';
          const localFileName = `${timestamp}_${sanitizedName}.webp`;
          const localFilePath = path.join(categoryFolder, localFileName);
          
          // Save WebP file to disk
          await fs.writeFile(localFilePath, webpBuffer);
          console.log(`[Google Drive Import] 💾 Saved WebP to server: ${localFilePath}`);

          // Create photo record with local file path (photoId already declared above)
          const photoData = {
            companyCamPhotoId: photoId,
            companyCamProjectId: 'google-drive-import',
            photoUrl: `/${localFilePath}`, // Local server path
            thumbnailUrl: `/${localFilePath}`, // Same file for now
            category,
            aiDescription: analysis.reasoning,
            tags: analysis.categories,
            qualityAnalyzed: true,
            isGoodQuality: analysis.isGoodQuality,
            shouldKeep: analysis.shouldKeep,
            qualityScore: analysis.qualityScore,
            qualityReasoning: analysis.reasoning,
            analyzedAt: new Date(),
            uploadedAt: new Date(),
          };

          // Save to database immediately (incremental save)
          const savedPhotoArray = await storage.savePhotos([photoData]);
          const savedPhoto = savedPhotoArray[0];
          savedPhotos.push(savedPhoto);
          
          // Track by category for before/after detection
          if (!photosByCategory[category]) {
            photosByCategory[category] = [];
          }
          photosByCategory[category].push(savedPhoto);
          
          console.log(`[Google Drive Import] ✅ Accepted ${file.name} - Category: ${category}, Score: ${analysis.qualityScore}/10`);
          console.log(`[Google Drive Import] 💾 Saved to database (ID: ${savedPhoto.id})`);
        } catch (error: any) {
          console.error(`[Google Drive Import] Error processing ${file.name}:`, error);
          rejectedPhotos.push({
            fileName: file.name,
            error: error.message
          });
        }
      }

      // Calculate category stats (photosByCategory already built incrementally above)
      const categoryStats: Record<string, { count: number; avgScore: number }> = {};
      
      for (const [category, photos] of Object.entries(photosByCategory)) {
        let totalScore = 0;
        for (const photo of photos) {
          totalScore += photo.qualityScore || 0;
        }
        categoryStats[category] = {
          count: photos.length,
          avgScore: photos.length > 0 ? totalScore / photos.length : 0
        };
      }

      console.log(`[Google Drive Import] Complete: ${savedPhotos.length} photos saved, ${rejectedPhotos.length} rejected`);
      console.log(`[Google Drive Import] Categories:`, Object.keys(photosByCategory).join(', '));

      res.json({
        success: true,
        summary: {
          totalImported: savedPhotos.length,
          totalRejected: rejectedPhotos.length,
          categories: Object.keys(photosByCategory).length,
        },
        organization: {
          byCategory: photosByCategory,
          categoryStats,
        },
        photos: savedPhotos,
        rejectedPhotos,
        message: `Successfully imported ${savedPhotos.length} quality photos across ${Object.keys(photosByCategory).length} categories. Rejected ${rejectedPhotos.length} low-quality/irrelevant photos.`
      });
    } catch (error: any) {
      console.error("[Google Drive Import] Error:", error);
      res.status(500).json({
        message: "Google Drive import failed",
        error: error.message
      });
    }
  });

  // Create before/after composites from job photos
  app.post("/api/photos/create-before-after", async (req, res) => {
    try {
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
      }

      // Get photos for this specific job
      const jobPhotos = await storage.getPhotosByJob(jobId);

      if (jobPhotos.length < 2) {
        return res.status(400).json({ 
          message: `Need at least 2 photos from job ${jobId}. Found ${jobPhotos.length} photos.`
        });
      }

      const { processBeforeAfterPairs } = await import("./lib/beforeAfterComposer");
      const composites = await processBeforeAfterPairs(jobPhotos, jobId);

      // Save composites to database
      const savedComposites = [];
      for (const composite of composites) {
        const saved = await storage.saveBeforeAfterComposite(composite);
        savedComposites.push(saved);
      }

      res.json({
        success: true,
        created: savedComposites.length,
        composites: savedComposites,
      });
    } catch (error: any) {
      console.error("Error creating before/after composites:", error);
      res.status(500).json({
        message: "Failed to create before/after composites",
        error: error.message
      });
    }
  });

  // Get all before/after composites
  app.get("/api/before-after-composites", async (req, res) => {
    try {
      const composites = await storage.getBeforeAfterComposites();
      res.json(composites);
    } catch (error: any) {
      console.error("Error fetching composites:", error);
      res.status(500).json({ message: "Failed to fetch composites" });
    }
  });

  // Download composite as JPEG (Instagram/Facebook compatible)
  app.get("/api/before-after-composites/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const composites = await storage.getBeforeAfterComposites();
      const composite = composites.find(c => c.id === id);

      if (!composite) {
        return res.status(404).json({ message: "Composite not found" });
      }

      // Fetch the composite image
      let imageBuffer: Buffer;
      
      if (composite.compositeUrl.startsWith('http')) {
        // External URL
        const response = await fetch(composite.compositeUrl);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        // Local/object storage path
        const sharp = await import('sharp');
        const fs = await import('fs/promises');
        const { ObjectStorageService } = await import('./objectStorage');
        const objectStorage = new ObjectStorageService();
        
        // Normalize path for object storage: remove leading slash and 'public-objects/' prefix
        let normalizedPath = composite.compositeUrl.startsWith('/') ? composite.compositeUrl.substring(1) : composite.compositeUrl;
        if (normalizedPath.startsWith('public-objects/')) {
          normalizedPath = normalizedPath.substring('public-objects/'.length);
        }
        
        try {
          // Try object storage first
          const file = await objectStorage.searchPublicObject(normalizedPath);
          if (file) {
            const [buffer] = await file.download();
            imageBuffer = buffer;
          } else {
            // Fall back to local filesystem
            imageBuffer = await fs.readFile(normalizedPath);
          }
        } catch {
          imageBuffer = await fs.readFile(normalizedPath);
        }
      }

      // Convert to JPEG for social media compatibility
      const sharp = await import('sharp');
      const jpegBuffer = await sharp.default(imageBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();

      // Set headers for download
      const filename = `${composite.caption?.slice(0, 50).replace(/[^a-z0-9]/gi, '-') || 'before-after'}.jpg`;
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(jpegBuffer);
    } catch (error: any) {
      console.error("Error downloading composite:", error);
      res.status(500).json({ message: "Failed to download composite" });
    }
  });

  // RSS feed for Success Stories page
  app.get("/api/success-stories/rss.xml", async (req, res) => {
    try {
      const stories = await storage.getApprovedSuccessStories();
      const baseUrl = 'https://www.plumbersthatcare.com';

      // Build RSS XML from customer success stories
      const rssItems = stories.slice(0, 20).map(story => {
        const pubDate = new Date(story.submittedAt).toUTCString();
        
        // Use pre-generated JPEG version for RSS feed
        let imageUrl = `${baseUrl}/attached_assets/logo.jpg`; // Default fallback
        
        if (story.jpegCollagePhotoUrl) {
          // Use the pre-generated JPEG version (created at approval)
          imageUrl = story.jpegCollagePhotoUrl.startsWith('http') 
            ? story.jpegCollagePhotoUrl 
            : `${baseUrl}${story.jpegCollagePhotoUrl}`;
        } else if (story.collagePhotoUrl) {
          // Fallback: use collagePhotoUrl if no JPEG version exists (for old stories)
          imageUrl = story.collagePhotoUrl.startsWith('http') 
            ? story.collagePhotoUrl 
            : `${baseUrl}${story.collagePhotoUrl}`;
        }
        
        return `
    <item>
      <title><![CDATA[${story.customerName} - ${story.serviceCategory}]]></title>
      <link>${baseUrl}/success-stories</link>
      <guid isPermaLink="false">${story.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${story.serviceCategory}</category>
      <description><![CDATA[
        <img src="${imageUrl}" alt="${story.customerName} success story" style="max-width: 100%;" />
        <p><strong>${story.location}</strong></p>
        <p>${story.story}</p>
      ]]></description>
      <enclosure url="${imageUrl}" type="image/jpeg" />
    </item>`;
      }).join('');

      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Economy Plumbing Services - Success Stories</title>
    <link>${baseUrl}/success-stories</link>
    <description>Real customer testimonials and before/after photos from our plumbing projects in Austin and Marble Falls. Water heater installations, leak repairs, drain cleaning, and more.</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/api/success-stories/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
  </channel>
</rss>`;

      res.setHeader('Content-Type', 'application/rss+xml; charset=UTF-8');
      res.send(rssXml);
    } catch (error: any) {
      console.error("Error generating RSS feed:", error);
      res.status(500).json({ message: "Failed to generate RSS feed" });
    }
  });

  // Get best unused composite for Zapier Facebook posting
  app.get("/api/social-media/best-composite", async (req, res) => {
    try {
      const composites = await storage.getUnusedComposites();

      if (composites.length === 0) {
        return res.status(404).json({
          message: "No unused composites available for posting"
        });
      }

      // Get the best one (highest quality score)
      const bestComposite = composites.reduce((best: any, current: any) => {
        const currentScore = (current.beforePhotoScore || 0) + (current.afterPhotoScore || 0);
        const bestScore = (best.beforePhotoScore || 0) + (best.afterPhotoScore || 0);
        return currentScore > bestScore ? current : best;
      }, composites[0]);

      // Return data formatted for Zapier
      res.json({
        success: true,
        composite: {
          id: bestComposite.id,
          imageUrl: bestComposite.compositeUrl,
          caption: bestComposite.caption || `Check out this amazing transformation! 🔧✨\n\nCall us at (512) 575-3157 or visit https://www.plumbersthatcare.com/?utm=facebook`,
          category: bestComposite.category,
          beforePhotoUrl: bestComposite.beforePhotoUrl,
          afterPhotoUrl: bestComposite.afterPhotoUrl,
          jobDescription: bestComposite.jobDescription,
          totalScore: (bestComposite.beforePhotoScore || 0) + (bestComposite.afterPhotoScore || 0)
        }
      });
    } catch (error: any) {
      console.error("Error fetching best composite:", error);
      res.status(500).json({
        message: "Failed to fetch best composite",
        error: error.message
      });
    }
  });

  // Mark composite as used (called by Zapier after posting)
  app.post("/api/social-media/mark-posted", async (req, res) => {
    try {
      const { compositeId, facebookPostId, instagramPostId } = req.body;

      if (!compositeId) {
        return res.status(400).json({ 
          message: "Composite ID is required" 
        });
      }

      await storage.markCompositeAsPosted(
        compositeId, 
        facebookPostId || null, 
        instagramPostId || null
      );

      res.json({
        success: true,
        message: "Composite marked as posted to social media"
      });
    } catch (error: any) {
      console.error("Error marking composite as posted:", error);
      res.status(500).json({
        message: "Failed to mark composite as posted",
        error: error.message
      });
    }
  });

  // Manually post best before/after to social media
  app.post("/api/social-media/post-best", async (req, res) => {
    try {
      const { manuallyPostBest } = await import("./lib/weeklyPostScheduler");
      await manuallyPostBest();

      res.json({
        success: true,
        message: "Posted best before/after composite to social media"
      });
    } catch (error: any) {
      console.error("Error posting to social media:", error);
      res.status(500).json({
        message: "Failed to post to social media",
        error: error.message
      });
    }
  });

  // ===== BLOG GENERATION ENDPOINTS =====
  
  // Generate blog posts from unused photos
  app.post("/api/blog/generate-from-photos", async (req, res) => {
    try {
      const { count = 30, backdatePercentage = 0.2 } = req.body;
      
      console.log(`[Blog Generation] Starting generation of ${count} blog posts (indefinite weekly schedule)...`);
      
      // Get photos without blog topics
      const photos = await storage.getPhotosWithoutBlogTopic();
      
      if (photos.length === 0) {
        return res.status(404).json({
          message: "No unused photos available for blog generation. Please import photos first."
        });
      }
      
      if (photos.length < count) {
        console.warn(`[Blog Generation] Only ${photos.length} photos available, requested ${count}`);
      }
      
      const photosToUse = photos.slice(0, Math.min(count, photos.length));
      
      const { suggestBlogTopic, generateBlogPost } = await import("./lib/blogTopicAnalyzer");
      const { scheduleBlogs, formatScheduleForDb } = await import("./lib/blogScheduler");
      
      const blogTopicSuggestions = [];
      
      // Step 1: Analyze photos and suggest blog topics
      console.log(`[Blog Generation] Analyzing ${photosToUse.length} photos for blog topics...`);
      for (const photo of photosToUse) {
        try {
          const topicSuggestion = await suggestBlogTopic(photo);
          await storage.updatePhotoWithBlogTopic(photo.id, topicSuggestion.title);
          blogTopicSuggestions.push({
            photo,
            topicSuggestion
          });
        } catch (error: any) {
          console.error(`[Blog Generation] Error suggesting topic for photo ${photo.id}:`, error);
        }
      }
      
      console.log(`[Blog Generation] Generated ${blogTopicSuggestions.length} topic suggestions`);
      
      // Step 2: Generate blog posts from topics
      const generatedBlogs = [];
      for (const { photo, topicSuggestion } of blogTopicSuggestions) {
        try {
          const blogPost = await generateBlogPost(photo, topicSuggestion);
          generatedBlogs.push({
            ...blogPost,
            photoId: photo.id,
            topicSuggestion
          });
        } catch (error: any) {
          console.error(`[Blog Generation] Error generating blog for topic "${topicSuggestion.title}":`, error);
        }
      }
      
      console.log(`[Blog Generation] Generated ${generatedBlogs.length} blog posts`);
      
      // Step 3: Schedule blog posts (indefinitely - 1 per week)
      const scheduledBlogs = scheduleBlogs(generatedBlogs, {
        totalPosts: generatedBlogs.length,
        startDate: new Date(),
        postsPerWeek: 1,
        backdatePercentage
      });
      
      // Step 4: Save to database
      const savedBlogs = [];
      for (const scheduledBlog of scheduledBlogs) {
        try {
          const scheduleData = formatScheduleForDb(scheduledBlog);
          
          // Get photo and process image for proper cropping
          let featuredImage = null;
          if (scheduledBlog.photoId) {
            const photo = await storage.getPhotoById(scheduledBlog.photoId);
            if (photo?.photoUrl) {
              console.log(`[Blog Generation] Processing image for: ${scheduledBlog.title}`);
              const processedImage = await processBlogImage(photo.photoUrl, scheduledBlog.title);
              featuredImage = processedImage.imagePath;
              console.log(`[Blog Generation] Cropped image saved: ${featuredImage}`);
            }
          }
          
          const saved = await storage.createBlogPost({
            title: scheduledBlog.title,
            slug: scheduledBlog.slug,
            content: scheduledBlog.content,
            excerpt: scheduledBlog.excerpt,
            metaDescription: scheduledBlog.metaDescription,
            category: scheduledBlog.category,
            featuredImage,
            author: "Economy Plumbing",
            published: true,
            h1: generateH1FromTitle(scheduledBlog.title),
          });
          
          // Update blog post with schedule data
          await storage.updateBlogPost(saved.id, {
            ...scheduleData as any,
          });
          
          // Mark photo as used
          if (scheduledBlog.photoId) {
            await storage.markPhotoAsUsed(scheduledBlog.photoId, saved.id);
          }
          
          savedBlogs.push(saved);
        } catch (error: any) {
          console.error(`[Blog Generation] Error saving blog "${scheduledBlog.title}":`, error);
        }
      }
      
      console.log(`[Blog Generation] Successfully saved ${savedBlogs.length} blog posts`);
      
      res.json({
        success: true,
        generated: savedBlogs.length,
        photosAnalyzed: photosToUse.length,
        blogs: savedBlogs.map(blog => ({
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
          category: blog.category,
          publishDate: blog.publishDate,
          excerpt: blog.excerpt
        })),
        message: `Successfully generated and scheduled ${savedBlogs.length} blog posts`
      });
    } catch (error: any) {
      console.error("[Blog Generation] Error:", error);
      res.status(500).json({
        message: "Blog generation failed",
        error: error.message
      });
    }
  });

  // ============================================
  // MAILGUN WEBHOOK - XLSX CUSTOMER DATA IMPORT
  // ============================================
  
  // Bulletproof webhook handler with comprehensive logging
  try {
    console.log('[Routes] Importing Mailgun webhook handler...');
    const { handleMailgunWebhook } = await import('./webhooks/mailgunCustomerData');
    console.log('[Routes] Mailgun webhook handler imported successfully, type:', typeof handleMailgunWebhook);
    app.post("/api/webhooks/mailgun/customer-data", handleMailgunWebhook);
    console.log('[Routes] Mailgun webhook route registered at POST /api/webhooks/mailgun/customer-data');
    
    // Verify route was actually registered by Express
    const routes = (app._router?.stack || [])
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({ path: layer.route.path, methods: Object.keys(layer.route.methods) }));
    const webhookRoute = routes.find((r: any) => r.path === '/api/webhooks/mailgun/customer-data');
    console.log('[Routes] Verification - webhook route in Express stack:', webhookRoute ? 'FOUND' : 'NOT FOUND');
  } catch (error) {
    console.error('[Routes] CRITICAL ERROR: Failed to import Mailgun webhook handler:', error);
  }

  // Admin authentication middleware - OAuth + whitelist required (for review management, etc.)
  const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const session = (req as any).session;
    const user = req.user as any;
    
    // Check session admin flag
    if (!session || !session.isAdmin) {
      return res.status(401).json({ error: "Unauthorized - OAuth login required" });
    }
    
    // Verify OAuth authentication
    if (!req.isAuthenticated() || !user?.claims?.email) {
      return res.status(401).json({ error: "Unauthorized - OAuth authentication required" });
    }
    
    // Verify email is still whitelisted (in case it was removed)
    const isWhitelisted = await storage.isEmailWhitelisted(user.claims.email);
    if (!isWhitelisted) {
      // Clear session if no longer whitelisted
      session.isAdmin = false;
      return res.status(403).json({ error: "Access denied - not whitelisted" });
    }
    
    next();
  };


  // ============================================
  // ADMIN REVIEW MANAGEMENT ENDPOINTS
  // ============================================
  // Note: Custom reviews endpoints moved to line ~3787

  // ============================================
  // REVIEW PLATFORMS ENDPOINTS
  // ============================================

  // Public: Get enabled review platforms
  app.get("/api/review-platforms", async (req, res) => {
    try {
      const platforms = await storage.getEnabledReviewPlatforms();
      res.json(platforms);
    } catch (error: any) {
      console.error('[Review Platforms] Error fetching platforms:', error);
      res.status(500).json({ message: "Error fetching review platforms" });
    }
  });

  // Admin: Get all review platforms
  app.get("/api/admin/review-platforms", requireAdmin, async (req, res) => {
    try {
      const platforms = await storage.getAllReviewPlatforms();
      res.json(platforms);
    } catch (error: any) {
      console.error('[Admin Review Platforms] Error fetching platforms:', error);
      res.status(500).json({ message: "Error fetching review platforms" });
    }
  });

  // Admin: Update a review platform
  app.patch("/api/admin/review-platforms/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const platform = await storage.updateReviewPlatform(id, updates);
      console.log(`[Admin Review Platforms] Updated platform ${id}`);
      res.json({ success: true, platform });
    } catch (error: any) {
      console.error('[Admin Review Platforms] Error updating platform:', error);
      res.status(500).json({ message: "Error updating review platform" });
    }
  });

  // Admin: Get all Google reviews (includes Google, Facebook, Yelp reviews)
  app.get("/api/admin/google-reviews", requireAdmin, async (req, res) => {
    try {
      const reviews = await storage.getGoogleReviews();
      res.json({ reviews });
    } catch (error: any) {
      console.error('[Admin Google Reviews] Error fetching reviews:', error);
      res.status(500).json({ message: "Error fetching Google reviews" });
    }
  });

  // Check admin auth status
  app.get("/api/admin/check", (req, res) => {
    const session = (req as any).session;
    const user = req.user as any;
    res.json({ 
      isAdmin: !!session?.isAdmin && !!user?.claims?.email
    });
  });

  // Clear admin session (for debugging/reset purposes)
  app.get("/api/admin/clear-session", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("[Admin] Logout error:", err);
      }
      (req as any).session.destroy((destroyErr: any) => {
        if (destroyErr) {
          console.error("[Admin] Session destroy error:", destroyErr);
          return res.status(500).json({ error: "Failed to clear session" });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Session cleared successfully. Please close this tab and try logging in again." });
      });
    });
  });

  // Get system health status (admin only)
  // Commented out - health monitoring functions removed with marketing automation
  // app.get("/api/admin/system-health", requireAdmin, async (req, res) => {
  //   try {
  //     res.json({
  //       systemHealth: { status: 'healthy' },
  //       services: []
  //     });
  //   } catch (error: any) {
  //     console.error('[Admin] Error fetching system health:', error);
  //     res.status(500).json({ error: error.message });
  //   }
  // });

  // Get all photos (admin only)
  app.get("/api/admin/photos", requireAdmin, async (req, res) => {
    try {
      const { category, quality, status } = req.query;
      
      let photos = await storage.getAllPhotos();
      
      // Apply filters
      if (category && category !== 'all') {
        photos = photos.filter((p: any) => p.category === category);
      }
      
      if (quality && quality !== 'all') {
        if (quality === 'good') {
          photos = photos.filter((p: any) => p.isGoodQuality);
        } else if (quality === 'poor') {
          photos = photos.filter((p: any) => !p.isGoodQuality);
        }
      }
      
      if (status && status !== 'all') {
        if (status === 'used') {
          photos = photos.filter((p: any) => p.usedInBlogPostId || p.usedInPageUrl);
        } else if (status === 'unused') {
          photos = photos.filter((p: any) => !p.usedInBlogPostId && !p.usedInPageUrl);
        }
      }
      
      res.json({ photos });
    } catch (error: any) {
      console.error("[Admin] Error fetching photos:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update photo focal point (admin only)
  app.put("/api/admin/photos/:id/focal-point", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { focalPointX, focalPointY, photoSource } = req.body;

      // Validate inputs
      if (focalPointX !== null && (typeof focalPointX !== 'number' || focalPointX < 0 || focalPointX > 100)) {
        return res.status(400).json({ error: "focalPointX must be a number between 0 and 100" });
      }
      if (focalPointY !== null && (typeof focalPointY !== 'number' || focalPointY < 0 || focalPointY > 100)) {
        return res.status(400).json({ error: "focalPointY must be a number between 0 and 100" });
      }

      // Update the appropriate table based on photo source
      if (photoSource === 'google-drive') {
        await db
          .update(importedPhotos)
          .set({
            focalPointX: focalPointX === null ? null : Math.round(focalPointX),
            focalPointY: focalPointY === null ? null : Math.round(focalPointY),
          })
          .where(eq(importedPhotos.id, id));
      } else {
        // Default to companyCamPhotos for companycam and other sources
        await db
          .update(companyCamPhotos)
          .set({
            focalPointX: focalPointX === null ? null : Math.round(focalPointX),
            focalPointY: focalPointY === null ? null : Math.round(focalPointY),
          })
          .where(eq(companyCamPhotos.id, id));
      }

      res.json({ 
        success: true, 
        message: "Focal point updated successfully",
        focalPoint: { x: focalPointX, y: focalPointY }
      });
    } catch (error: any) {
      console.error("[Admin] Error updating focal point:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get photo stats (admin only)
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const photos = await storage.getAllPhotos();
      
      const stats = {
        total: photos.length,
        unused: photos.filter((p: any) => !p.usedInBlogPostId && !p.usedInPageUrl).length,
        used: photos.filter((p: any) => p.usedInBlogPostId || p.usedInPageUrl).length,
        goodQuality: photos.filter((p: any) => p.isGoodQuality).length,
        poorQuality: photos.filter((p: any) => !p.isGoodQuality).length,
        byCategory: photos.reduce((acc: any, p: any) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      
      res.json({ stats });
    } catch (error: any) {
      console.error("[Admin] Error fetching stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ADMIN CAMPAIGN ANALYTICS ENDPOINTS
  // ============================================

  // Admin: Get overall campaign analytics
  app.get("/api/admin/campaign-analytics/overview", requireAdmin, async (req, res) => {
    try {
      const { reviewRequests, referralNurtureCampaigns, emailSendLog } = await import("@shared/schema");
      const { days = '30' } = req.query;
      
      // Build date filter if not "all"
      const dateFilter = days === 'all' 
        ? sql`true`
        : sql`${reviewRequests.createdAt} >= now() - interval '${sql.raw(days as string)} days'`;
      
      const emailDateFilter = days === 'all'
        ? sql`true`
        : sql`${emailSendLog.sentAt} >= now() - interval '${sql.raw(days as string)} days'`;
      
      // Get all campaign counts and stats
      const [reviewStats] = await db
        .select({
          total: sql<number>`count(*)`,
          completed: sql<number>`count(*) filter (where status = 'completed')`,
          paused: sql<number>`count(*) filter (where status = 'paused')`,
          totalOpens: sql<number>`sum(${reviewRequests.emailOpens})`,
          totalClicks: sql<number>`sum(${reviewRequests.linkClicks})`,
        })
        .from(reviewRequests)
        .where(dateFilter);

      const [referralStats] = await db
        .select({
          total: sql<number>`count(*)`,
          completed: sql<number>`count(*) filter (where status = 'completed')`,
          paused: sql<number>`count(*) filter (where status = 'paused')`,
          totalOpens: sql<number>`sum(${referralNurtureCampaigns.totalOpens})`,
          totalClicks: sql<number>`sum(${referralNurtureCampaigns.totalClicks})`,
        })
        .from(referralNurtureCampaigns)
        .where(days === 'all' 
          ? sql`true`
          : sql`${referralNurtureCampaigns.createdAt} >= now() - interval '${sql.raw(days as string)} days'`);

      // Get email send stats
      const [emailStats] = await db
        .select({
          totalSent: sql<number>`count(*)`,
          totalOpened: sql<number>`count(*) filter (where ${emailSendLog.openedAt} is not null)`,
          totalClicked: sql<number>`count(*) filter (where ${emailSendLog.clickedAt} is not null)`,
          totalBounced: sql<number>`count(*) filter (where ${emailSendLog.bouncedAt} is not null)`,
          totalComplained: sql<number>`count(*) filter (where ${emailSendLog.complainedAt} is not null)`,
        })
        .from(emailSendLog)
        .where(emailDateFilter);

      res.json({
        reviewRequests: {
          total: Number(reviewStats?.total || 0),
          completed: Number(reviewStats?.completed || 0),
          paused: Number(reviewStats?.paused || 0),
          openRate: reviewStats?.totalOpens && reviewStats?.total 
            ? (Number(reviewStats.totalOpens) / (Number(reviewStats.total) * 4) * 100).toFixed(1)
            : '0.0',
          clickRate: reviewStats?.totalClicks && reviewStats?.total
            ? (Number(reviewStats.totalClicks) / (Number(reviewStats.total) * 4) * 100).toFixed(1)
            : '0.0',
        },
        referralNurture: {
          total: Number(referralStats?.total || 0),
          completed: Number(referralStats?.completed || 0),
          paused: Number(referralStats?.paused || 0),
          openRate: referralStats?.totalOpens && referralStats?.total
            ? (Number(referralStats.totalOpens) / (Number(referralStats.total) * 4) * 100).toFixed(1)
            : '0.0',
          clickRate: referralStats?.totalClicks && referralStats?.total
            ? (Number(referralStats.totalClicks) / (Number(referralStats.total) * 4) * 100).toFixed(1)
            : '0.0',
        },
        emailStats: {
          totalSent: Number(emailStats?.totalSent || 0),
          totalOpened: Number(emailStats?.totalOpened || 0),
          totalClicked: Number(emailStats?.totalClicked || 0),
          totalBounced: Number(emailStats?.totalBounced || 0),
          totalComplained: Number(emailStats?.totalComplained || 0),
          openRate: emailStats?.totalSent && emailStats?.totalOpened
            ? (Number(emailStats.totalOpened) / Number(emailStats.totalSent) * 100).toFixed(1)
            : '0.0',
          clickRate: emailStats?.totalSent && emailStats?.totalClicked
            ? (Number(emailStats.totalClicked) / Number(emailStats.totalSent) * 100).toFixed(1)
            : '0.0',
        },
      });
    } catch (error: any) {
      console.error("[Admin] Error fetching campaign analytics:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get campaign analytics by type and time period
  app.get("/api/admin/campaign-analytics/by-type", requireAdmin, async (req, res) => {
    try {
      const { emailSendLog } = await import("@shared/schema");
      const { days = '30' } = req.query;
      
      // Build date filter if not "all"
      const dateFilter = days === 'all'
        ? sql`true`
        : sql`${emailSendLog.sentAt} >= now() - interval '${sql.raw(days as string)} days'`;
      
      // Get stats grouped by campaign type for the time period
      const stats = await db
        .select({
          campaignType: emailSendLog.campaignType,
          totalSent: sql<number>`count(*)`,
          totalOpened: sql<number>`count(*) filter (where ${emailSendLog.openedAt} is not null)`,
          totalClicked: sql<number>`count(*) filter (where ${emailSendLog.clickedAt} is not null)`,
          avgTimeToOpen: sql<number>`avg(extract(epoch from (${emailSendLog.openedAt} - ${emailSendLog.sentAt})))`,
          avgTimeToClick: sql<number>`avg(extract(epoch from (${emailSendLog.clickedAt} - ${emailSendLog.sentAt})))`,
        })
        .from(emailSendLog)
        .where(dateFilter)
        .groupBy(emailSendLog.campaignType);

      const formattedStats = stats.map(stat => ({
        campaignType: stat.campaignType,
        totalSent: Number(stat.totalSent),
        totalOpened: Number(stat.totalOpened),
        totalClicked: Number(stat.totalClicked),
        openRate: stat.totalSent > 0 
          ? ((Number(stat.totalOpened) / Number(stat.totalSent)) * 100).toFixed(1)
          : '0.0',
        clickRate: stat.totalSent > 0
          ? ((Number(stat.totalClicked) / Number(stat.totalSent)) * 100).toFixed(1)
          : '0.0',
        avgTimeToOpen: stat.avgTimeToOpen ? Math.round(Number(stat.avgTimeToOpen) / 3600) : null, // hours
        avgTimeToClick: stat.avgTimeToClick ? Math.round(Number(stat.avgTimeToClick) / 3600) : null, // hours
      }));

      res.json({ stats: formattedStats, period: days === 'all' ? 'all time' : `${days} days` });
    } catch (error: any) {
      console.error("[Admin] Error fetching campaign analytics by type:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get recent campaign activity
  app.get("/api/admin/campaign-analytics/recent", requireAdmin, async (req, res) => {
    try {
      const { emailSendLog } = await import("@shared/schema");
      const { limit = '50', days = '30' } = req.query;
      
      // Build date filter if not "all"
      const dateFilter = days === 'all'
        ? sql`true`
        : sql`${emailSendLog.sentAt} >= now() - interval '${sql.raw(days as string)} days'`;
      
      const recentEmails = await db
        .select()
        .from(emailSendLog)
        .where(dateFilter)
        .orderBy(desc(emailSendLog.sentAt))
        .limit(parseInt(limit as string));

      res.json({ emails: recentEmails });
    } catch (error: any) {
      console.error("[Admin] Error fetching recent campaign activity:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // ADMIN REVIEW SYSTEM ENDPOINTS
  // ============================================

  // Admin: Get all reviews (pending, approved, rejected)
  app.get("/api/admin/reviews", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const reviews = await storage.getAllReviews(status);
      res.json(reviews);
    } catch (error: any) {
      console.error('[Review Admin] Error fetching reviews:', error);
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });

  // Admin: Moderate a review (approve/reject/spam)
  app.patch("/api/admin/reviews/:id/moderate", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, moderationNotes, featured, displayOnWebsite } = req.body;
      
      if (!['approved', 'rejected', 'spam'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const moderatorId = (req.user as any)?.id || 'admin';
      
      const review = await storage.moderateReview(id, {
        status,
        moderatedBy: moderatorId,
        moderationNotes,
        featured: featured !== undefined ? featured : undefined,
        displayOnWebsite: displayOnWebsite !== undefined ? displayOnWebsite : undefined,
      });
      
      console.log(`[Review Admin] Review ${id} ${status} by ${moderatorId}`);
      res.json(review);
    } catch (error: any) {
      console.error('[Review Admin] Moderation error:', error);
      res.status(400).json({ message: "Error moderating review: " + error.message });
    }
  });

  // Admin: Delete a review
  app.delete("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReview(id);
      console.log(`[Review Admin] Review ${id} deleted`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[Review Admin] Delete error:', error);
      res.status(400).json({ message: "Error deleting review: " + error.message });
    }
  });

  // Admin: Get review statistics
  app.get("/api/admin/reviews/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getReviewStats();
      res.json(stats);
    } catch (error: any) {
      console.error('[Review Admin] Stats error:', error);
      res.status(500).json({ message: "Error fetching review stats" });
    }
  });

  // Admin: Generate AI reply for a review
  app.post("/api/admin/reviews/:reviewId/generate-reply", requireAdmin, async (req, res) => {
    try {
      const { reviewId } = req.params;
      
      // Validate request body
      const schema = z.object({
        type: z.enum(['google', 'custom']),
      });
      const { type } = schema.parse(req.body);
      
      // Fetch the review
      let review: any;
      if (type === 'custom') {
        const reviews = await storage.getAllReviews();
        review = reviews.find((r: any) => r.id === reviewId);
        if (!review) {
          return res.status(404).json({ message: "Review not found" });
        }
      } else {
        const { googleReviews } = await import("@shared/schema");
        const result = await db
          .select()
          .from(googleReviews)
          .where(eq(googleReviews.id, reviewId))
          .execute();
        
        if (!result || result.length === 0) {
          return res.status(404).json({ message: "Review not found" });
        }
        review = result[0];
      }
      
      // Generate AI reply using OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const prompt = `You are responding to a customer review for Economy Plumbing Services, a professional plumbing company in Austin, Texas.

Review Details:
- Customer: ${type === 'custom' ? review.customerName : review.authorName}
- Rating: ${review.rating}/5 stars
- Review: "${review.text}"

Generate a professional, friendly, and personalized response that:
1. Thanks the customer by name
2. Acknowledges their specific feedback
3. For 5-star reviews: Express gratitude and mention looking forward to serving them again
4. For 4-star reviews: Thank them and subtly invite feedback on how to improve
5. For 3-star or lower: Apologize for any issues, show empathy, and offer to make it right
6. Keep it concise (2-3 sentences max)
7. Sign off as "The Economy Plumbing Team"

Generate ONLY the reply text, no explanations or meta-commentary.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      });
      
      const aiReply = completion.choices[0]?.message?.content?.trim();
      
      if (!aiReply) {
        return res.status(500).json({ message: "Failed to generate AI reply" });
      }
      
      console.log(`[Review Reply] Generated AI reply for review ${reviewId}`);
      res.json({ reply: aiReply });
    } catch (error: any) {
      console.error('[Review Reply] AI generation error:', error);
      res.status(500).json({ message: "Error generating AI reply: " + error.message });
    }
  });

  // Admin: Post reply to a review
  app.post("/api/admin/reviews/:reviewId/post-reply", requireAdmin, async (req, res) => {
    try {
      const { reviewId } = req.params;
      
      // Validate request body
      const schema = z.object({
        type: z.enum(['google', 'custom']),
        replyText: z.string().min(1, "Reply text is required"),
      });
      const { replyText, type } = schema.parse(req.body);
      
      // Save reply to database and post to external platform
      let result: any;
      if (type === 'custom') {
        result = await storage.replyToReview(reviewId, replyText);
        if (!result) {
          return res.status(404).json({ message: "Review not found" });
        }
      } else {
        // Get the review to check its source and external reviewId
        const { googleReviews } = await import("@shared/schema");
        const [review] = await db
          .select()
          .from(googleReviews)
          .where(eq(googleReviews.id, reviewId))
          .limit(1);
        
        if (!review) {
          return res.status(404).json({ message: "Review not found" });
        }
        
        // Post to Google My Business if this is a Google review with reviewId
        // Note: Only 'gmb_api' reviews have valid GMB review IDs that support posting replies
        // dataforseo and places_api reviews don't have the correct GMB review ID format
        let postedToGoogle = false;
        const isGoogleReview = review.source === 'gmb_api';
        
        if (isGoogleReview && review.reviewId) {
          const { postReplyToGoogleReview } = await import("./lib/googleMyBusinessReviews");
          postedToGoogle = await postReplyToGoogleReview(review.reviewId, replyText);
          
          if (!postedToGoogle) {
            console.warn(`[Review Reply] Failed to post reply to Google for review ${reviewId}`);
          }
        }
        
        // Update database with reply
        const [updated] = await db
          .update(googleReviews)
          .set({
            replyText: replyText.trim(),
            repliedAt: new Date(),
          })
          .where(eq(googleReviews.id, reviewId))
          .returning();
        
        result = updated;
        
        // Inform user if Google posting failed
        if (isGoogleReview && review.reviewId && !postedToGoogle) {
          return res.json({ 
            success: true, 
            message: "Reply saved to database, but failed to post to Google. Please check your Google Business Profile connection.",
            postedToGoogle: false
          });
        }
      }
      
      console.log(`[Review Reply] Reply posted for review ${reviewId}`);
      res.json({ success: true, message: "Reply posted successfully", postedToGoogle: type === 'google' });
    } catch (error: any) {
      console.error('[Review Reply] Post reply error:', error);
      
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid request data" });
      }
      
      res.status(500).json({ message: "Error posting reply: " + error.message });
    }
  });

  // Manually trigger ServiceTitan customer sync (admin only)
  app.post("/api/admin/sync-servicetitan", requireAdmin, async (req, res) => {
    try {
      console.log("[Admin] Manual ServiceTitan sync triggered");
      const { syncServiceTitanCustomers } = await import("./lib/serviceTitanSync");
      
      // Trigger sync in background (don't wait)
      syncServiceTitanCustomers().catch(error => {
        console.error("[Admin] Background sync failed:", error);
      });
      
      res.json({ 
        success: true, 
        message: "ServiceTitan customer sync started in background. Check server logs for progress."
      });
    } catch (error: any) {
      console.error("[Admin] Error triggering sync:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch Google My Business reviews (runs automatically, or manually via admin)
  app.post("/api/admin/fetch-gmb-reviews", requireAdmin, async (req, res) => {
    try {
      console.log('[Admin] Manual GMB review fetch triggered');
      const { fetchAllGoogleMyBusinessReviews } = await import("./lib/googleMyBusinessReviews");
      
      const gmbReviews = await fetchAllGoogleMyBusinessReviews();
      
      if (gmbReviews.length === 0) {
        return res.json({ 
          success: true, 
          message: "No reviews fetched. Please ensure you're authenticated and have configured account/location IDs.",
          count: 0
        });
      }

      // Save GMB reviews to database (with source = 'gmb_api')
      let inserted = 0;
      for (const review of gmbReviews) {
        try {
          await db.insert(googleReviews).values({
            ...review,
            source: 'gmb_api', // Mark as GMB API source so replies work
          }).onConflictDoNothing();
          inserted++;
        } catch (err) {
          console.error('[GMB Fetch] Error inserting review:', err);
        }
      }
      
      console.log(`[Admin] GMB review fetch complete: ${inserted}/${gmbReviews.length} new reviews saved`);
      res.json({ 
        success: true, 
        message: `Successfully fetched ${gmbReviews.length} reviews from Google My Business. ${inserted} new reviews saved.`,
        total: gmbReviews.length,
        inserted
      });
    } catch (error: any) {
      console.error("[Admin] Error fetching GMB reviews:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Reprocess ALL photos with improved AI analysis (admin only)
  app.post("/api/admin/reprocess-photos", requireAdmin, async (req, res) => {
    try {
      console.log("[Admin] Starting photo reprocessing with improved AI analysis...");
      
      // Get ALL photos (CompanyCam, Google Drive, etc.)
      const photos = await db
        .select()
        .from(companyCamPhotos)
        .execute();
      
      if (photos.length === 0) {
        return res.json({ 
          success: true, 
          message: "No photos to reprocess",
          reprocessed: 0
        });
      }
      
      console.log(`[Admin] Found ${photos.length} photos to reprocess`);
      
      const objectStorageService = new ObjectStorageService();
      let reprocessed = 0;
      let errors = 0;
      
      for (const photo of photos) {
        try {
          // Download photo from URL (Object Storage, local file, or external)
          let photoBuffer: Buffer;
          
          if (photo.photoUrl.startsWith('/public-objects/') || photo.photoUrl.startsWith('/replit-objstore-')) {
            // Object Storage photo (Google Drive)
            const photoPath = photo.photoUrl.startsWith('/public-objects/') 
              ? photo.photoUrl.replace('/public-objects/', '') 
              : photo.photoUrl;
            const file = await objectStorageService.searchPublicObject(photoPath);
            
            if (!file) {
              console.error(`[Admin] Photo not found in Object Storage: ${photoPath}`);
              errors++;
              continue;
            }
            
            [photoBuffer] = await file.download();
          } else if (photo.photoUrl.startsWith('/attached_assets/')) {
            // Local file (old CompanyCam photos)
            const fs = await import('fs/promises');
            const localPath = path.join(import.meta.dirname, '..', photo.photoUrl);
            
            try {
              photoBuffer = await fs.readFile(localPath);
            } catch (err) {
              console.error(`[Admin] Failed to read local photo: ${localPath}`);
              errors++;
              continue;
            }
          } else if (photo.photoUrl.startsWith('http')) {
            // External URL photo (CompanyCam API)
            const response = await fetch(photo.photoUrl);
            if (!response.ok) {
              console.error(`[Admin] Failed to fetch photo: ${photo.photoUrl}`);
              errors++;
              continue;
            }
            photoBuffer = Buffer.from(await response.arrayBuffer());
          } else {
            console.error(`[Admin] Unknown photo URL format: ${photo.photoUrl}`);
            errors++;
            continue;
          }
          
          // Re-analyze with improved AI
          console.log(`[Admin] Re-analyzing photo ${photo.id} (${photo.source})...`);
          const analysis = await analyzeProductionPhoto(photoBuffer);
          
          // Update database with new analysis
          await db
            .update(companyCamPhotos)
            .set({
              category: analysis.category,
              isGoodQuality: analysis.isProductionQuality,
              shouldKeep: analysis.isProductionQuality,
              qualityScore: Math.round(analysis.qualityScore / 10), // Convert 0-100 to 1-10
              qualityReasoning: analysis.qualityReason,
              aiDescription: analysis.description,
              tags: analysis.tags,
              focalPointX: analysis.focalPointX,
              focalPointY: analysis.focalPointY,
              focalPointReason: analysis.focalPointReason,
              qualityAnalyzed: true,
              analyzedAt: new Date(),
            })
            .where(eq(companyCamPhotos.id, photo.id))
            .execute();
          
          // ALSO update any blog posts that reference this photo
          await db
            .update(blogPosts)
            .set({
              focalPointX: analysis.focalPointX,
              focalPointY: analysis.focalPointY,
            })
            .where(eq(blogPosts.imageId, photo.id))
            .execute();
          
          console.log(`[Admin] ✓ Reprocessed ${photo.id} - Q:${analysis.qualityScore}/100, Focal:(${analysis.focalPointX},${analysis.focalPointY})`);
          reprocessed++;
          
        } catch (error: any) {
          console.error(`[Admin] Error reprocessing photo ${photo.id}:`, error);
          errors++;
        }
      }
      
      console.log(`[Admin] Reprocessing complete: ${reprocessed} photos updated, ${errors} errors`);
      
      res.json({
        success: true,
        message: `Reprocessed ${reprocessed} photos with improved AI analysis`,
        reprocessed,
        errors,
        total: photos.length
      });
      
    } catch (error: any) {
      console.error("[Admin] Error reprocessing photos:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Find and remove similar/duplicate photos (admin only - manual trigger)
  // Note: This also runs automatically every 24 hours via automatedPhotoCleanup
  app.post("/api/admin/cleanup-similar-photos", requireAdmin, async (req, res) => {
    try {
      console.log("[Admin] Starting manual similar photo detection and cleanup...");
      
      const { executePhotoCleanup } = await import("./lib/automatedPhotoCleanup");
      const result = await executePhotoCleanup();
      
      res.json(result);
    } catch (error: any) {
      console.error("[Admin] Error in similar photo cleanup:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Tracking Numbers API (Dynamic Phone Numbers)
  
  // Get all tracking numbers (public - for frontend to fetch)
  app.get("/api/tracking-numbers", async (req, res) => {
    try {
      const trackingNumbers = await storage.getActiveTrackingNumbers();
      res.json({ trackingNumbers });
    } catch (error: any) {
      console.error("[Tracking Numbers] Error fetching active tracking numbers:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get active commercial customers for trust signal display
  app.get("/api/commercial-customers", async (req, res) => {
    try {
      const customers = await storage.getActiveCommercialCustomers();
      res.json(customers);
    } catch (error: any) {
      console.error("[Commercial Customers] Error fetching customers:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all tracking numbers including inactive (admin only)
  app.get("/api/admin/tracking-numbers", requireAdmin, async (req, res) => {
    try {
      const trackingNumbers = await storage.getAllTrackingNumbers();
      res.json({ trackingNumbers });
    } catch (error: any) {
      console.error("[Tracking Numbers] Error fetching all tracking numbers:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create new tracking number (admin only)
  app.post("/api/admin/tracking-numbers", requireAdmin, async (req, res) => {
    try {
      const { insertTrackingNumberSchema } = await import("@shared/schema");
      const data = insertTrackingNumberSchema.parse(req.body);
      
      const trackingNumber = await storage.createTrackingNumber(data);
      
      // Invalidate SSR cache (tracking numbers changed)
      if (global.invalidateSSRCache) global.invalidateSSRCache();
      
      res.json({ trackingNumber });
    } catch (error: any) {
      console.error("[Tracking Numbers] Error creating tracking number:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update tracking number (admin only)
  app.put("/api/admin/tracking-numbers/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { insertTrackingNumberSchema } = await import("@shared/schema");
      const updates = insertTrackingNumberSchema.partial().parse(req.body);
      
      const trackingNumber = await storage.updateTrackingNumber(id, updates);
      
      // Invalidate SSR cache (tracking numbers changed)
      if (global.invalidateSSRCache) global.invalidateSSRCache();
      
      res.json({ trackingNumber });
    } catch (error: any) {
      console.error("[Tracking Numbers] Error updating tracking number:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete tracking number (admin only)
  app.delete("/api/admin/tracking-numbers/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTrackingNumber(id);
      
      // Invalidate SSR cache (tracking numbers changed)
      if (global.invalidateSSRCache) global.invalidateSSRCache();
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Tracking Numbers] Error deleting tracking number:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Seed tracking numbers from hardcoded values (admin only - run once)
  app.post("/api/admin/tracking-numbers/seed", requireAdmin, async (req, res) => {
    try {
      const existingNumbers = await storage.getAllTrackingNumbers();
      
      if (existingNumbers.length > 0) {
        return res.json({
          success: false,
          message: "Tracking numbers already exist. Delete them first if you want to reseed.",
          count: existingNumbers.length
        });
      }

      const seedData = [
        {
          channelKey: 'default',
          channelName: 'Default/Organic',
          displayNumber: '(512) 368-9159',
          rawNumber: '5123689159',
          telLink: 'tel:+15123689159',
          detectionRules: JSON.stringify({
            isDefault: true,
            patterns: []
          }),
          isActive: true,
          isDefault: true,
          sortOrder: 0
        },
        {
          channelKey: 'google',
          channelName: 'Google Ads',
          displayNumber: '(512) 368-9159',
          rawNumber: '5123689159',
          telLink: 'tel:+15123689159',
          detectionRules: JSON.stringify({
            urlParams: ['gclid'],
            utmSources: ['google'],
            referrerIncludes: ['google.com']
          }),
          isActive: true,
          isDefault: false,
          sortOrder: 1
        },
        {
          channelKey: 'facebook',
          channelName: 'Facebook/Instagram Ads',
          displayNumber: '(512) 575-3157',
          rawNumber: '5125753157',
          telLink: 'tel:+15125753157',
          detectionRules: JSON.stringify({
            urlParams: ['fbclid'],
            utmSources: ['facebook', 'instagram', 'fb', 'ig'],
            referrerIncludes: ['facebook.com', 'instagram.com']
          }),
          isActive: true,
          isDefault: false,
          sortOrder: 2
        },
        {
          channelKey: 'yelp',
          channelName: 'Yelp',
          displayNumber: '(512) 893-7316',
          rawNumber: '5128937316',
          telLink: 'tel:+15128937316',
          detectionRules: JSON.stringify({
            utmSources: ['yelp'],
            referrerIncludes: ['yelp.com']
          }),
          isActive: true,
          isDefault: false,
          sortOrder: 3
        },
        {
          channelKey: 'nextdoor',
          channelName: 'Nextdoor',
          displayNumber: '(512) 846-9146',
          rawNumber: '5128469146',
          telLink: 'tel:+15128469146',
          detectionRules: JSON.stringify({
            utmSources: ['nextdoor'],
            referrerIncludes: ['nextdoor.com']
          }),
          isActive: true,
          isDefault: false,
          sortOrder: 4
        }
      ];

      const created = [];
      for (const data of seedData) {
        const trackingNumber = await storage.createTrackingNumber(data);
        created.push(trackingNumber);
      }

      res.json({
        success: true,
        message: `Successfully seeded ${created.length} tracking numbers`,
        trackingNumbers: created
      });
    } catch (error: any) {
      console.error("[Tracking Numbers] Error seeding tracking numbers:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Review Request & Referral Nurture System Routes

  // Shared helper function for campaign phone number updates
  async function upsertCampaignPhoneNumber(
    campaignKey: string,
    campaignName: string,
    phoneNumber: string,
    utmConfig: { utm_source: string; utm_medium: string; utm_campaign: string; description: string },
    sortOrder: number
  ) {
    // Format and validate phone number
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      throw new Error("Phone number must be 10 digits");
    }

    const formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    const telLink = `tel:+1${cleaned}`;

    // Check if tracking number already exists
    const existingNumbers = await storage.getAllTrackingNumbers();
    const existingNumber = existingNumbers.find(n => n.channelKey === `${campaignKey}_email`);

    if (existingNumber) {
      // Update existing tracking number
      await storage.updateTrackingNumber(existingNumber.id, {
        displayNumber: formatted,
        rawNumber: cleaned,
        telLink: telLink
      });
    } else {
      // Create new tracking number with UTM parameters
      await storage.createTrackingNumber({
        channelKey: `${campaignKey}_email`,
        channelName: campaignName,
        displayNumber: formatted,
        rawNumber: cleaned,
        telLink: telLink,
        detectionRules: JSON.stringify(utmConfig),
        isActive: true,
        isDefault: false,
        sortOrder
      });
    }

    // Save phone number to system settings
    const { systemSettings } = await import("@shared/schema");
    await db
      .insert(systemSettings)
      .values({
        key: `${campaignKey}_phone_number`,
        value: cleaned,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: cleaned,
          updatedAt: new Date()
        }
      });

    await db
      .insert(systemSettings)
      .values({
        key: `${campaignKey}_phone_formatted`,
        value: formatted,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: formatted,
          updatedAt: new Date()
        }
      });

    // Invalidate SSR cache
    if (global.invalidateSSRCache) global.invalidateSSRCache();

    return { cleaned, formatted };
  }

  // Get system settings (admin only) - now returns ALL campaign phone numbers
  app.get("/api/admin/review-requests/settings", requireAdmin, async (req, res) => {
    try {
      const { systemSettings } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const dbSettings = await db.select().from(systemSettings);
      const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

      const settings = {
        masterEmailSwitch: settingsMap.get('review_master_email_switch') === 'true',
        reviewDripEnabled: settingsMap.get('review_drip_enabled') === 'true',
        referralDripEnabled: settingsMap.get('referral_drip_enabled') === 'true',
        autoSendReviewRequests: settingsMap.get('auto_send_review_requests') === 'true',
        autoStartReferralCampaigns: settingsMap.get('auto_start_referral_campaigns') === 'true',
        // Review Request campaign phone
        reviewRequestPhoneNumber: settingsMap.get('review_request_phone_number') || '',
        reviewRequestPhoneFormatted: settingsMap.get('review_request_phone_formatted') || '',
        // Referral Nurture campaign phone
        referralNurturePhoneNumber: settingsMap.get('referral_nurture_phone_number') || '',
        referralNurturePhoneFormatted: settingsMap.get('referral_nurture_phone_formatted') || '',
        // Quote Follow-up campaign phone
        quoteFollowupPhoneNumber: settingsMap.get('quote_followup_phone_number') || '',
        quoteFollowupPhoneFormatted: settingsMap.get('quote_followup_phone_formatted') || ''
      };
      
      res.json(settings);
    } catch (error: any) {
      console.error("[Review Requests] Error fetching settings:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update system settings (admin only)
  app.put("/api/admin/review-requests/settings", requireAdmin, async (req, res) => {
    try {
      const { systemSettings } = await import("@shared/schema");
      const updates = req.body;

      // SERVER-SIDE VALIDATION: Prevent enabling master switch without phone number
      if (updates.masterEmailSwitch === true) {
        // Check if phone number is configured
        const dbSettings = await db.select().from(systemSettings);
        const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));
        const phoneNumber = settingsMap.get('review_request_phone_number');
        
        if (!phoneNumber) {
          return res.status(400).json({
            error: "Cannot enable master email switch without a configured phone number. Please set a phone number first."
          });
        }
      }

      // Save each setting to database
      for (const [key, value] of Object.entries(updates)) {
        // Convert camelCase to snake_case
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        await db
          .insert(systemSettings)
          .values({
            key: dbKey,
            value: String(value),
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: systemSettings.key,
            set: {
              value: String(value),
              updatedAt: new Date()
            }
          });
      }
      
      console.log("[Review Requests] Settings updated:", updates);
      res.json({ success: true, settings: updates });
    } catch (error: any) {
      console.error("[Review Requests] Error updating settings:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update phone number - auto-creates tracking number with UTM params (admin only)
  app.post("/api/admin/review-requests/phone", requireAdmin, async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const { cleaned, formatted } = await upsertCampaignPhoneNumber(
        'review_request',
        'Review Request Emails',
        phoneNumber,
        {
          utm_source: 'review_request',
          utm_medium: 'email',
          utm_campaign: 'review_drip',
          description: 'Automatically created for review request email campaigns'
        },
        100
      );

      res.json({
        success: true,
        phoneNumber: cleaned,
        phoneFormatted: formatted,
        message: "Phone number updated and tracking number created with UTM parameters"
      });
    } catch (error: any) {
      console.error("[Review Requests] Error updating phone number:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Referral Nurture campaign phone number
  app.post("/api/admin/referral-nurture/phone", requireAdmin, async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const { cleaned, formatted } = await upsertCampaignPhoneNumber(
        'referral_nurture',
        'Referral Nurture Emails',
        phoneNumber,
        {
          utm_source: 'referral_nurture',
          utm_medium: 'email',
          utm_campaign: 'referral_drip',
          description: 'Automatically created for referral nurture email campaigns'
        },
        101
      );

      res.json({
        success: true,
        phoneNumber: cleaned,
        phoneFormatted: formatted,
        message: "Phone number updated and tracking number created with UTM parameters"
      });
    } catch (error: any) {
      console.error("[Referral Nurture] Error updating phone number:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Quote Follow-up campaign phone number
  app.post("/api/admin/quote-followup/phone", requireAdmin, async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const { cleaned, formatted } = await upsertCampaignPhoneNumber(
        'quote_followup',
        'Quote Follow-up Emails',
        phoneNumber,
        {
          utm_source: 'quote_followup',
          utm_medium: 'email',
          utm_campaign: 'quote_followup_drip',
          description: 'Automatically created for quote follow-up email campaigns'
        },
        102
      );

      res.json({
        success: true,
        phoneNumber: cleaned,
        phoneFormatted: formatted,
        message: "Phone number updated and tracking number created with UTM parameters"
      });
    } catch (error: any) {
      console.error("[Quote Follow-up] Error updating phone number:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get dashboard statistics (admin only)
  app.get("/api/admin/review-requests/stats", requireAdmin, async (req, res) => {
    try {
      // Mock stats for now - will be replaced with real database queries
      const stats = {
        reviewRequests: {
          total: 0,
          active: 0,
          completed: 0,
          reviewsSubmitted: 0,
          averageRating: 0,
          openRate: 0,
          clickRate: 0
        },
        referralNurture: {
          total: 0,
          active: 0,
          paused: 0,
          completed: 0,
          totalReferrals: 0,
          averageEngagement: 0
        }
      };

      res.json(stats);
    } catch (error: any) {
      console.error("[Review Requests] Error fetching stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get active review campaigns (admin only)
  app.get("/api/admin/review-requests/active", requireAdmin, async (req, res) => {
    try {
      // Mock data for now - will be replaced with real database queries
      const campaigns: any[] = [];
      
      res.json(campaigns);
    } catch (error: any) {
      console.error("[Review Requests] Error fetching active campaigns:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // REFERRAL TRACKING ADMIN ROUTES
  
  // Get all referrals with comprehensive stats (admin only)
  app.get("/api/admin/referrals", requireAdmin, async (req, res) => {
    try {
      const { referrals: referralsTable, customersXlsx } = await import("@shared/schema");
      
      // Get all referrals with customer details
      const allReferrals = await db
        .select({
          id: referralsTable.id,
          referrerCustomerId: referralsTable.referrerCustomerId,
          referralCode: referralsTable.referralCode,
          refereeName: referralsTable.refereeName,
          refereePhone: referralsTable.refereePhone,
          refereeEmail: referralsTable.refereeEmail,
          refereeCustomerId: referralsTable.refereeCustomerId,
          status: referralsTable.status,
          firstJobId: referralsTable.firstJobId,
          firstJobAmount: referralsTable.firstJobAmount,
          firstJobDate: referralsTable.firstJobDate,
          creditAmount: referralsTable.creditAmount,
          creditedAt: referralsTable.creditedAt,
          creditedBy: referralsTable.creditedBy,
          creditNotes: referralsTable.creditNotes,
          submittedAt: referralsTable.submittedAt,
          contactedAt: referralsTable.contactedAt,
          referrerName: customersXlsx.name,
          referrerEmail: customersXlsx.email
        })
        .from(referralsTable)
        .leftJoin(customersXlsx, eq(referralsTable.referrerCustomerId, customersXlsx.id))
        .orderBy(desc(referralsTable.submittedAt));

      // Calculate stats
      const stats = {
        total: allReferrals.length,
        pending: allReferrals.filter(r => r.status === 'pending').length,
        contacted: allReferrals.filter(r => r.status === 'contacted').length,
        completed: allReferrals.filter(r => r.status === 'job_completed').length,
        credited: allReferrals.filter(r => r.status === 'credited').length,
        ineligible: allReferrals.filter(r => r.status === 'ineligible').length,
        totalRevenue: allReferrals
          .filter(r => r.firstJobAmount)
          .reduce((sum, r) => sum + (r.firstJobAmount || 0), 0),
        totalCredits: allReferrals
          .filter(r => r.creditAmount && r.status === 'credited')
          .reduce((sum, r) => sum + (r.creditAmount || 0), 0)
      };

      res.json({
        referrals: allReferrals,
        stats
      });
    } catch (error: any) {
      console.error("[Referrals] Error fetching referrals:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Manual credit referral (admin only)
  app.post("/api/admin/referrals/:id/credit", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, notes } = req.body;
      const { referrals: referralsTable } = await import("@shared/schema");

      // Update referral status
      await db
        .update(referralsTable)
        .set({
          status: 'credited',
          creditAmount: amount || 2500, // Default $25
          creditedAt: new Date(),
          creditedBy: 'manual_admin',
          creditNotes: notes || 'Manually credited by admin'
        })
        .where(eq(referralsTable.id, id));

      console.log(`[Referrals] Manually credited referral ${id} for $${((amount || 2500) / 100).toFixed(2)}`);
      res.json({ success: true, message: 'Referral credited successfully' });
    } catch (error: any) {
      console.error("[Referrals] Error crediting referral:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark referral as ineligible (admin only)
  app.post("/api/admin/referrals/:id/ineligible", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const { referrals: referralsTable } = await import("@shared/schema");

      await db
        .update(referralsTable)
        .set({
          status: 'ineligible',
          creditNotes: reason || 'Marked ineligible by admin'
        })
        .where(eq(referralsTable.id, id));

      console.log(`[Referrals] Marked referral ${id} as ineligible: ${reason}`);
      res.json({ success: true, message: 'Referral marked as ineligible' });
    } catch (error: any) {
      console.error("[Referrals] Error marking referral ineligible:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get active referral nurture campaigns (admin only)
  app.get("/api/admin/review-requests/referrals", requireAdmin, async (req, res) => {
    try {
      // Mock data for now - will be replaced with real database queries
      const campaigns: any[] = [];
      
      res.json(campaigns);
    } catch (error: any) {
      console.error("[Review Requests] Error fetching referral campaigns:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI EMAIL GENERATOR ROUTES
  
  // Generate AI email (admin only)
  app.post("/api/admin/emails/generate", requireAdmin, async (req, res) => {
    try {
      const { generateEmail } = await import("./lib/aiEmailGenerator");
      const { campaignType, emailNumber, jobDetails, phoneNumber, referralLink, strategy } = req.body;

      // Validate required fields
      if (!campaignType || !emailNumber || !jobDetails) {
        return res.status(400).json({
          error: "Missing required fields: campaignType, emailNumber, jobDetails"
        });
      }

      // Validate campaign type
      if (!['review_request', 'referral_nurture', 'quote_followup'].includes(campaignType)) {
        return res.status(400).json({
          error: "Invalid campaignType. Must be 'review_request', 'referral_nurture', or 'quote_followup'"
        });
      }

      // Validate email number
      if (![1, 2, 3, 4].includes(emailNumber)) {
        return res.status(400).json({
          error: "Invalid emailNumber. Must be 1, 2, 3, or 4"
        });
      }

      console.log(`[AI Email Generator] Generating ${campaignType} email #${emailNumber}...`);
      
      const generatedEmail = await generateEmail({
        campaignType,
        emailNumber,
        jobDetails,
        phoneNumber,
        referralLink, // Optional: Only needed for referral nurture emails
        strategy
      });

      console.log(`[AI Email Generator] Successfully generated email: "${generatedEmail.subject}"`);
      
      // Map field names: AI returns bodyHtml/bodyPlain, frontend expects htmlContent/plainTextContent
      res.json({
        subject: generatedEmail.subject,
        preheader: generatedEmail.preheader,
        htmlContent: generatedEmail.bodyHtml,
        plainTextContent: generatedEmail.bodyPlain,
        strategy: generatedEmail.strategy,
        seasonalContext: generatedEmail.seasonalContext
      });
    } catch (error: any) {
      console.error("[AI Email Generator] Error:", error);
      res.status(500).json({ error: error.message || 'Failed to generate email' });
    }
  });

  // Save AI-generated email as template (admin only)
  app.post("/api/admin/emails/save-template", requireAdmin, async (req, res) => {
    try {
      const { reviewEmailTemplates } = await import("@shared/schema");
      const {
        campaignType,
        emailNumber,
        subject,
        htmlContent,
        plainTextContent,
        isActive
      } = req.body;

      // Validate required fields
      if (!campaignType || !emailNumber || !subject || !htmlContent || !plainTextContent) {
        return res.status(400).json({
          error: "Missing required fields: campaignType, emailNumber, subject, htmlContent, plainTextContent"
        });
      }

      // Check if template already exists for this campaign/email combination
      const existing = await db
        .select()
        .from(reviewEmailTemplates)
        .where(
          and(
            eq(reviewEmailTemplates.campaignType, campaignType),
            eq(reviewEmailTemplates.emailNumber, emailNumber)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing template
        const updated = await db
          .update(reviewEmailTemplates)
          .set({
            subject,
            htmlContent,
            plainTextContent,
            customized: true,
            lastEditedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(reviewEmailTemplates.id, existing[0].id))
          .returning();

        console.log(`[AI Email Generator] Updated template for ${campaignType} email #${emailNumber}`);
        res.json({ template: updated[0], updated: true });
      } else {
        // Create new template
        const newTemplate = await db
          .insert(reviewEmailTemplates)
          .values({
            campaignType,
            emailNumber,
            subject,
            htmlContent,
            plainTextContent,
            aiGenerated: true
          })
          .returning();

        console.log(`[AI Email Generator] Created new template for ${campaignType} email #${emailNumber}`);
        res.json({ template: newTemplate[0], updated: false });
      }
    } catch (error: any) {
      console.error("[AI Email Generator] Error saving template:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all email templates (admin only)
  app.get("/api/admin/emails/templates", requireAdmin, async (req, res) => {
    try {
      const { reviewEmailTemplates } = await import("@shared/schema");
      
      const templates = await db
        .select()
        .from(reviewEmailTemplates)
        .orderBy(reviewEmailTemplates.campaignType, reviewEmailTemplates.emailNumber);

      res.json({ templates });
    } catch (error: any) {
      console.error("[AI Email Generator] Error fetching templates:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific email template (admin only)
  app.get("/api/admin/emails/templates/:campaignType/:emailNumber", requireAdmin, async (req, res) => {
    try {
      const { campaignType, emailNumber } = req.params;
      const { reviewEmailTemplates } = await import("@shared/schema");
      
      const template = await db
        .select()
        .from(reviewEmailTemplates)
        .where(
          and(
            eq(reviewEmailTemplates.campaignType, campaignType),
            eq(reviewEmailTemplates.emailNumber, parseInt(emailNumber))
          )
        )
        .limit(1);

      if (template.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json({ template: template[0] });
    } catch (error: any) {
      console.error("[AI Email Generator] Error fetching template:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Commercial Customers Admin Routes
  
  // Get all commercial customers (admin only)
  app.get("/api/admin/commercial-customers", requireAdmin, async (req, res) => {
    try {
      const customers = await storage.getAllCommercialCustomers();
      res.json({ customers });
    } catch (error: any) {
      console.error("[Commercial Customers] Error fetching all customers:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create commercial customer (admin only)
  app.post("/api/admin/commercial-customers", requireAdmin, async (req, res) => {
    try {
      const { insertCommercialCustomerSchema } = await import("@shared/schema");
      const data = insertCommercialCustomerSchema.parse(req.body);
      
      const customer = await storage.createCommercialCustomer(data);
      res.json({ customer });
    } catch (error: any) {
      console.error("[Commercial Customers] Error creating customer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update commercial customer (admin only)
  app.put("/api/admin/commercial-customers/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { insertCommercialCustomerSchema } = await import("@shared/schema");
      const updates = insertCommercialCustomerSchema.partial().parse(req.body);
      
      const customer = await storage.updateCommercialCustomer(id, updates);
      res.json({ customer });
    } catch (error: any) {
      console.error("[Commercial Customers] Error updating customer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete commercial customer (admin only)
  app.delete("/api/admin/commercial-customers/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCommercialCustomer(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Commercial Customers] Error deleting customer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload logo to object storage (admin only)
  app.post("/api/admin/upload-logo", requireAdmin, uploadMiddleware.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const objectStorageService = new ObjectStorageService();
      
      // Get the public search paths to determine the bucket
      const searchPaths = objectStorageService.getPublicObjectSearchPaths();
      if (searchPaths.length === 0) {
        return res.status(500).json({ error: "Object storage not configured" });
      }

      // Use the first public search path as the base
      const basePath = searchPaths[0];
      const fileName = `logos/${Date.now()}-${req.file.originalname}`;
      const destinationPath = `${basePath}/${fileName}`;

      // Upload the buffer directly
      const uploadedPath = await objectStorageService.uploadBuffer(
        req.file.buffer,
        destinationPath,
        req.file.mimetype
      );

      // Return the path that can be served by our endpoints
      res.json({ logoUrl: uploadedPath });
    } catch (error: any) {
      console.error("[Logo Upload] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Process logo to white monochrome version (admin only)
  app.post("/api/admin/process-logo", requireAdmin, async (req, res) => {
    try {
      const { logoUrl, customerName } = req.body;

      if (!logoUrl) {
        return res.status(400).json({ error: "Logo URL is required" });
      }

      if (!customerName) {
        return res.status(400).json({ error: "Customer name is required" });
      }

      // Process logo to white monochrome version
      const { processLogoToWhiteMonochrome } = await import("./lib/logoProcessor");
      const processedLogoUrl = await processLogoToWhiteMonochrome(logoUrl, customerName);
      
      res.json({ processedLogoUrl });
    } catch (error: any) {
      console.error("[Logo Processing] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Page Metadata Admin Routes
  
  // Get all page metadata (admin only)
  app.get("/api/admin/page-metadata", requireAdmin, async (req, res) => {
    try {
      const metadata = await storage.getAllPageMetadata();
      res.json({ metadata });
    } catch (error: any) {
      console.error("[Page Metadata] Error fetching all metadata:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get page metadata by path (public - for SEOHead component)
  app.get("/api/page-metadata/:path(*)", async (req, res) => {
    try {
      const path = `/${req.params.path}`; // Add leading slash
      const metadata = await storage.getPageMetadataByPath(path);
      
      if (!metadata) {
        return res.status(404).json({ error: "Metadata not found" });
      }
      
      res.set('Cache-Control', 'public, max-age=3600, must-revalidate'); // Cache for 1 hour
      res.json({ metadata });
    } catch (error: any) {
      console.error("[Page Metadata] Error fetching metadata:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create or update page metadata (admin only)
  app.post("/api/admin/page-metadata", requireAdmin, async (req, res) => {
    try {
      const { insertPageMetadataSchema } = await import("@shared/schema");
      const data = insertPageMetadataSchema.parse(req.body);
      
      // Validate description length (SEO best practice: 120-160 characters)
      if (data.description && data.description.length > 0) {
        if (data.description.length < 120) {
          return res.status(400).json({ 
            error: "Meta description must be at least 120 characters for optimal SEO" 
          });
        }
        
        if (data.description.length > 160) {
          return res.status(400).json({ 
            error: "Meta description must not exceed 160 characters to avoid truncation in search results" 
          });
        }
      }
      
      const metadata = await storage.upsertPageMetadata(data);
      
      // Invalidate SSR cache (page metadata changed)
      if (global.invalidateSSRCache) global.invalidateSSRCache();
      
      res.json({ metadata });
    } catch (error: any) {
      console.error("[Page Metadata] Error upserting metadata:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete page metadata (admin only)
  app.delete("/api/admin/page-metadata/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePageMetadata(id);
      
      // Invalidate SSR cache (page metadata changed)
      if (global.invalidateSSRCache) global.invalidateSSRCache();
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Page Metadata] Error deleting metadata:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get approved customer success stories (public)
  app.get("/api/customer-success-stories", async (req, res) => {
    try {
      const stories = await storage.getApprovedSuccessStories();
      res.set('Cache-Control', 'public, max-age=300, must-revalidate'); // Cache for 5 minutes
      res.json({ stories });
    } catch (error: any) {
      console.error("[Success Stories] Error fetching approved stories:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve private object storage files (admin only)
  app.get("/replit-objstore-:bucketId/.private/:filePath(*)", requireAdmin, async (req, res) => {
    const { bucketId, filePath } = req.params;
    const fullPath = `/replit-objstore-${bucketId}/.private/${filePath}`;
    
    const objectStorageService = new ObjectStorageService();
    try {
      const buffer = await objectStorageService.downloadBuffer(fullPath);
      if (!buffer) {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Determine content type from file extension
      const ext = filePath.split('.').pop()?.toLowerCase();
      const contentType = ext === 'webp' ? 'image/webp' 
        : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
        : ext === 'png' ? 'image/png'
        : 'application/octet-stream';
      
      res.set('Content-Type', contentType);
      res.send(buffer);
    } catch (error) {
      console.error("Error serving private object storage file:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all success stories (admin only)
  app.get("/api/admin/success-stories", requireAdmin, async (req, res) => {
    try {
      const stories = await storage.getAllSuccessStories();
      res.json({ stories });
    } catch (error: any) {
      console.error("[Success Stories] Error fetching stories:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Approve success story (admin only)
  app.put("/api/admin/success-stories/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the story first to access the before/after photos
      const stories = await storage.getAllSuccessStories();
      const storyToApprove = stories.find(s => s.id === id);
      
      if (!storyToApprove) {
        return res.status(404).json({ error: "Success story not found" });
      }
      
      console.log(`[Success Stories] Generating collage for story ${id}...`);
      console.log(`[Success Stories] Before photo: ${storyToApprove.beforePhotoUrl}`);
      console.log(`[Success Stories] After photo: ${storyToApprove.afterPhotoUrl}`);
      
      // Instead of creating in attached_assets, save to object storage public directory
      const { ObjectStorageService } = await import("./objectStorage");
      const { createBeforeAfterComposite } = await import("./lib/beforeAfterComposer");
      const path = await import("path");
      const fs = await import("fs/promises");
      const os = await import("os");
      
      const objectStorageService = new ObjectStorageService();
      const publicSearchPaths = objectStorageService.getPublicObjectSearchPaths();
      const publicPath = publicSearchPaths[0]; // e.g., "/replit-objstore-xxx/public"
      
      // Create collage in temp directory first
      const tmpDir = os.tmpdir();
      const webpFilename = `success_story_${id}_${Date.now()}.webp`;
      const jpegFilename = webpFilename.replace('.webp', '.jpg');
      const tmpWebpPath = path.join(tmpDir, webpFilename);
      const tmpJpegPath = path.join(tmpDir, jpegFilename);
      
      console.log(`[Success Stories] Creating composite in temp: ${tmpWebpPath}`);
      
      // Create the collage (creates both WebP and JPEG versions)
      await createBeforeAfterComposite(
        storyToApprove.beforePhotoUrl,
        storyToApprove.afterPhotoUrl,
        tmpWebpPath
      );
      
      console.log(`[Success Stories] Composites created, uploading to object storage...`);
      
      // Upload both WebP and JPEG to object storage public directory
      const webpObjectPath = `${publicPath}/success_stories/${webpFilename}`;
      const jpegObjectPath = `${publicPath}/success_stories/${jpegFilename}`;
      
      await objectStorageService.uploadFile(tmpWebpPath, webpObjectPath, 'image/webp');
      await objectStorageService.uploadFile(tmpJpegPath, jpegObjectPath, 'image/jpeg');
      
      // Clean up temp files
      await fs.unlink(tmpWebpPath).catch(() => {});
      await fs.unlink(tmpJpegPath).catch(() => {});
      
      // Construct public URLs
      const collageUrl = webpObjectPath;
      const jpegCollageUrl = jpegObjectPath;
      console.log(`[Success Stories] ✅ Collages uploaded - WebP: ${collageUrl}, JPEG: ${jpegCollageUrl}`);
      
      // Approve with both collage URLs
      const story = await storage.approveSuccessStory(id, collageUrl, jpegCollageUrl);
      
      // Invalidate SSR cache (success story published)
      if (global.invalidateSSRCache) global.invalidateSSRCache();
      
      res.json({ story });
    } catch (error: any) {
      console.error("[Success Stories] Error approving story:", error);
      console.error("[Success Stories] Error stack:", error.stack);
      res.status(500).json({ error: error.message });
    }
  });

  // Unapprove success story (admin only) - move back to pending queue
  app.put("/api/admin/success-stories/:id/unapprove", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`[Success Stories] Unapproving story ${id}...`);
      
      // Unapprove the story (set approved=false and clear collage)
      const story = await storage.unapproveSuccessStory(id);
      
      console.log(`[Success Stories] ✅ Story unapproved and moved to pending queue`);
      
      // Invalidate SSR cache (success story removed)
      if (global.invalidateSSRCache) global.invalidateSSRCache();
      
      res.json({ story });
    } catch (error: any) {
      console.error("[Success Stories] Error unapproving story:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete/reject success story (admin only)
  app.delete("/api/admin/success-stories/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSuccessStory(id);
      
      // Invalidate SSR cache (success story deleted)
      if (global.invalidateSSRCache) global.invalidateSSRCache();
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Success Stories] Error deleting story:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update success story (admin only) - Edit customer name, story, location
  app.put("/api/admin/success-stories/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { customerName, story, location } = req.body;

      // Validate inputs
      if (!customerName?.trim()) {
        return res.status(400).json({ error: "Customer name is required" });
      }
      if (!story?.trim()) {
        return res.status(400).json({ error: "Story is required" });
      }
      if (!location?.trim()) {
        return res.status(400).json({ error: "Location is required" });
      }

      console.log(`[Success Stories] Updating story ${id}...`);

      const updatedStory = await storage.updateSuccessStory(id, {
        customerName: customerName.trim(),
        story: story.trim(),
        location: location.trim(),
      });

      console.log(`[Success Stories] ✅ Story updated successfully`);
      
      // Invalidate SSR cache (success story updated)
      if (global.invalidateSSRCache) global.invalidateSSRCache();

      res.json({ story: updatedStory });
    } catch (error: any) {
      console.error("[Success Stories] Error updating story:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Swap before/after photos (admin only)
  app.put("/api/admin/success-stories/:id/swap-photos", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      console.log(`[Success Stories] Swapping before/after photos for story ${id}...`);

      // Get the story first
      const stories = await storage.getAllSuccessStories();
      const storyData = stories.find(s => s.id === id);
      
      if (!storyData) {
        return res.status(404).json({ error: "Success story not found" });
      }

      // Swap the photo URLs and focal points
      const updatedStory = await storage.updateSuccessStory(id, {
        beforePhotoUrl: storyData.afterPhotoUrl,
        afterPhotoUrl: storyData.beforePhotoUrl,
        beforeFocalX: storyData.afterFocalX,
        beforeFocalY: storyData.afterFocalY,
        afterFocalX: storyData.beforeFocalX,
        afterFocalY: storyData.beforeFocalY,
      });

      // Regenerate collage with swapped photos if story is approved
      if (storyData.approved && storyData.beforePhotoUrl && storyData.afterPhotoUrl) {
        console.log(`[Success Stories] Regenerating collage with swapped photos...`);
        
        const { ObjectStorageService } = await import("./objectStorage");
        const { createBeforeAfterComposite } = await import("./lib/beforeAfterComposer");
        const path = await import("path");
        const fs = await import("fs/promises");
        const os = await import("os");
        
        const objectStorageService = new ObjectStorageService();
        const publicSearchPaths = objectStorageService.getPublicObjectSearchPaths();
        const publicPath = publicSearchPaths[0];
        
        // Create collage in temp directory
        const tmpDir = os.tmpdir();
        const webpFilename = `success_story_${id}_${Date.now()}.webp`;
        const jpegFilename = webpFilename.replace('.webp', '.jpg');
        const tmpWebpPath = path.join(tmpDir, webpFilename);
        const tmpJpegPath = path.join(tmpDir, jpegFilename);
        
        // Create manual focal points object if they exist (already swapped in updatedStory)
        const manualFocalPoints: any = {};
        if (updatedStory.beforeFocalX !== null && updatedStory.beforeFocalY !== null) {
          manualFocalPoints.before = { x: updatedStory.beforeFocalX, y: updatedStory.beforeFocalY };
        }
        if (updatedStory.afterFocalX !== null && updatedStory.afterFocalY !== null) {
          manualFocalPoints.after = { x: updatedStory.afterFocalX, y: updatedStory.afterFocalY };
        }
        
        // Create the collage with swapped photos
        await createBeforeAfterComposite(
          updatedStory.beforePhotoUrl,
          updatedStory.afterPhotoUrl,
          tmpWebpPath,
          Object.keys(manualFocalPoints).length > 0 ? manualFocalPoints : undefined
        );
        
        // Upload both WebP and JPEG to object storage
        const webpObjectPath = `${publicPath}/success_stories/${webpFilename}`;
        const jpegObjectPath = `${publicPath}/success_stories/${jpegFilename}`;
        
        await objectStorageService.uploadFile(tmpWebpPath, webpObjectPath, 'image/webp');
        await objectStorageService.uploadFile(tmpJpegPath, jpegObjectPath, 'image/jpeg');
        
        // Clean up temp files
        await fs.unlink(tmpWebpPath).catch(() => {});
        await fs.unlink(tmpJpegPath).catch(() => {});
        
        // Update the success story with new collage URLs
        await storage.updateSuccessStory(id, {
          collagePhotoUrl: webpObjectPath,
          jpegCollagePhotoUrl: jpegObjectPath
        });
        
        console.log(`[Success Stories] ✅ Collage regenerated with swapped photos`);
      }

      res.json({ story: updatedStory });
    } catch (error: any) {
      console.error("[Success Stories] Error swapping photos:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update focal points and regenerate collage (admin only)
  app.put("/api/admin/success-stories/:id/focal-points", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { beforeFocalX, beforeFocalY, afterFocalX, afterFocalY } = req.body;

      console.log(`[Success Stories] Updating focal points for story ${id}...`, { beforeFocalX, beforeFocalY, afterFocalX, afterFocalY });

      // Get the story first
      const stories = await storage.getAllSuccessStories();
      const storyData = stories.find(s => s.id === id);
      
      if (!storyData) {
        return res.status(404).json({ error: "Success story not found" });
      }

      // Validate and round focal points to integers
      const roundFocal = (val: any) => val !== undefined && val !== null ? Math.round(Number(val)) : null;

      // Save focal points to database (rounded to integers)
      const updatedStory = await storage.updateSuccessStory(id, {
        beforeFocalX: roundFocal(beforeFocalX),
        beforeFocalY: roundFocal(beforeFocalY),
        afterFocalX: roundFocal(afterFocalX),
        afterFocalY: roundFocal(afterFocalY),
      });

      // Regenerate collage with new focal points if story is approved
      if (storyData.approved && storyData.beforePhotoUrl && storyData.afterPhotoUrl) {
        console.log(`[Success Stories] Regenerating collage with new focal points...`);
        
        const { ObjectStorageService } = await import("./objectStorage");
        const { createBeforeAfterComposite } = await import("./lib/beforeAfterComposer");
        const path = await import("path");
        const fs = await import("fs/promises");
        const os = await import("os");
        
        const objectStorageService = new ObjectStorageService();
        const publicSearchPaths = objectStorageService.getPublicObjectSearchPaths();
        const publicPath = publicSearchPaths[0];
        
        // Create collage in temp directory
        const tmpDir = os.tmpdir();
        const webpFilename = `success_story_${id}_${Date.now()}.webp`;
        const jpegFilename = webpFilename.replace('.webp', '.jpg');
        const tmpWebpPath = path.join(tmpDir, webpFilename);
        const tmpJpegPath = path.join(tmpDir, jpegFilename);
        
        // Create manual focal points object (only if set)
        const manualFocalPoints: any = {};
        if (beforeFocalX !== undefined && beforeFocalY !== undefined) {
          manualFocalPoints.before = { x: beforeFocalX, y: beforeFocalY };
        }
        if (afterFocalX !== undefined && afterFocalY !== undefined) {
          manualFocalPoints.after = { x: afterFocalX, y: afterFocalY };
        }
        
        // Create the collage with manual focal points
        await createBeforeAfterComposite(
          storyData.beforePhotoUrl,
          storyData.afterPhotoUrl,
          tmpWebpPath,
          Object.keys(manualFocalPoints).length > 0 ? manualFocalPoints : undefined
        );
        
        // Upload both WebP and JPEG to object storage
        const webpObjectPath = `${publicPath}/success_stories/${webpFilename}`;
        const jpegObjectPath = `${publicPath}/success_stories/${jpegFilename}`;
        
        await objectStorageService.uploadFile(tmpWebpPath, webpObjectPath, 'image/webp');
        await objectStorageService.uploadFile(tmpJpegPath, jpegObjectPath, 'image/jpeg');
        
        // Clean up temp files
        await fs.unlink(tmpWebpPath).catch(() => {});
        await fs.unlink(tmpJpegPath).catch(() => {});
        
        // Update the success story with new collage URLs
        await storage.updateSuccessStory(id, {
          collagePhotoUrl: webpObjectPath,
          jpegCollagePhotoUrl: jpegObjectPath
        });
        
        console.log(`[Success Stories] ✅ Collage regenerated with custom focal points`);
      }

      res.json({ story: updatedStory });
    } catch (error: any) {
      console.error("[Success Stories] Error updating focal points:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate AI caption for success story (admin only)
  app.post("/api/admin/generate-story-caption", requireAdmin, async (req, res) => {
    try {
      const { photo1Url, photo2Url } = req.body;
      
      if (!photo1Url || !photo2Url) {
        return res.status(400).json({ error: "Both photo URLs are required" });
      }

      console.log(`[Manual Success Story] Generating caption for photos...`);

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze these two plumbing job photos (before and after). Create a compelling success story with:
1. A short, impactful title (5-8 words)
2. A brief description (2-3 sentences) explaining the transformation

Focus on the problem solved, the quality of work, and customer satisfaction. Use professional plumbing terminology.`,
              },
              {
                type: "image_url",
                image_url: { url: photo1Url },
              },
              {
                type: "image_url",
                image_url: { url: photo2Url },
              },
            ],
          },
        ],
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content || "";
      
      // Parse the response to extract title and description
      const lines = content.split('\n').filter((line: string) => line.trim());
      const title = lines[0]?.replace(/^(Title:|1\.|#)\s*/i, '').trim() || "Professional Plumbing Service";
      const description = lines.slice(1).join(' ').replace(/^(Description:|2\.)\s*/i, '').trim() || content;

      console.log(`[Manual Success Story] ✅ Caption generated`);

      res.json({ title, description });
    } catch (error: any) {
      console.error("[Manual Success Story] Error generating caption:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create manual success story (admin only)
  app.post("/api/admin/success-stories/manual", requireAdmin, async (req, res) => {
    try {
      const { photo1Id, photo2Id, title, description } = req.body;
      
      if (!photo1Id || !photo2Id || !title || !description) {
        return res.status(400).json({ error: "All fields are required" });
      }

      console.log(`[Manual Success Story] Creating success story...`);

      // Get the photo URLs
      const photo1 = await storage.getPhotoById(photo1Id);
      const photo2 = await storage.getPhotoById(photo2Id);

      if (!photo1 || !photo2) {
        return res.status(400).json({ error: "One or both photos not found" });
      }

      // Create the success story (unapproved by default)
      const story = await storage.createCustomerSuccessStory({
        customerName: "Customer", // Default name for admin-created stories
        story: description,
        beforePhotoUrl: photo1.photoUrl,
        afterPhotoUrl: photo2.photoUrl,
        serviceCategory: photo1.category || "general",
        location: "Austin/Marble Falls, TX",
      });

      // Mark photos as used
      await storage.markPhotoAsUsed(photo1Id, story.id, 'success_story');
      await storage.markPhotoAsUsed(photo2Id, story.id, 'success_story');

      console.log(`[Manual Success Story] ✅ Success story created: ${story.id}`);

      res.json({ story });
    } catch (error: any) {
      console.error("[Manual Success Story] Error creating story:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate AI blog post from photo (admin only)
  app.post("/api/admin/generate-blog-post", requireAdmin, async (req, res) => {
    try {
      const { photoUrl, aiDescription } = req.body;
      
      if (!photoUrl) {
        return res.status(400).json({ error: "Photo URL is required" });
      }

      console.log(`[Manual Blog Post] Generating blog post from photo...`);

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `Create an SEO-optimized plumbing blog post based on this photo${aiDescription ? ` (AI description: ${aiDescription})` : ''}.

Include:
1. An engaging title with plumbing keywords (60-70 characters)
2. A comprehensive article (400-600 words) in markdown format

The blog post should:
- Focus on plumbing services in Austin/Marble Falls, Texas
- Include practical tips and expert advice
- Use natural keyword integration
- Be helpful and informative for homeowners
- Include a call-to-action at the end

Write in a professional yet friendly tone.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: photoUrl } },
            ],
          },
        ],
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content || "";
      
      // Parse title and content
      const lines = content.split('\n');
      const titleLine = lines.find(line => line.trim().startsWith('#') || line.length > 20 && line.length < 100);
      const title = titleLine?.replace(/^#\s*/, '').trim() || "Expert Plumbing Services in Austin";
      
      // Get content after title
      const titleIndex = lines.indexOf(titleLine || '');
      const blogContent = lines.slice(titleIndex + 1).join('\n').trim();

      console.log(`[Manual Blog Post] ✅ Blog post generated`);

      res.json({ title, content: blogContent });
    } catch (error: any) {
      console.error("[Manual Blog Post] Error generating blog post:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create manual blog post (admin only)
  app.post("/api/admin/blog-posts/manual", requireAdmin, async (req, res) => {
    try {
      const { photoId, title, content } = req.body;
      
      if (!photoId || !title || !content) {
        return res.status(400).json({ error: "All fields are required" });
      }

      console.log(`[Manual Blog Post] Creating blog post...`);

      // Get the photo
      const photo = await storage.getPhotoById(photoId);

      if (!photo) {
        return res.status(400).json({ error: "Photo not found" });
      }

      // Generate slug from title
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Create blog post (backdated by 1-3 months for SEO)
      const monthsAgo = Math.floor(Math.random() * 3) + 1;
      const publishDate = new Date();
      publishDate.setMonth(publishDate.getMonth() - monthsAgo);

      // Process image and generate JPEG version
      let featuredImage = photo.photoUrl;
      let jpegFeaturedImage = null;
      
      if (photo.photoUrl) {
        try {
          console.log(`[Manual Blog Post] Processing image for: ${title}`);
          const processed = await processBlogImage(photo.photoUrl, title);
          
          featuredImage = processed.imagePath;
          jpegFeaturedImage = processed.jpegImagePath;
          console.log(`[Manual Blog Post] ✅ Image processed - WebP: ${featuredImage}, JPEG: ${jpegFeaturedImage}`);
        } catch (imageError) {
          console.error(`[Manual Blog Post] ⚠️ Image processing failed, attempting simple conversion:`, imageError);
          // Fallback: Convert WebP to JPEG without cropping
          try {
            const sharpLib = (await import("sharp")).default;
            const objectStorage = new ObjectStorageService();
            
            // Download WebP image
            const webpBuffer = await objectStorage.downloadBuffer(photo.photoUrl);
            if (webpBuffer) {
              // Convert to JPEG
              const jpegBuffer = await sharpLib(webpBuffer)
                .jpeg({ quality: 90 })
                .toBuffer();
              
              // Upload JPEG with same path but .jpg extension
              const jpegPath = photo.photoUrl.replace(/\.webp$/i, '.jpg');
              await objectStorage.uploadBuffer(jpegBuffer, jpegPath, 'image/jpeg');
              
              featuredImage = photo.photoUrl;
              jpegFeaturedImage = jpegPath;
              console.log(`[Manual Blog Post] ✅ Fallback JPEG created: ${jpegPath}`);
            } else {
              // Last resort: use WebP for both (RSS readers may support it)
              featuredImage = photo.photoUrl;
              jpegFeaturedImage = photo.photoUrl;
              console.warn(`[Manual Blog Post] ⚠️ Using WebP for both formats`);
            }
          } catch (conversionError) {
            console.error(`[Manual Blog Post] ❌ JPEG conversion failed:`, conversionError);
            // Last resort: use WebP for both
            featuredImage = photo.photoUrl;
            jpegFeaturedImage = photo.photoUrl;
          }
        }
      }

      const post = await storage.createBlogPost({
        title,
        content,
        slug,
        excerpt: content.substring(0, 150).replace(/#+\s*/g, '').trim() + '...',
        featuredImage,
        jpegFeaturedImage,
        imageId: photoId,
        author: 'Economy Plumbing Services',
        category: photo.category || 'General',
        published: true,
        h1: generateH1FromTitle(title),
      });

      // Mark photo as used
      await storage.markPhotoAsUsed(photoId, post.id.toString(), 'blog_post');

      console.log(`[Manual Blog Post] ✅ Blog post created: ${post.id}`);

      res.json({ post });
    } catch (error: any) {
      console.error("[Manual Blog Post] Error creating blog post:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Backfill JPEG images for existing blog posts
  app.post("/api/admin/backfill-blog-jpegs", requireAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const sharp = (await import("sharp")).default;
      
      // Get all blog posts without JPEG versions but with WebP featured images
      const posts = await storage.getBlogPosts();
      const postsToBackfill = posts.filter((p: any) => p.featuredImage && !p.jpegFeaturedImage);
      
      console.log(`[JPEG Backfill] Found ${postsToBackfill.length} blog posts to backfill`);
      
      const results = {
        total: postsToBackfill.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const post of postsToBackfill) {
        try {
          console.log(`[JPEG Backfill] Processing blog post: ${post.title}`);
          
          // Skip if no featured image
          if (!post.featuredImage) {
            console.log(`[JPEG Backfill] ⏭️ Skipping ${post.title} - no featured image`);
            continue;
          }
          
          // Download the WebP image
          const webpBuffer = await objectStorageService.downloadBuffer(post.featuredImage);
          if (!webpBuffer) {
            throw new Error(`Failed to download WebP image: ${post.featuredImage}`);
          }
          
          // Convert to JPEG
          const jpegBuffer = await sharp(webpBuffer)
            .jpeg({ quality: 90 })
            .toBuffer();
          
          // Upload JPEG version - replace .webp with .jpg in the path
          const jpegPath = post.featuredImage.replace(/\.webp$/i, '.jpg');
          await objectStorageService.uploadBuffer(jpegBuffer, jpegPath, 'image/jpeg');
          
          // Update database
          await storage.updateBlogPost(post.id.toString(), {
            jpegFeaturedImage: jpegPath
          });
          
          console.log(`[JPEG Backfill] ✅ Successfully backfilled JPEG for: ${post.title}`);
          results.successful++;
          
        } catch (error: any) {
          console.error(`[JPEG Backfill] ❌ Failed to backfill ${post.title}:`, error);
          results.failed++;
          results.errors.push(`${post.title}: ${error.message}`);
        }
      }
      
      console.log(`[JPEG Backfill] Complete: ${results.successful} successful, ${results.failed} failed`);
      res.json(results);
      
    } catch (error: any) {
      console.error("[JPEG Backfill] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Backfill JPEG images for existing success stories
  app.post("/api/admin/backfill-success-story-jpegs", requireAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const sharp = (await import("sharp")).default;
      
      // Get all success stories without JPEG versions but with WebP collages
      const stories = await storage.getAllSuccessStories();
      const storiesToBackfill = stories.filter(s => s.collagePhotoUrl && !s.jpegCollagePhotoUrl);
      
      console.log(`[JPEG Backfill] Found ${storiesToBackfill.length} success stories to backfill`);
      
      const results = {
        total: storiesToBackfill.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const story of storiesToBackfill) {
        try {
          console.log(`[JPEG Backfill] Processing success story: ${story.customerName}`);
          
          // Skip if no collage URL
          if (!story.collagePhotoUrl) {
            console.log(`[JPEG Backfill] ⏭️ Skipping ${story.customerName} - no collage URL`);
            continue;
          }
          
          // Download the WebP collage
          const webpBuffer = await objectStorageService.downloadBuffer(story.collagePhotoUrl);
          if (!webpBuffer) {
            throw new Error(`Failed to download WebP collage: ${story.collagePhotoUrl}`);
          }
          
          // Convert to JPEG
          const jpegBuffer = await sharp(webpBuffer)
            .jpeg({ quality: 90 })
            .toBuffer();
          
          // Upload JPEG version - replace .webp with .jpg in the path
          const jpegPath = story.collagePhotoUrl.replace(/\.webp$/i, '.jpg');
          await objectStorageService.uploadBuffer(jpegBuffer, jpegPath, 'image/jpeg');
          
          // Update database
          await storage.updateSuccessStory(story.id, {
            jpegCollagePhotoUrl: jpegPath
          });
          
          console.log(`[JPEG Backfill] ✅ Successfully backfilled JPEG for: ${story.customerName}`);
          results.successful++;
          
        } catch (error: any) {
          console.error(`[JPEG Backfill] ❌ Failed to backfill ${story.customerName}:`, error);
          results.failed++;
          results.errors.push(`${story.customerName}: ${error.message}`);
        }
      }
      
      console.log(`[JPEG Backfill] Complete: ${results.successful} successful, ${results.failed} failed`);
      res.json(results);
      
    } catch (error: any) {
      console.error("[JPEG Backfill] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Reprocess success story collages with AI focal point detection
  app.post("/api/admin/reprocess-success-story-collages", requireAdmin, async (req, res) => {
    try {
      const { createBeforeAfterComposite } = await import("./lib/beforeAfterComposer");
      const path = await import("path");
      const fs = await import("fs/promises");
      const os = await import("os");
      
      const objectStorageService = new ObjectStorageService();
      const publicSearchPaths = objectStorageService.getPublicObjectSearchPaths();
      const publicPath = publicSearchPaths[0];
      
      // Get all approved success stories (those with collages)
      const stories = await storage.getAllSuccessStories();
      const approvedStories = stories.filter(s => s.approved && s.beforePhotoUrl && s.afterPhotoUrl);
      
      console.log(`[Reprocess Collages] Found ${approvedStories.length} approved success stories to reprocess`);
      
      const results = {
        total: approvedStories.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const story of approvedStories) {
        try {
          console.log(`[Reprocess Collages] Regenerating collage for: ${story.customerName}`);
          
          // Create collage in temp directory
          const tmpDir = os.tmpdir();
          const webpFilename = `success_story_${story.id}_${Date.now()}.webp`;
          const jpegFilename = webpFilename.replace('.webp', '.jpg');
          const tmpWebpPath = path.join(tmpDir, webpFilename);
          const tmpJpegPath = path.join(tmpDir, jpegFilename);
          
          // Create the collage with AI focal point detection (creates both WebP and JPEG)
          await createBeforeAfterComposite(
            story.beforePhotoUrl,
            story.afterPhotoUrl,
            tmpWebpPath
          );
          
          // Upload both WebP and JPEG to object storage
          const webpObjectPath = `${publicPath}/success_stories/${webpFilename}`;
          const jpegObjectPath = `${publicPath}/success_stories/${jpegFilename}`;
          
          await objectStorageService.uploadFile(tmpWebpPath, webpObjectPath, 'image/webp');
          await objectStorageService.uploadFile(tmpJpegPath, jpegObjectPath, 'image/jpeg');
          
          // Clean up temp files
          await fs.unlink(tmpWebpPath).catch(() => {});
          await fs.unlink(tmpJpegPath).catch(() => {});
          
          // Update the success story with new collage URLs
          await storage.updateSuccessStory(story.id, {
            collagePhotoUrl: webpObjectPath,
            jpegCollagePhotoUrl: jpegObjectPath
          });
          
          console.log(`[Reprocess Collages] ✅ Successfully reprocessed: ${story.customerName}`);
          results.successful++;
          
        } catch (error: any) {
          console.error(`[Reprocess Collages] ❌ Failed to reprocess ${story.customerName}:`, error);
          results.failed++;
          results.errors.push(`${story.customerName}: ${error.message}`);
        }
      }
      
      console.log(`[Reprocess Collages] Complete: ${results.successful} successful, ${results.failed} failed`);
      res.json(results);
      
    } catch (error: any) {
      console.error("[Reprocess Collages] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // TEST MODE: Create payment intent using test Stripe keys (for safe testing)
  app.post("/api/create-payment-intent/test", async (req, res) => {
    try {
      const { productId, customerInfo } = req.body;

      if (!productId) {
        return res.status(400).json({ 
          error: "MISSING_PRODUCT_ID",
          message: "Product ID is required" 
        });
      }

      // Get product details from database - NEVER trust client-side pricing
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ 
          error: "PRODUCT_NOT_FOUND",
          message: "Product not found" 
        });
      }

      // Verify product is active and available for purchase
      if (!product.active) {
        return res.status(400).json({ 
          error: "PRODUCT_UNAVAILABLE",
          message: "This product is no longer available for purchase" 
        });
      }

      // Verify this is a membership product (case-insensitive check)
      if (product.category.toLowerCase() !== 'membership') {
        return res.status(400).json({ 
          error: "NOT_A_MEMBERSHIP",
          message: "This product is not a VIP membership. Please use the store for other products." 
        });
      }

      // Initialize Stripe with TEST keys
      const stripeSecretKey = process.env.TESTING_STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error('Missing required Stripe test secret: TESTING_STRIPE_SECRET_KEY');
      }
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2025-09-30.clover",
      });

      // Product price is already stored in cents in the database
      const amountInCents = product.price;

      if (amountInCents <= 0) {
        return res.status(400).json({ 
          error: "INVALID_PRICE",
          message: "Product has an invalid price" 
        });
      }

      // Create payment intent with server-side validated pricing
      const metadata = {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        category: product.category,
        sku: product.sku || '',
        serviceTitanMembershipTypeId: product.serviceTitanMembershipTypeId || '',
        durationBillingId: product.durationBillingId || '',
        testMode: "true", // Mark this as a test transaction
        // Customer type and identification
        customerType: customerInfo?.customerType || '',
        customerName: customerInfo?.locationName || '',
        companyName: customerInfo?.companyName || '',
        contactPersonName: customerInfo?.contactPersonName || '',
        locationName: customerInfo?.locationName || '',
        // Contact info
        email: customerInfo?.email || '',
        phone: customerInfo?.phone || '',
        locationPhone: customerInfo?.locationPhone || '',
        extension: customerInfo?.extension || '',
        // Location address
        street: customerInfo?.street || '',
        city: customerInfo?.city || '',
        state: customerInfo?.state || '',
        zip: customerInfo?.zip || '',
        // Billing address
        billingName: customerInfo?.billingName || '',
        billingStreet: customerInfo?.billingStreet || '',
        billingCity: customerInfo?.billingCity || '',
        billingState: customerInfo?.billingState || '',
        billingZip: customerInfo?.billingZip || '',
      };
      
      // Build billing_details from customer info
      const billingDetails: any = {};
      
      if (customerInfo) {
        billingDetails.name = customerInfo.customerType === 'residential' 
          ? customerInfo.locationName 
          : customerInfo.companyName;
        billingDetails.email = customerInfo.email;
        billingDetails.phone = customerInfo.phone;
        billingDetails.address = {
          line1: customerInfo.billingStreet || customerInfo.street,
          city: customerInfo.billingCity || customerInfo.city,
          state: customerInfo.billingState || customerInfo.state,
          postal_code: customerInfo.billingZip || customerInfo.zip,
          country: 'US',
        };
      }
      
      // Create payment intent without shipping info to avoid conflicts with frontend updates
      // All customer info is stored in metadata and pending_purchases table
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata,
      });

      // Save customer info to pending purchases if provided
      if (customerInfo) {
        const purchaseData: any = {
          paymentIntentId: paymentIntent.id,
          productId: product.id,
          customerType: customerInfo.customerType,
          street: customerInfo.street,
          city: customerInfo.city,
          state: customerInfo.state,
          zip: customerInfo.zip,
          billingName: customerInfo.billingName,
          billingStreet: customerInfo.billingStreet,
          billingCity: customerInfo.billingCity,
          billingState: customerInfo.billingState,
          billingZip: customerInfo.billingZip,
          phone: customerInfo.phone,
          email: customerInfo.email,
        };

        if (customerInfo.customerType === 'residential') {
          // For residential, locationName from form is the customer name
          purchaseData.customerName = customerInfo.locationName;
          purchaseData.locationName = customerInfo.locationName;
        } else {
          // For commercial
          purchaseData.companyName = customerInfo.companyName;
          purchaseData.locationName = customerInfo.locationName;
          purchaseData.contactPersonName = customerInfo.contactPersonName;
          purchaseData.locationPhone = customerInfo.locationPhone;
          purchaseData.extension = customerInfo.extension;
        }

        await storage.createPendingPurchase(purchaseData);
        
        // Send email notification
        try {
          const { sendMembershipPurchaseNotification } = await import('./email.js');
          await sendMembershipPurchaseNotification({
            productName: product.name,
            productSlug: product.slug,
            amount: amountInCents,
            customerType: customerInfo.customerType,
            customerName: customerInfo.customerType === 'residential' ? customerInfo.locationName : undefined,
            companyName: customerInfo.companyName,
            contactPersonName: customerInfo.contactPersonName,
            locationName: customerInfo.locationName,
            email: customerInfo.email,
            phone: customerInfo.phone,
            locationPhone: customerInfo.locationPhone,
            extension: customerInfo.extension,
            street: customerInfo.street,
            city: customerInfo.city,
            state: customerInfo.state,
            zip: customerInfo.zip,
            billingName: customerInfo.billingName,
            billingStreet: customerInfo.billingStreet,
            billingCity: customerInfo.billingCity,
            billingState: customerInfo.billingState,
            billingZip: customerInfo.billingZip,
            sku: product.sku || undefined,
            serviceTitanMembershipTypeId: product.serviceTitanMembershipTypeId || undefined,
            durationBillingId: product.durationBillingId || undefined,
            paymentIntentId: paymentIntent.id,
            testMode: true,
          });
        } catch (emailError) {
          console.error('[Email] Failed to send membership notification (non-fatal):', emailError);
        }
      }

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Error creating TEST payment intent:', error);
      
      // Return structured error for better client-side handling
      if (error.type === 'StripeAuthenticationError') {
        return res.status(500).json({ 
          error: "STRIPE_AUTH_ERROR",
          message: "Unable to authenticate with payment processor. Please try again later." 
        });
      }
      
      // Stripe API errors (network, rate limit, etc)
      if (error.type && error.type.startsWith('Stripe')) {
        console.error('[Stripe API Error]', error.type, error.message);
        return res.status(500).json({ 
          error: "STRIPE_API_ERROR",
          message: "Payment processor error. Please try again." 
        });
      }
      
      // Unexpected errors - log for monitoring
      console.error('[Test Payment Intent Creation Failed]', error.message, error.stack);
      res.status(500).json({ 
        error: "PAYMENT_INTENT_FAILED",
        message: "Unable to create payment intent. Please try again." 
      });
    }
  });

  // Reference: blueprint:javascript_stripe - Create payment intent for VIP memberships
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { productId, customerInfo } = req.body;

      if (!productId) {
        return res.status(400).json({ 
          error: "MISSING_PRODUCT_ID",
          message: "Product ID is required" 
        });
      }

      // Get product details from database - NEVER trust client-side pricing
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ 
          error: "PRODUCT_NOT_FOUND",
          message: "Product not found" 
        });
      }

      // Verify product is active and available for purchase
      if (!product.active) {
        return res.status(400).json({ 
          error: "PRODUCT_UNAVAILABLE",
          message: "This product is no longer available for purchase" 
        });
      }

      // Verify this is a membership product (case-insensitive check)
      // This ensures Stripe is only used for memberships, not Ecwid products
      if (product.category.toLowerCase() !== 'membership') {
        return res.status(400).json({ 
          error: "NOT_A_MEMBERSHIP",
          message: "This product is not a VIP membership. Please use the store for other products." 
        });
      }

      // Initialize Stripe
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
      }
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2025-09-30.clover",
      });

      // Product price is already stored in cents in the database
      const amountInCents = product.price;

      if (amountInCents <= 0) {
        return res.status(400).json({ 
          error: "INVALID_PRICE",
          message: "Product has an invalid price" 
        });
      }

      // Create payment intent with server-side validated pricing
      const metadata = {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        category: product.category,
        sku: product.sku || '',
        serviceTitanMembershipTypeId: product.serviceTitanMembershipTypeId || '',
        durationBillingId: product.durationBillingId || '',
        // Customer type and identification
        customerType: customerInfo?.customerType || '',
        customerName: customerInfo?.locationName || '',
        companyName: customerInfo?.companyName || '',
        contactPersonName: customerInfo?.contactPersonName || '',
        locationName: customerInfo?.locationName || '',
        // Contact info
        email: customerInfo?.email || '',
        phone: customerInfo?.phone || '',
        locationPhone: customerInfo?.locationPhone || '',
        extension: customerInfo?.extension || '',
        // Location address
        street: customerInfo?.street || '',
        city: customerInfo?.city || '',
        state: customerInfo?.state || '',
        zip: customerInfo?.zip || '',
        // Billing address
        billingName: customerInfo?.billingName || '',
        billingStreet: customerInfo?.billingStreet || '',
        billingCity: customerInfo?.billingCity || '',
        billingState: customerInfo?.billingState || '',
        billingZip: customerInfo?.billingZip || '',
      };
      
      // Create payment intent without shipping info to avoid conflicts with frontend updates
      // All customer info is stored in metadata and pending_purchases table
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata,
      });

      // Save customer info to pending purchases if provided
      if (customerInfo) {
        const purchaseData: any = {
          paymentIntentId: paymentIntent.id,
          productId: product.id,
          customerType: customerInfo.customerType,
          street: customerInfo.street,
          city: customerInfo.city,
          state: customerInfo.state,
          zip: customerInfo.zip,
          billingName: customerInfo.billingName,
          billingStreet: customerInfo.billingStreet,
          billingCity: customerInfo.billingCity,
          billingState: customerInfo.billingState,
          billingZip: customerInfo.billingZip,
          phone: customerInfo.phone,
          email: customerInfo.email,
        };

        if (customerInfo.customerType === 'residential') {
          // For residential, locationName from form is the customer name
          purchaseData.customerName = customerInfo.locationName;
          purchaseData.locationName = customerInfo.locationName;
        } else {
          // For commercial
          purchaseData.companyName = customerInfo.companyName;
          purchaseData.locationName = customerInfo.locationName;
          purchaseData.contactPersonName = customerInfo.contactPersonName;
          purchaseData.locationPhone = customerInfo.locationPhone;
          purchaseData.extension = customerInfo.extension;
        }

        await storage.createPendingPurchase(purchaseData);
        
        // Send email notification
        try {
          const { sendMembershipPurchaseNotification } = await import('./email.js');
          await sendMembershipPurchaseNotification({
            productName: product.name,
            productSlug: product.slug,
            amount: amountInCents,
            customerType: customerInfo.customerType,
            customerName: customerInfo.customerType === 'residential' ? customerInfo.locationName : undefined,
            companyName: customerInfo.companyName,
            contactPersonName: customerInfo.contactPersonName,
            locationName: customerInfo.locationName,
            email: customerInfo.email,
            phone: customerInfo.phone,
            locationPhone: customerInfo.locationPhone,
            extension: customerInfo.extension,
            street: customerInfo.street,
            city: customerInfo.city,
            state: customerInfo.state,
            zip: customerInfo.zip,
            billingName: customerInfo.billingName,
            billingStreet: customerInfo.billingStreet,
            billingCity: customerInfo.billingCity,
            billingState: customerInfo.billingState,
            billingZip: customerInfo.billingZip,
            sku: product.sku || undefined,
            serviceTitanMembershipTypeId: product.serviceTitanMembershipTypeId || undefined,
            durationBillingId: product.durationBillingId || undefined,
            paymentIntentId: paymentIntent.id,
            testMode: false,
          });
        } catch (emailError) {
          console.error('[Email] Failed to send membership notification (non-fatal):', emailError);
        }
      }

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      
      // Return structured error for better client-side handling
      if (error.type === 'StripeAuthenticationError') {
        return res.status(500).json({ 
          error: "STRIPE_AUTH_ERROR",
          message: "Unable to authenticate with payment processor. Please try again later." 
        });
      }
      
      // Stripe API errors (network, rate limit, etc)
      if (error.type && error.type.startsWith('Stripe')) {
        console.error('[Stripe API Error]', error.type, error.message);
        return res.status(500).json({ 
          error: "STRIPE_API_ERROR",
          message: "Payment processor error. Please try again." 
        });
      }
      
      // Unexpected errors - log for monitoring
      console.error('[Payment Intent Creation Failed]', error.message, error.stack);
      res.status(500).json({ 
        error: "PAYMENT_INTENT_FAILED",
        message: "Unable to create payment intent. Please try again." 
      });
    }
  });

  // Enhanced AI Chatbot endpoint with conversation tracking
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { messages, sessionId, conversationId, pageContext, customerEmail, customerPhone } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }

      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }

      // Get or create conversation
      let conversation;
      if (conversationId) {
        const [existing] = await db
          .select()
          .from(chatbotConversations)
          .where(eq(chatbotConversations.id, conversationId));
        conversation = existing;
      }
      
      if (!conversation) {
        // Create new conversation
        const [newConv] = await db
          .insert(chatbotConversations)
          .values({
            sessionId,
            pageContext: pageContext || 'unknown',
            customerEmail,
            customerPhone,
          })
          .returning();
        conversation = newConv;
        
        // Store the first message (if any)
        if (messages.length > 0) {
          const lastUserMessage = messages.filter(m => m.role === 'user').pop();
          if (lastUserMessage) {
            await db.insert(chatbotMessages).values({
              conversationId: conversation.id,
              role: 'user',
              content: lastUserMessage.content,
            });
            
            // Track analytics for the question
            const questionLower = lastUserMessage.content.toLowerCase();
            let category = 'general';
            if (questionLower.includes('price') || questionLower.includes('cost')) category = 'pricing';
            else if (questionLower.includes('emergency') || questionLower.includes('urgent')) category = 'emergency';
            else if (questionLower.includes('schedule') || questionLower.includes('appointment')) category = 'scheduling';
            else if (questionLower.includes('water heater')) category = 'water_heater';
            else if (questionLower.includes('drain') || questionLower.includes('clog')) category = 'drain';
            else if (questionLower.includes('leak')) category = 'leak';
            
            // Check if question already exists in analytics
            const [existingAnalytics] = await db
              .select()
              .from(chatbotAnalytics)
              .where(eq(chatbotAnalytics.question, lastUserMessage.content));
              
            if (existingAnalytics) {
              await db
                .update(chatbotAnalytics)
                .set({ 
                  count: existingAnalytics.count + 1,
                  lastAsked: new Date(),
                })
                .where(eq(chatbotAnalytics.id, existingAnalytics.id));
            } else {
              await db.insert(chatbotAnalytics).values({
                question: lastUserMessage.content,
                category,
              });
            }
          }
        }
      } else {
        // Store the latest user message
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
          await db.insert(chatbotMessages).values({
            conversationId: conversation.id,
            role: 'user',
            content: lastUserMessage.content,
          });
        }
      }

      // Check if OpenAI is configured
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        const fallbackMessage = "I'm having trouble connecting right now. Please text or call us directly for immediate assistance!";
        
        // Store the assistant message
        await db.insert(chatbotMessages).values({
          conversationId: conversation.id,
          role: 'assistant',
          content: fallbackMessage,
        });
        
        return res.json({
          message: fallbackMessage,
          needsHandoff: true,
          conversationId: conversation.id,
        });
      }

      const openai = new OpenAI({ apiKey: openaiKey });

      // Enhanced system prompt with more knowledge
      const systemPrompt = `You are an AI assistant for Economy Plumbing Services, a trusted plumbing company serving Austin and Marble Falls, Texas.

Your role:
- Answer common plumbing questions (water heaters, drains, leaks, pricing estimates)
- Help customers understand services
- Provide general scheduling information
- Be friendly, helpful, and professional
- Provide DIY tips for minor issues while emphasizing safety

Services we offer:
- Water heater installation & repair (tank and tankless)
- Drain cleaning & hydro jetting
- Leak detection & repair
- Emergency plumbing (24/7)
- Backflow testing
- Commercial plumbing
- Gas line services
- Toilet & faucet repair
- VIP Membership (priority service, discounts, annual inspections)

Pricing estimates:
- Water heater installation: $1,200-$2,800 depending on size
- Drain cleaning: $150-$400
- Leak repair: $200-$600
- Emergency service: Available 24/7
- VIP Membership: $299/year (includes 15% discount on all services)

Business hours:
- Regular: Monday-Friday 7 AM - 7 PM
- Emergency service: 24/7 available
- Service areas: Austin, Marble Falls, Cedar Park, Leander, Georgetown, Round Rock

Common DIY tips (always emphasize safety):
- Running toilet: Check flapper valve and fill valve
- Slow drain: Try plunger or baking soda/vinegar before chemicals
- Low water pressure: Check aerators for buildup
- Frozen pipes: Never use open flame, use hair dryer or space heater

Appointment Booking:
- When customer asks to schedule or book an appointment, respond with: "I'll open our scheduling system for you now! Select a service and pick a time that works best for you. Our online scheduler will show you available appointment slots."
- The system will automatically open the ServiceTitan scheduler when you mention scheduling

When to hand off to human via SMS/Call:
- Customer wants specific pricing for their situation
- Customer has an emergency (burst pipe, major leak, no hot water)
- Customer asks complex technical questions beyond general info
- Customer explicitly asks to speak with someone
- Customer mentions ServiceTitan account or specific job history
- You're unsure or don't have enough information

If handoff is needed, respond with: "I'd be happy to connect you with our team! They can provide personalized pricing and immediate assistance. Would you prefer to text or call us?"

Keep responses concise (2-3 sentences max). Be warm and helpful. If the customer is on a specific page (pageContext: ${pageContext || 'unknown'}), tailor your response to be contextually relevant.`;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const aiResponse = completion.choices[0]?.message?.content || "I'm having trouble right now. Please text or call us!";

      // Store the assistant message
      await db.insert(chatbotMessages).values({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse,
      });

      // Detect if scheduling keywords are present
      const schedulingKeywords = [
        "scheduling system",
        "online scheduler",
        "appointment slots",
        "open our scheduling",
        "select a service and pick a time"
      ];

      const openScheduler = schedulingKeywords.some(keyword => 
        aiResponse.toLowerCase().includes(keyword.toLowerCase())
      );

      // Detect if handoff keywords are present (excluding scheduling)
      const handoffKeywords = [
        "connect you with",
        "speak with",
        "talk to",
        "text or call",
        "contact our team",
        "pricing for your",
        "emergency",
      ];

      const needsHandoff = handoffKeywords.some(keyword => 
        aiResponse.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // Update conversation if handoff needed
      if (needsHandoff) {
        await db
          .update(chatbotConversations)
          .set({ 
            handoffRequested: true,
            handoffReason: 'AI detected handoff needed',
          })
          .where(eq(chatbotConversations.id, conversation.id));
      }

      // Update conversation if scheduler was opened
      if (openScheduler) {
        await db
          .update(chatbotConversations)
          .set({ 
            handoffRequested: true,
            handoffReason: 'Customer directed to ServiceTitan scheduler',
          })
          .where(eq(chatbotConversations.id, conversation.id));
      }

      // Get quick responses for the current context
      const quickResponses = await db
        .select()
        .from(chatbotQuickResponses)
        .where(eq(chatbotQuickResponses.active, true))
        .orderBy(chatbotQuickResponses.sortOrder);

      res.json({
        message: aiResponse,
        needsHandoff,
        openScheduler, // Add this flag to trigger ServiceTitan scheduler
        conversationId: conversation.id,
        quickResponses: quickResponses.map(qr => ({
          id: qr.id,
          label: qr.label,
          message: qr.message,
          icon: qr.icon,
        })),
      });

    } catch (error: any) {
      console.error("Chatbot error:", error);
      res.status(500).json({
        message: "I'm having trouble connecting right now. Please text or call us directly for immediate assistance!",
        needsHandoff: true
      });
    }
  });
  
  // Get conversation history
  app.get("/api/chatbot/conversation/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      
      const messages = await db
        .select()
        .from(chatbotMessages)
        .where(eq(chatbotMessages.conversationId, conversationId))
        .orderBy(chatbotMessages.createdAt);
        
      res.json({ messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });
  
  // Submit feedback for a message
  app.post("/api/chatbot/feedback", async (req, res) => {
    try {
      const { messageId, feedback, conversationId } = req.body;
      
      if (!messageId || !feedback || !['positive', 'negative'].includes(feedback)) {
        return res.status(400).json({ error: "Invalid feedback data" });
      }
      
      // Update message feedback
      await db
        .update(chatbotMessages)
        .set({ feedback })
        .where(eq(chatbotMessages.id, messageId));
        
      // Update conversation feedback counters
      if (conversationId) {
        const updateData = feedback === 'positive' 
          ? { feedbackPositive: sql`feedback_positive + 1` }
          : { feedbackNegative: sql`feedback_negative + 1` };
          
        await db
          .update(chatbotConversations)
          .set(updateData)
          .where(eq(chatbotConversations.id, conversationId));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });
  
  // End conversation and send email
  app.post("/api/chatbot/end-conversation", async (req, res) => {
    try {
      const { conversationId, rating } = req.body;
      
      if (!conversationId) {
        return res.status(400).json({ error: "Conversation ID required" });
      }
      
      // Get conversation and messages
      const [conversation] = await db
        .select()
        .from(chatbotConversations)
        .where(eq(chatbotConversations.id, conversationId));
        
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const messages = await db
        .select()
        .from(chatbotMessages)
        .where(eq(chatbotMessages.conversationId, conversationId))
        .orderBy(chatbotMessages.createdAt);
      
      // Update conversation
      await db
        .update(chatbotConversations)
        .set({ 
          endedAt: new Date(),
          rating,
          emailSent: true,
        })
        .where(eq(chatbotConversations.id, conversationId));
      
      // Send email to admin if configured
      const resendApiKey = process.env.RESEND_API_KEY;
      const adminEmail = process.env.ADMIN_EMAIL;
      
      if (resendApiKey && adminEmail && messages.length > 0) {
        const { Resend } = await import("resend");
        const resend = new Resend(resendApiKey);
        
        // Format conversation for email
        const conversationHtml = messages.map(msg => `
          <div style="margin: 10px 0; padding: 10px; background: ${msg.role === 'user' ? '#f0f0f0' : '#e3f2fd'}; border-radius: 8px;">
            <strong>${msg.role === 'user' ? 'Customer' : 'AI Assistant'}:</strong><br/>
            ${msg.content}
            ${msg.feedback ? `<br/><small>Feedback: ${msg.feedback}</small>` : ''}
          </div>
        `).join('');
        
        const emailHtml = `
          <h2>Chatbot Conversation Log</h2>
          <p><strong>Session ID:</strong> ${conversation.sessionId}</p>
          <p><strong>Page Context:</strong> ${conversation.pageContext || 'Unknown'}</p>
          <p><strong>Started:</strong> ${new Date(conversation.startedAt).toLocaleString()}</p>
          <p><strong>Rating:</strong> ${rating ? `${rating}/5 stars` : 'Not rated'}</p>
          ${conversation.handoffRequested ? '<p><strong>⚠️ Handoff Requested</strong></p>' : ''}
          ${conversation.customerEmail ? `<p><strong>Customer Email:</strong> ${conversation.customerEmail}</p>` : ''}
          ${conversation.customerPhone ? `<p><strong>Customer Phone:</strong> ${conversation.customerPhone}</p>` : ''}
          <hr/>
          <h3>Conversation:</h3>
          ${conversationHtml}
        `;
        
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "notifications@economyplumbing.com",
            to: adminEmail,
            subject: `Chatbot Conversation ${conversation.handoffRequested ? '- HANDOFF NEEDED' : ''}`,
            html: emailHtml,
          });
        } catch (emailError) {
          console.error("Failed to send conversation email:", emailError);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error ending conversation:", error);
      res.status(500).json({ error: "Failed to end conversation" });
    }
  });
  
  // Upload image for diagnosis
  app.post("/api/chatbot/upload-image", uploadMiddleware.single('image'), async (req, res) => {
    try {
      const { conversationId } = req.body;
      const file = req.file;
      
      if (!file || !conversationId) {
        return res.status(400).json({ error: "Image and conversation ID required" });
      }
      
      // Convert to WebP for storage
      const webpBuffer = await sharp(file.buffer)
        .webp({ quality: 80 })
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
        
      // Generate unique filename
      const filename = `chatbot/${conversationId}/${Date.now()}.webp`;
      
      // TODO: Upload to storage (will implement with object storage if configured)
      // For now, store as base64 in database
      const base64Image = `data:image/webp;base64,${webpBuffer.toString('base64')}`;
      
      // Store message with image
      await db.insert(chatbotMessages).values({
        conversationId,
        role: 'user',
        content: 'Customer uploaded an image',
        imageUrl: base64Image,
      });
      
      // Use OpenAI Vision to analyze the image if configured
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        const openai = new OpenAI({ apiKey: openaiKey });
        
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a plumbing expert. Analyze this image and identify any visible plumbing issues, provide initial assessment, and recommend if professional service is needed.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "What plumbing issue can you see in this image?",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: base64Image,
                      detail: "low",
                    },
                  },
                ],
              },
            ],
            max_tokens: 300,
          });
          
          const analysis = response.choices[0]?.message?.content || "I can see the image but need more context. Can you describe what issue you're experiencing?";
          
          // Store AI analysis
          await db.insert(chatbotMessages).values({
            conversationId,
            role: 'assistant',
            content: analysis,
          });
          
          res.json({ 
            success: true,
            analysis,
            imageUrl: base64Image,
          });
        } catch (visionError) {
          console.error("Vision API error:", visionError);
          res.json({ 
            success: true,
            analysis: "I've received your image. Our team can better assess this when you contact us directly. Would you like to schedule a service call?",
            imageUrl: base64Image,
          });
        }
      } else {
        res.json({ 
          success: true,
          analysis: "I've received your image. Our team will review it and can provide better assistance. Would you like to schedule a service call?",
          imageUrl: base64Image,
        });
      }
      
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });
  
  // Admin: Get all conversations
  app.get("/api/admin/chatbot/conversations", requireAdmin, async (req, res) => {
    try {
      const { page = 1, archived = 'false', handoff = 'all' } = req.query;
      const limit = 20;
      const offset = (Number(page) - 1) * limit;
      
      // Build where conditions
      const whereConditions = [];
      
      // Filter by archived status
      if (archived === 'true') {
        whereConditions.push(eq(chatbotConversations.archived, true));
      } else if (archived === 'false') {
        whereConditions.push(eq(chatbotConversations.archived, false));
      }
      
      // Filter by handoff status
      if (handoff === 'true') {
        whereConditions.push(eq(chatbotConversations.handoffRequested, true));
      } else if (handoff === 'false') {
        whereConditions.push(eq(chatbotConversations.handoffRequested, false));
      }
      
      // Execute query with conditions
      const conversations = whereConditions.length > 0
        ? await db
            .select()
            .from(chatbotConversations)
            .where(sql`${whereConditions.map(c => sql`${c}`).reduce((a, b) => sql`${a} AND ${b}`)}`)
            .orderBy(desc(chatbotConversations.startedAt))
            .limit(limit)
            .offset(offset)
        : await db
            .select()
            .from(chatbotConversations)
            .orderBy(desc(chatbotConversations.startedAt))
            .limit(limit)
            .offset(offset);
      
      // Get total count
      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(chatbotConversations)
        .where(archived === 'true' 
          ? eq(chatbotConversations.archived, true)
          : archived === 'false'
          ? eq(chatbotConversations.archived, false)
          : sql`true`);
      
      res.json({
        conversations,
        pagination: {
          page: Number(page),
          limit,
          total: Number(count),
          pages: Math.ceil(Number(count) / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  // Admin: Get conversation details
  app.get("/api/admin/chatbot/conversation/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [conversation] = await db
        .select()
        .from(chatbotConversations)
        .where(eq(chatbotConversations.id, id));
        
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const messages = await db
        .select()
        .from(chatbotMessages)
        .where(eq(chatbotMessages.conversationId, id))
        .orderBy(chatbotMessages.createdAt);
      
      res.json({
        conversation,
        messages,
      });
    } catch (error) {
      console.error("Error fetching conversation details:", error);
      res.status(500).json({ error: "Failed to fetch conversation details" });
    }
  });
  
  // Admin: Update conversation (archive, notes)
  app.patch("/api/admin/chatbot/conversation/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { archived, notes } = req.body;
      
      const updates: any = {};
      if (archived !== undefined) updates.archived = archived;
      if (notes !== undefined) updates.notes = notes;
      
      await db
        .update(chatbotConversations)
        .set(updates)
        .where(eq(chatbotConversations.id, id));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });
  
  // Admin: Email conversation to admin
  app.post("/api/admin/chatbot/conversation/:id/email", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Fetch conversation with messages
      const [conversation] = await db
        .select()
        .from(chatbotConversations)
        .where(eq(chatbotConversations.id, id));
        
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const messages = await db
        .select()
        .from(chatbotMessages)
        .where(eq(chatbotMessages.conversationId, id))
        .orderBy(chatbotMessages.createdAt);
      
      // Get admin email from environment
      const adminEmail = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL;
      
      if (!adminEmail) {
        console.error("[Chatbot] ADMIN_EMAIL or CONTACT_EMAIL not configured");
        return res.status(500).json({ error: "Admin email not configured" });
      }
      
      // Format conversation for email
      const formatTime = (date: Date) => {
        return new Date(date).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      };
      
      // Build conversation HTML
      let conversationHtml = messages.map((msg) => {
        const time = formatTime(msg.createdAt);
        const roleStyle = msg.role === 'user' 
          ? 'background-color: #e0f2fe; border-left: 3px solid #0284c7;'
          : 'background-color: #f3f4f6; border-left: 3px solid #6b7280;';
        
        let messageHtml = `
          <div style="${roleStyle} padding: 15px; margin: 10px 0; border-radius: 5px;">
            <div style="margin-bottom: 5px;">
              <strong style="color: ${msg.role === 'user' ? '#0284c7' : '#374151'};">
                ${msg.role === 'user' ? '👤 Customer' : '🤖 Assistant'}
              </strong>
              <span style="color: #6b7280; font-size: 12px; margin-left: 10px;">${time}</span>
            </div>
        `;
        
        // Add image if present
        if (msg.imageUrl) {
          messageHtml += `
            <div style="margin: 10px 0;">
              <a href="${msg.imageUrl}" style="color: #0284c7;">📷 View Attached Image</a>
            </div>
          `;
        }
        
        // Add message content
        messageHtml += `
            <div style="white-space: pre-wrap; color: #374151;">${msg.content}</div>
        `;
        
        // Add feedback if present
        if (msg.feedback) {
          const feedbackIcon = msg.feedback === 'positive' ? '👍' : '👎';
          const feedbackColor = msg.feedback === 'positive' ? '#10b981' : '#ef4444';
          messageHtml += `
            <div style="margin-top: 10px;">
              <span style="color: ${feedbackColor}; font-size: 14px;">
                ${feedbackIcon} Customer feedback: ${msg.feedback}
              </span>
            </div>
          `;
        }
        
        messageHtml += `</div>`;
        return messageHtml;
      }).join('');
      
      // Build complete email HTML
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💬 AI Chatbot Conversation Log</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #111827; margin-top: 0;">Conversation Details</h2>
            
            <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Session ID:</strong></td>
                  <td style="padding: 8px 0; color: #374151;">${conversation.sessionId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Started:</strong></td>
                  <td style="padding: 8px 0; color: #374151;">${formatTime(conversation.startedAt)}</td>
                </tr>
                ${conversation.endedAt ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Ended:</strong></td>
                  <td style="padding: 8px 0; color: #374151;">${formatTime(conversation.endedAt)}</td>
                </tr>
                ` : ''}
                ${conversation.rating ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Customer Rating:</strong></td>
                  <td style="padding: 8px 0; color: #374151;">${'⭐'.repeat(conversation.rating)} (${conversation.rating}/5)</td>
                </tr>
                ` : ''}
                ${conversation.pageContext ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Page Context:</strong></td>
                  <td style="padding: 8px 0; color: #374151;">${conversation.pageContext}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Total Messages:</strong></td>
                  <td style="padding: 8px 0; color: #374151;">${messages.length}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Status:</strong></td>
                  <td style="padding: 8px 0; color: #374151;">
                    ${conversation.archived ? '<span style="color: #6b7280;">📁 Archived</span>' : 
                      conversation.endedAt ? '<span style="color: #059669;">✅ Completed</span>' : 
                      '<span style="color: #0284c7;">🔄 Active</span>'}
                  </td>
                </tr>
              </table>
              
              ${conversation.notes ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <strong style="color: #6b7280;">Admin Notes:</strong>
                <p style="color: #374151; margin: 5px 0;">${conversation.notes}</p>
              </div>
              ` : ''}
            </div>
            
            <h3 style="color: #111827; margin-bottom: 15px;">Conversation Transcript</h3>
            <div style="background-color: white; padding: 20px; border-radius: 8px;">
              ${conversationHtml}
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-radius: 8px; text-align: center;">
              <p style="color: #0369a1; margin: 0;">
                <strong>View in Admin Panel:</strong><br>
                <a href="${process.env.NODE_ENV === 'production' ? 'https://www.plumbersthatcare.com' : 'http://localhost:5000'}/admin/chatbot" 
                   style="color: #0284c7; text-decoration: none; font-weight: bold;">
                  Open Chatbot Management Dashboard →
                </a>
              </p>
            </div>
          </div>
          
          <div style="background-color: #374151; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: #d1d5db; margin: 0; font-size: 14px;">
              This email was generated from the Economy Plumbing Services AI Chatbot System<br>
              © ${new Date().getFullYear()} Economy Plumbing Services. All rights reserved.
            </p>
          </div>
        </div>
      `;
      
      // Send email using Resend
      const { sendEmail } = await import('./email');
      
      await sendEmail({
        to: adminEmail,
        subject: `Chatbot Conversation Log - ${formatTime(conversation.startedAt)}`,
        html: emailHtml,
        tags: [
          { name: 'type', value: 'chatbot-conversation' },
          { name: 'conversation_id', value: conversation.id }
        ]
      });
      
      res.json({ success: true, message: "Conversation emailed successfully" });
      console.log(`[Chatbot] Conversation ${id} emailed to ${adminEmail}`);
      
    } catch (error) {
      console.error("Error emailing conversation:", error);
      res.status(500).json({ error: "Failed to email conversation" });
    }
  });
  
  // Admin: Get analytics
  app.get("/api/admin/chatbot/analytics", requireAdmin, async (req, res) => {
    try {
      // Get common questions
      const commonQuestions = await db
        .select()
        .from(chatbotAnalytics)
        .orderBy(desc(chatbotAnalytics.count))
        .limit(20);
      
      // Get conversation stats
      const [stats] = await db
        .select({
          total: sql`count(*)`,
          handoffs: sql`count(*) filter (where handoff_requested = true)`,
          avgRating: sql`avg(rating)`,
          withFeedback: sql`count(*) filter (where feedback_positive > 0 or feedback_negative > 0)`,
        })
        .from(chatbotConversations);
      
      // Get category breakdown
      const categories = await db
        .select({
          category: chatbotAnalytics.category,
          count: sql`sum(${chatbotAnalytics.count})`,
        })
        .from(chatbotAnalytics)
        .groupBy(chatbotAnalytics.category)
        .orderBy(desc(sql`sum(${chatbotAnalytics.count})`));
      
      res.json({
        commonQuestions,
        stats,
        categories,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
  
  // Admin: Manage quick responses
  app.get("/api/admin/chatbot/quick-responses", requireAdmin, async (req, res) => {
    try {
      const responses = await db
        .select()
        .from(chatbotQuickResponses)
        .orderBy(chatbotQuickResponses.sortOrder);
      
      res.json(responses);
    } catch (error) {
      console.error("Error fetching quick responses:", error);
      res.status(500).json({ error: "Failed to fetch quick responses" });
    }
  });
  
  app.post("/api/admin/chatbot/quick-responses", requireAdmin, async (req, res) => {
    try {
      const { label, message, category, sortOrder, icon } = req.body;
      
      if (!label || !message) {
        return res.status(400).json({ error: "Label and message required" });
      }
      
      const [response] = await db
        .insert(chatbotQuickResponses)
        .values({ label, message, category, sortOrder: sortOrder || 0, icon })
        .returning();
      
      res.json(response);
    } catch (error) {
      console.error("Error creating quick response:", error);
      res.status(500).json({ error: "Failed to create quick response" });
    }
  });
  
  app.patch("/api/admin/chatbot/quick-responses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      await db
        .update(chatbotQuickResponses)
        .set(updates)
        .where(eq(chatbotQuickResponses.id, id));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating quick response:", error);
      res.status(500).json({ error: "Failed to update quick response" });
    }
  });
  
  app.delete("/api/admin/chatbot/quick-responses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      await db
        .delete(chatbotQuickResponses)
        .where(eq(chatbotQuickResponses.id, id));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quick response:", error);
      res.status(500).json({ error: "Failed to delete quick response" });
    }
  });

  // ServiceTitan Customer Portal Routes
  
  // Helper function to mask email address (e.g., "j***@example.com")
  function maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return email; // Invalid email format
    
    if (localPart.length <= 1) {
      return `${localPart}***@${domain}`;
    }
    
    const firstChar = localPart[0];
    return `${firstChar}***@${domain}`;
  }
  
  // Phone-based login: Look up customer email by phone number
  app.post("/api/portal/auth/lookup-by-phone", async (req, res) => {
    try {
      console.log("[Portal Phone Auth] === PHONE LOOKUP REQUEST RECEIVED ===");
      console.log("[Portal Phone Auth] Request body:", JSON.stringify(req.body));
      
      const { phone } = req.body;

      if (!phone) {
        console.log("[Portal Phone Auth] ERROR: No phone number provided in request");
        return res.status(400).json({ error: "Phone number required" });
      }

      console.log("[Portal Phone Auth] Raw phone from request:", phone);
      const normalizedPhone = phone.replace(/\D/g, ''); // Remove all non-digits
      console.log("[Portal Phone Auth] Normalized phone:", normalizedPhone);

      const { contactsXlsx } = await import('@shared/schema');
      
      // Search for phone in contacts_xlsx (handles comma-separated values)
      console.log("[Portal Phone Auth] Querying database for phone:", normalizedPhone);
      
      // Search using LIKE for comma-separated values and exact match
      const contacts = await db
        .select()
        .from(contactsXlsx)
        .where(
          and(
            eq(contactsXlsx.contactType, 'Phone'),
            or(
              sql`${contactsXlsx.normalizedValue} = ${normalizedPhone}`,
              sql`${contactsXlsx.normalizedValue} LIKE ${'%,' + normalizedPhone + ',%'}`,
              sql`${contactsXlsx.normalizedValue} LIKE ${normalizedPhone + ',%'}`,
              sql`${contactsXlsx.normalizedValue} LIKE ${'%,' + normalizedPhone}`
            )
          )
        )
        .limit(1);

      console.log("[Portal Phone Auth] Database query returned", contacts.length, "contacts");
      
      if (contacts.length === 0) {
        console.log("[Portal Phone Auth] ERROR: No contacts found for phone:", normalizedPhone);
        return res.status(404).json({ error: "No account found with this phone number" });
      }
      
      console.log("[Portal Phone Auth] Found contact:", {
        customerId: contacts[0].customerId,
        contactType: contacts[0].contactType,
        value: contacts[0].value
      });

      const phoneContact = contacts[0];
      
      // Now find the email for this customer
      console.log("[Portal Phone Auth] Looking for email for customer ID:", phoneContact.customerId);
      
      const emailContacts = await db
        .select()
        .from(contactsXlsx)
        .where(
          and(
            eq(contactsXlsx.customerId, phoneContact.customerId),
            eq(contactsXlsx.contactType, 'Email')
          )
        )
        .limit(1);

      console.log("[Portal Phone Auth] Found", emailContacts.length, "email contacts");

      if (emailContacts.length === 0) {
        console.log("[Portal Phone Auth] ERROR: No email found for customer", phoneContact.customerId);
        return res.status(404).json({ 
          error: "No email address found for this account. Please contact us directly." 
        });
      }

      const emailContact = emailContacts[0];
      // Handle comma-separated emails - take the first one
      const emails = emailContact.value.split(',').map(e => e.trim());
      const primaryEmail = emails[0];

      console.log("[Portal Phone Auth] Primary email:", primaryEmail);
      console.log("[Portal Phone Auth] Creating lookup token for customer", phoneContact.customerId);

      // Store lookup in session/temporary cache for verification
      // SECURITY: Never send actual email to frontend
      const lookupToken = crypto.randomUUID();
      const { phoneLoginLookups } = await import('@shared/schema');
      
      // Store lookup result temporarily (5 minutes)
      await db.insert(phoneLoginLookups).values({
        lookupToken,
        phone: normalizedPhone,
        email: primaryEmail,
        customerId: phoneContact.customerId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      });

      console.log("[Portal Phone Auth] Lookup token created:", lookupToken);

      // Return ONLY masked email and lookup token
      const maskedEmail = maskEmail(primaryEmail);
      
      console.log("[Portal Phone Auth] SUCCESS - Returning masked email:", maskedEmail);
      
      res.json({ 
        maskedEmail,
        lookupToken, // Frontend uses this to request magic link
      });
    } catch (error: any) {
      console.error("[Portal Phone Auth] CRITICAL ERROR in lookup:", error);
      console.error("[Portal Phone Auth] Error stack:", error.stack);
      res.status(500).json({ error: "Failed to lookup account" });
    }
  });

  // Phone-based login: Send magic link to email (server-side email retrieval)
  app.post("/api/portal/auth/send-phone-magic-link", async (req, res) => {
    try {
      const { lookupToken } = req.body;

      if (!lookupToken) {
        return res.status(400).json({ error: "Lookup token required" });
      }

      console.log("[Portal Phone Auth] Sending magic link for token:", lookupToken);

      const { phoneLoginLookups } = await import('@shared/schema');
      const { portalVerifications } = await import('@shared/schema');
      
      // Retrieve the stored lookup (server-side only)
      const lookups = await db
        .select()
        .from(phoneLoginLookups)
        .where(
          and(
            eq(phoneLoginLookups.lookupToken, lookupToken),
            sql`${phoneLoginLookups.expiresAt} > NOW()`
          )
        )
        .limit(1);

      if (lookups.length === 0) {
        return res.status(404).json({ error: "Lookup expired or invalid. Please try again." });
      }

      const lookup = lookups[0];
      const { email, customerId } = lookup;

      // Generate magic link token
      const uuid = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store verification
      await db.insert(portalVerifications).values({
        customerIds: [customerId],
        contactValue: email,
        verificationType: 'email',
        code: uuid,
        expiresAt,
      });

      // Send magic link email
      const { sendEmail } = await import('./email');
      const magicLink = `${req.protocol}://${req.get('host')}/customer-portal?token=${uuid}`;
      
      await sendEmail({
        to: email,
        subject: 'Your Customer Portal Access Link',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1d4ed8;">Customer Portal Access</h2>
            <p>Click the link below to access your customer portal:</p>
            <p style="margin: 30px 0;">
              <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #1d4ed8; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Access Your Portal</a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this link, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Economy Plumbing Services<br>
              Austin, Texas
            </p>
          </div>
        `,
        tags: [
          { name: 'type', value: 'portal-magic-link' },
          { name: 'phone-login', value: 'true' },
        ],
      });

      console.log("[Portal Phone Auth] Magic link sent successfully");

      res.json({ 
        success: true,
        message: `Magic link sent to ${maskEmail(email)}`,
        maskedEmail: maskEmail(email),
      });
    } catch (error: any) {
      console.error("[Portal Phone Auth] Send link error:", error);
      res.status(500).json({ error: "Failed to send magic link" });
    }
  });
  
  // Verify account number and send verification code
  app.post("/api/portal/auth/verify-account", async (req, res) => {
    try {
      const { customerId } = req.body;

      if (!customerId) {
        return res.status(400).json({ error: "Customer ID required" });
      }

      console.log("[Portal Auth] Verifying account:", customerId);

      // Get customer from ServiceTitan to verify it exists
      const { getServiceTitanAPI } = await import('./lib/serviceTitan');
      const serviceTitan = getServiceTitanAPI();
      
      const customer = await serviceTitan.getCustomer(parseInt(customerId));
      if (!customer) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Get customer contacts to find email/phone
      const contacts = await serviceTitan.getCustomerContacts(parseInt(customerId));
      
      // Find email or phone for verification
      const emailContact = contacts.find((c: any) => c.type?.toLowerCase().includes('email'));
      const phoneContact = contacts.find((c: any) => 
        c.type?.toLowerCase().includes('phone') || c.type?.toLowerCase().includes('mobile')
      );

      let verificationType: 'sms' | 'email' = 'email';
      let contactValue: string;
      
      if (phoneContact?.value) {
        verificationType = 'sms';
        contactValue = phoneContact.value;
      } else if (emailContact?.value) {
        verificationType = 'email';
        contactValue = emailContact.value;
      } else {
        return res.status(400).json({ 
          error: "No email or phone found for this account. Please contact us directly." 
        });
      }

      // Generate verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const uuid = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + (verificationType === 'sms' ? 15 * 60 * 1000 : 60 * 60 * 1000));

      // Store verification
      const { portalVerifications } = await import('@shared/schema');
      await db.insert(portalVerifications).values({
        customerIds: [parseInt(customerId)],
        contactValue,
        verificationType,
        code: verificationType === 'sms' ? code : uuid,
        expiresAt,
      });

      // Send verification
      if (verificationType === 'sms') {
        const { sendSMS } = await import('./lib/sms');
        await sendSMS({
          to: contactValue,
          message: `Your Economy Plumbing customer portal verification code is: ${code}. Valid for 15 minutes.`,
        });
        console.log("[Portal Auth] SMS sent to", contactValue);
        res.json({ 
          message: `A 6-digit verification code has been sent to ${contactValue.replace(/.(?=.{4})/g, '*')}`,
          verificationType: 'sms'
        });
      } else {
        const { sendEmail } = await import('./email');
        const magicLink = `${req.protocol}://${req.get('host')}/customer-portal?token=${uuid}`;
        
        await sendEmail({
          to: contactValue,
          subject: 'Your Customer Portal Access Link',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Customer Portal Access</h2>
              <p>Click the link below to access your customer portal:</p>
              <p><a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #1d4ed8; color: white; text-decoration: none; border-radius: 5px;">Access Portal</a></p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          `,
        });
        console.log("[Portal Auth] Email sent to", contactValue);
        res.json({ 
          message: `A verification link has been sent to ${contactValue.replace(/(.{3})(.*)(@.*)/, '$1***$3')}`,
          verificationType: 'email'
        });
      }
    } catch (error: any) {
      console.error("[Portal Auth] Account verification error:", error);
      res.status(500).json({ error: "Failed to verify account" });
    }
  });

  // Customer Portal Session - Check existing session
  app.get("/api/portal/session", (req, res) => {
    // Check if user has an active portal session
    if (req.session && req.session.portalCustomerId) {
      res.json({ 
        customerId: req.session.portalCustomerId,
        availableCustomerIds: req.session.portalAvailableCustomerIds || [req.session.portalCustomerId]
      });
    } else {
      res.status(401).json({ error: "No active session" });
    }
  });

  // Customer Portal Session - Logout
  app.post("/api/portal/logout", (req, res) => {
    if (req.session) {
      req.session.portalCustomerId = undefined;
      req.session.save((err) => {
        if (err) {
          console.error("[Portal] Session save error during logout:", err);
        }
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });

  // Send verification code (SMS or email magic link)
  app.post("/api/portal/auth/send-code", async (req, res) => {
    try {
      const { contactValue, verificationType } = req.body;

      if (!contactValue || !verificationType) {
        return res.status(400).json({ error: "Contact value and verification type required" });
      }

      if (!['sms', 'email'].includes(verificationType)) {
        return res.status(400).json({ error: "Invalid verification type" });
      }

      console.log(`[Portal Auth] Sending ${verificationType} verification to:`, contactValue);

      // Check if ServiceTitan is configured
      const tenantId = process.env.SERVICETITAN_TENANT_ID;
      const clientId = process.env.SERVICETITAN_CLIENT_ID;
      const clientSecret = process.env.SERVICETITAN_CLIENT_SECRET;
      const appKey = process.env.SERVICETITAN_APP_KEY;

      if (!tenantId || !clientId || !clientSecret || !appKey) {
        return res.status(503).json({ error: "ServiceTitan integration not configured" });
      }

      const { getServiceTitanAPI } = await import("./lib/serviceTitan");
      const serviceTitan = getServiceTitanAPI();

      // Search ONLY in local synced cache - DO NOT create customers on-demand
      const searchValue = contactValue;
      const customerIds = await serviceTitan.searchLocalCustomer(searchValue);

      if (customerIds.length === 0) {
        console.log("[Portal Auth] No customer found in synced database");
        return res.status(404).json({ 
          error: "We couldn't find an account with that email or phone number. Please verify your information or contact us at (512) 396-7811 for assistance.",
          found: false 
        });
      }

      console.log(`[Portal Auth] Found ${customerIds.length} customer account(s) in cache:`, customerIds);

      // Generate verification code or token
      const code = verificationType === 'sms' 
        ? Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
        : crypto.randomUUID(); // UUID token for email magic link

      // Set expiry time (10 min for SMS, 1 hour for email)
      const expiryMinutes = verificationType === 'sms' ? 10 : 60;
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Store verification in database
      const { portalVerifications } = await import("@shared/schema");
      await db.insert(portalVerifications).values({
        verificationType,
        contactValue,
        code,
        customerIds, // Now storing array of customer IDs
        expiresAt,
      });

      console.log("[Portal Auth] Verification code created, expiring in", expiryMinutes, "minutes");

      // Send verification based on type
      if (verificationType === 'sms') {
        // Send SMS code
        try {
          const { sendSMS } = await import("./lib/sms");
          
          // Format phone number to E.164 format (add +1 for US numbers if not present)
          let formattedPhone = contactValue.replace(/\D/g, ''); // Remove non-digits
          if (formattedPhone.length === 10) {
            formattedPhone = '+1' + formattedPhone; // US number
          } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
            formattedPhone = '+' + formattedPhone;
          } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
          } else {
            formattedPhone = '+' + formattedPhone;
          }
          
          console.log("[Portal Auth] Sending SMS to formatted number:", formattedPhone);
          
          const message = `Your Economy Plumbing verification code is: ${code}\n\nThis code expires in 10 minutes.`;
          await sendSMS({ to: formattedPhone, message });
          console.log("[Portal Auth] SMS sent successfully");
          
          return res.json({ 
            success: true, 
            message: "Verification code sent via SMS",
            expiresIn: expiryMinutes * 60 // seconds
          });
        } catch (error) {
          console.error("[Portal Auth] SMS send failed:", error);
          return res.status(500).json({ error: "Failed to send SMS verification code" });
        }
      } else if (verificationType === 'email') {
        // Send email magic link
        try {
          const { sendEmail } = await import("./email");
          const magicLink = `${req.protocol}://${req.get('host')}/customer-portal?token=${code}`;
          
          await sendEmail({
            to: contactValue,
            subject: "Access Your Customer Portal - Economy Plumbing",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #0066cc; padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Economy Plumbing Services</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9;">
                  <h2>Access Your Customer Portal</h2>
                  <p>Click the button below to securely access your customer portal:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${magicLink}" style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                      Access Portal
                    </a>
                  </div>
                  <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                  <p style="background-color: #fff; padding: 10px; border-left: 4px solid #0066cc; word-break: break-all; font-size: 13px;">
                    ${magicLink}
                  </p>
                  <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    This link expires in 1 hour. If you didn't request this, please ignore this email.
                  </p>
                </div>
                <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
                  <p>Economy Plumbing Services<br>
                  Austin & Marble Falls, Texas<br>
                  (512) 396-7811</p>
                </div>
              </body>
              </html>
            `,
          });
          
          console.log("[Portal Auth] Email magic link sent successfully");
          
          return res.json({ 
            success: true, 
            message: "Magic link sent to your email",
            expiresIn: expiryMinutes * 60 // seconds
          });
        } catch (error) {
          console.error("[Portal Auth] Email send failed:", error);
          return res.status(500).json({ error: "Failed to send email magic link" });
        }
      }
    } catch (error: any) {
      console.error("[Portal Auth] Send code error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to send verification code",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Verify code and return customer ID
  app.post("/api/portal/auth/verify-code", async (req, res) => {
    try {
      const { contactValue, code } = req.body;

      if (!code) {
        return res.status(400).json({ error: "Verification code required" });
      }

      console.log("[Portal Auth] Verifying code:", code.substring(0, 6) + "...");

      const { portalVerifications } = await import("@shared/schema");
      const { eq, and, or } = await import("drizzle-orm");

      // First, check if the code exists at all (regardless of verified status)
      const allVerificationsWithCode = await db
        .select()
        .from(portalVerifications)
        .where(eq(portalVerifications.code, code))
        .limit(1);

      if (allVerificationsWithCode.length === 0) {
        console.log("[Portal Auth] Code not found in database");
        return res.status(401).json({ 
          error: "This link is invalid. Please request a new one." 
        });
      }

      const existingVerification = allVerificationsWithCode[0];

      // Check if already verified
      if (existingVerification.verified) {
        console.log("[Portal Auth] Code already used");
        return res.status(401).json({ 
          error: "This link has already been used. Please request a new one if you need to sign in again." 
        });
      }

      // Find unverified verification record
      const whereClause = contactValue
        ? and(
            eq(portalVerifications.contactValue, contactValue),
            eq(portalVerifications.code, code),
            eq(portalVerifications.verified, false)
          )
        : and(
            eq(portalVerifications.code, code),
            eq(portalVerifications.verified, false)
          );

      const verifications = await db
        .select()
        .from(portalVerifications)
        .where(whereClause)
        .limit(1);

      if (verifications.length === 0) {
        console.log("[Portal Auth] Invalid code");
        return res.status(401).json({ 
          error: "Invalid verification code. Please check and try again." 
        });
      }

      const verification = verifications[0];

      // Check if expired - with detailed logging
      const now = new Date();
      const expiresAt = new Date(verification.expiresAt);
      console.log("[Portal Auth] Expiration check:", {
        now: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        nowTimestamp: now.getTime(),
        expiresAtTimestamp: expiresAt.getTime(),
        isExpired: now > expiresAt,
        minutesUntilExpiry: (expiresAt.getTime() - now.getTime()) / (1000 * 60)
      });
      
      if (now > expiresAt) {
        console.log("[Portal Auth] Code expired");
        return res.status(401).json({ error: "Verification code expired. Please request a new one." });
      }

      // Check attempts (max 5) - only for SMS codes, not magic links
      if (verification.verificationType === 'sms' && verification.attempts >= 5) {
        console.log("[Portal Auth] Too many attempts");
        return res.status(429).json({ error: "Too many failed attempts. Please request a new code." });
      }

      // Mark as verified
      await db
        .update(portalVerifications)
        .set({ 
          verified: true, 
          verifiedAt: new Date() 
        })
        .where(eq(portalVerifications.id, verification.id));

      console.log("[Portal Auth] Verification successful, looking up customer accounts...");

      // Use the customer IDs that were stored during verification
      // This is more reliable than re-looking up via contacts table
      const customerIds = verification.customerIds;
      console.log(`[Portal Auth] Using stored customer IDs:`, customerIds);

      if (!customerIds || customerIds.length === 0) {
        console.error("[Portal Auth] No customer IDs in verification record");
        return res.status(500).json({ 
          error: "Verification record is missing customer information. Please try again.",
          code: "MISSING_CUSTOMER_IDS"
        });
      }

      // Import schemas
      const { customersXlsx, contactsXlsx } = await import("@shared/schema");
      const { inArray } = await import("drizzle-orm");

      // Fetch complete customer data with ALL contacts for each customer
      const customersData = await db
        .select()
        .from(customersXlsx)
        .where(inArray(customersXlsx.id, customerIds));

      // Fetch ALL contacts for these customers
      const allContacts = await db
        .select()
        .from(contactsXlsx)
        .where(inArray(contactsXlsx.customerId, customerIds));

      // Group contacts by customer ID
      const contactsByCustomer = allContacts.reduce((acc, contact) => {
        if (!acc[contact.customerId]) acc[contact.customerId] = [];
        acc[contact.customerId].push(contact);
        return acc;
      }, {} as Record<number, any[]>);

      // Build complete customer objects with ALL contact methods
      const matchingCustomers = customersData.map(customer => {
        const customerContacts = contactsByCustomer[customer.id] || [];
        const emails = customerContacts.filter(c => c.contactType === 'Email').map(c => c.value);
        const phones = customerContacts.filter(c => c.contactType.includes('Phone')).map(c => c.value);
        
        return {
          id: customer.id,
          name: customer.name,
          type: customer.type,
          emails, // ALL emails
          phones, // ALL phones
          primaryEmail: emails[0] || customer.email || '',
          primaryPhone: phones[0] || customer.phone || '',
          address: [customer.street, customer.city, customer.state, customer.zip].filter(Boolean).join(', ')
        };
      });

      console.log(`[Portal Auth] Found ${matchingCustomers.length} matching customer account(s) with complete contact info`);

      // Save session for persistent login
      if (req.session) {
        // Store all available customer IDs for account switching
        req.session.portalAvailableCustomerIds = matchingCustomers.map(c => c.id);
        
        // Auto-select if only one account
        if (matchingCustomers.length === 1) {
          req.session.portalCustomerId = matchingCustomers[0].id;
        }
        
        await new Promise<void>((resolve, reject) => {
          req.session!.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log(`[Portal Auth] Session saved - available accounts: ${matchingCustomers.length}`);
      }

      return res.json({ 
        success: true,
        customerId: matchingCustomers[0].id, // For backward compatibility
        customers: matchingCustomers,
        multipleAccounts: matchingCustomers.length > 1
      });
    } catch (error: any) {
      console.error("[Portal Auth] Verify code error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to verify code",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Switch between multiple customer accounts
  app.post("/api/portal/switch-account", async (req, res) => {
    try {
      const { customerId } = req.body;

      if (!customerId) {
        return res.status(400).json({ error: "Customer ID required" });
      }

      // Check if user has an active session
      if (!req.session || !req.session.portalAvailableCustomerIds) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const targetCustomerId = parseInt(customerId);

      // Validate that user has access to this account
      if (!req.session.portalAvailableCustomerIds.includes(targetCustomerId)) {
        console.log(`[Portal] Account switch denied - Customer ${targetCustomerId} not in available accounts:`, req.session.portalAvailableCustomerIds);
        return res.status(403).json({ error: "Access denied to this account" });
      }

      // Switch to the new account
      req.session.portalCustomerId = targetCustomerId;
      
      await new Promise<void>((resolve, reject) => {
        req.session!.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`[Portal] Account switched to customer ${targetCustomerId}`);

      return res.json({ 
        success: true,
        customerId: targetCustomerId
      });
    } catch (error: any) {
      console.error("[Portal] Switch account error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to switch account"
      });
    }
  });

  // Get available arrival windows from ServiceTitan
  app.get("/api/servicetitan/arrival-windows", async (req, res) => {
    try {
      console.log('[Portal] Fetching arrival windows from ServiceTitan');

      // Get ServiceTitan API
      const { ServiceTitanAPI } = await import("./lib/serviceTitan");
      const serviceTitan = new ServiceTitanAPI({
        tenantId: process.env.SERVICETITAN_TENANT_ID!,
        clientId: process.env.SERVICETITAN_CLIENT_ID!,
        clientSecret: process.env.SERVICETITAN_CLIENT_SECRET!,
        appKey: process.env.SERVICETITAN_APP_KEY!,
      });

      const windows = await serviceTitan.getArrivalWindows();
      
      console.log(`[Portal] Found ${windows.length} arrival windows`);
      
      res.json({ windows });
    } catch (error: any) {
      console.error("[Portal] Get arrival windows error:", error);
      res.status(500).json({ error: "Failed to fetch arrival windows" });
    }
  });

  // Reschedule appointment
  app.post("/api/portal/reschedule-appointment", async (req, res) => {
    try {
      const { appointmentId, newStart, newEnd, customerId } = req.body;

      if (!appointmentId || !newStart || !newEnd || !customerId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      console.log(`[Portal] Reschedule request for appointment ${appointmentId}`);

      // Get ServiceTitan API
      const { ServiceTitanAPI } = await import("./lib/serviceTitan");
      const serviceTitan = new ServiceTitanAPI({
        tenantId: process.env.SERVICETITAN_TENANT_ID!,
        clientId: process.env.SERVICETITAN_CLIENT_ID!,
        clientSecret: process.env.SERVICETITAN_CLIENT_SECRET!,
        appKey: process.env.SERVICETITAN_APP_KEY!,
      });

      // Reschedule the appointment
      const updatedAppointment = await serviceTitan.rescheduleAppointment(
        parseInt(appointmentId),
        newStart,
        newEnd
      );

      console.log(`[Portal] Appointment ${appointmentId} rescheduled successfully`);

      res.json({ 
        success: true, 
        appointment: updatedAppointment,
        message: "Appointment rescheduled successfully"
      });
    } catch (error: any) {
      console.error("[Portal] Reschedule appointment error:", error);
      
      // Check if it's an invoiced appointment error
      if (error.message && error.message.includes('invoice')) {
        return res.status(400).json({ 
          error: "This appointment cannot be rescheduled because it has been invoiced. Please call us to reschedule." 
        });
      }
      
      res.status(500).json({ error: "Failed to reschedule appointment. Please try again or call us for assistance." });
    }
  });

  // Request PDF for invoice or estimate
  app.post("/api/portal/request-pdf", async (req, res) => {
    try {
      const { type, number, id, customerId, customerName, customerEmail } = req.body;

      if (!type || !number || !id) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      console.log(`[Portal] PDF request received: ${type} #${number} for customer ${customerId}`);
      console.log(`[Portal] Customer details - Name: ${customerName}, Email: ${customerEmail}`);

      // Log to database for tracking
      const { db } = await import('./db');
      const { contactSubmissions } = await import('@shared/schema');
      
      // Create a simple log entry in the database
      await db.insert(contactSubmissions).values({
        name: customerName || 'Unknown',
        phone: 'PDF Request',
        email: customerEmail || 'no-email',
        service: `PDF Request: ${type} #${number}`,
        message: `Customer ID: ${customerId}\nType: ${type}\nNumber: ${number}\nID: ${id}\n\nPDF requested via Customer Portal`,
        pageContext: 'Customer Portal - PDF Request',
      });
      
      console.log(`[Portal] PDF request logged to database for ${type} #${number}`);

      // Try to send email notification if configured
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'cdd5d54b6e6c4413@teamchat.zoom.us';
        
        // Check if email service is configured
        const { sendEmail } = await import('./email');
        
        const subject = `Customer Portal: PDF Request for ${type} #${number}`;
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1d4ed8;">PDF Request from Customer Portal</h2>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
              <p><strong>Number:</strong> ${number}</p>
              <p><strong>ID:</strong> ${id}</p>
            </div>

            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1d4ed8; margin-top: 0;">Customer Information</h3>
              <p><strong>Customer ID:</strong> ${customerId}</p>
              <p><strong>Name:</strong> ${customerName || 'Not provided'}</p>
              <p><strong>Email:</strong> ${customerEmail || 'Not provided'}</p>
            </div>

            <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <p style="margin: 0;"><strong>Action Required:</strong> Please send the PDF for this ${type} to the customer.</p>
            </div>
          </div>
        `;

        await sendEmail({
          to: adminEmail,
          subject,
          html: htmlContent,
        });

        console.log(`[Portal] PDF request email sent to ${adminEmail} for ${type} #${number}`);
      } catch (emailError: any) {
        // Email failed but request was logged - still return success
        console.warn(`[Portal] Email notification failed (request still logged): ${emailError.message}`);
        console.log(`[Portal] PDF request saved to database despite email failure`);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("[Portal] PDF request error:", error);
      res.status(500).json({ error: "Failed to process PDF request" });
    }
  });

  app.get("/api/servicetitan/customer/search", async (req, res) => {
    try {
      const { phone, email } = req.query;

      console.log("[Customer Portal] Search request received - phone:", phone, "email:", email);

      if (!phone && !email) {
        return res.status(400).json({ error: "Phone or email required" });
      }

      // Check if ServiceTitan is configured
      const tenantId = process.env.SERVICETITAN_TENANT_ID;
      const clientId = process.env.SERVICETITAN_CLIENT_ID;
      const clientSecret = process.env.SERVICETITAN_CLIENT_SECRET;
      const appKey = process.env.SERVICETITAN_APP_KEY;

      if (!tenantId || !clientId || !clientSecret || !appKey) {
        console.error("[Customer Portal] ServiceTitan credentials missing!");
        return res.status(503).json({ error: "ServiceTitan integration not configured" });
      }

      console.log("[Customer Portal] ServiceTitan credentials found, initializing API...");

      const { getServiceTitanAPI } = await import("./lib/serviceTitan");
      const serviceTitan = getServiceTitanAPI();

      // Search for ALL matching customers (support multi-account)
      const searchValue = (phone as string) || (email as string);
      const searchType = phone ? 'phone' : 'email';
      console.log("[Customer Portal] Searching for all matching customers:", searchValue);
      
      const matchingCustomers = await serviceTitan.searchAllMatchingCustomers(searchValue);

      // Log search attempt for analytics
      try {
        const { portalAnalytics } = await import("@shared/schema");
        await db.insert(portalAnalytics).values({
          searchType,
          searchValue,
          found: matchingCustomers.length > 0,
          customerId: matchingCustomers.length > 0 ? matchingCustomers[0].id : undefined,
        });
        console.log("[Portal Analytics] Logged search:", { searchType, found: matchingCustomers.length > 0, count: matchingCustomers.length });
      } catch (error) {
        console.error("[Portal Analytics] Failed to log search:", error);
        // Non-fatal - continue with response
      }

      if (matchingCustomers.length === 0) {
        console.log("[Customer Portal] No customers found with provided credentials");
        return res.status(404).json({ 
          error: "Customer not found", 
          message: "No account found with the provided phone number or email address." 
        });
      }

      console.log(`[Customer Portal] Found ${matchingCustomers.length} matching customer(s)`);
      
      // Return all matching customers - frontend will handle selection if multiple
      res.json({ 
        customers: matchingCustomers,
        multipleAccounts: matchingCustomers.length > 1
      });
    } catch (error: any) {
      console.error("[Customer Portal] Search error:", error.message);
      console.error("[Customer Portal] Full error:", error);
      res.status(500).json({ error: "Failed to search for customer", details: error.message });
    }
  });

  app.get("/api/servicetitan/customer/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return res.status(400).json({ error: "Customer ID required" });
      }

      // Check if ServiceTitan is configured
      const tenantId = process.env.SERVICETITAN_TENANT_ID;
      const clientId = process.env.SERVICETITAN_CLIENT_ID;
      const clientSecret = process.env.SERVICETITAN_CLIENT_SECRET;
      const appKey = process.env.SERVICETITAN_APP_KEY;

      if (!tenantId || !clientId || !clientSecret || !appKey) {
        return res.status(503).json({ error: "ServiceTitan integration not configured" });
      }

      const { ServiceTitanAPI } = await import("./lib/serviceTitan");
      const serviceTitan = new ServiceTitanAPI({
        tenantId,
        clientId,
        clientSecret,
        appKey,
      });

      // Fetch customer, appointments, invoices, memberships, and estimates in parallel
      const [customer, appointments, invoices, memberships, estimates] = await Promise.all([
        serviceTitan.getCustomer(parseInt(customerId)),
        serviceTitan.getCustomerAppointments(parseInt(customerId)),
        serviceTitan.getCustomerInvoices(parseInt(customerId)),
        serviceTitan.getCustomerMemberships(parseInt(customerId)),
        serviceTitan.getCustomerEstimates(parseInt(customerId)),
      ]);

      res.json({
        customer,
        appointments,
        invoices,
        memberships,
        estimates,
      });
    } catch (error: any) {
      console.error("Customer data fetch error:", error);
      res.status(500).json({ error: "Failed to fetch customer data" });
    }
  });

  // Get customer email communication history
  // Commented out - email marketing tables removed
  // app.get("/api/portal/customer/:customerId/emails", async (req, res) => {
  //   try {
  //     res.json({ emails: [] });
  //   } catch (error: any) {
  //     console.error("[Portal] Email history error:", error);
  //     res.status(500).json({ error: "Failed to fetch email history" });
  //   }
  // });

  // ServiceTitan Customer Sync (Admin only - manual trigger)
  app.post("/api/servicetitan/sync-customers", async (req, res) => {
    try {
      // Fix auth check - use optional chaining
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      console.log("[ServiceTitan Sync] Manual sync triggered by admin");

      const { syncServiceTitanCustomers } = await import("./lib/serviceTitanSync");

      // Start sync in background to avoid timeout
      res.json({ message: "Customer sync started. Check server logs for progress." });

      // Run sync asynchronously
      syncServiceTitanCustomers()
        .then(() => {
          console.log(`[ServiceTitan Sync] ✅ Manual sync completed`);
        })
        .catch(error => {
          console.error(`[ServiceTitan Sync] ❌ Manual sync failed:`, error);
        });

    } catch (error: any) {
      console.error("[ServiceTitan Sync] Error:", error);
      res.status(500).json({ error: "Failed to start customer sync" });
    }
  });

  // Admin: Get ServiceTitan sync status
  app.get("/api/admin/sync-status", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { customersXlsx, contactsXlsx } = await import('@shared/schema');
      const { isSyncRunning } = await import('./lib/serviceTitanSync');

      // Get customer and contact counts
      const [customerCount, contactCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(customersXlsx),
        db.select({ count: sql<number>`count(*)` }).from(contactsXlsx)
      ]);

      // Get most recent sync timestamp
      const recentCustomer = await db.select({ lastSynced: customersXlsx.lastSyncedAt })
        .from(customersXlsx)
        .orderBy(sql`${customersXlsx.lastSyncedAt} DESC`)
        .limit(1);

      res.json({
        totalCustomers: Number(customerCount[0]?.count || 0),
        totalContacts: Number(contactCount[0]?.count || 0),
        lastSyncedAt: recentCustomer[0]?.lastSynced || null,
        isRunning: isSyncRunning(),
      });
    } catch (error: any) {
      console.error("[Admin] Sync status error:", error);
      res.status(500).json({ error: "Failed to fetch sync status" });
    }
  });

  // Admin: Manually trigger ServiceTitan sync
  app.post("/api/admin/trigger-sync", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { syncServiceTitanCustomers, resetSyncLock } = await import('./lib/serviceTitanSync');
      
      // Reset lock first (in case it's stuck)
      resetSyncLock();
      
      // Trigger sync in background
      syncServiceTitanCustomers().catch(error => {
        console.error("[Admin] Background sync error:", error);
      });
      
      res.json({ success: true, message: "Sync started (lock reset)" });
    } catch (error: any) {
      console.error("[Admin] Trigger sync error:", error);
      res.status(500).json({ error: "Failed to start sync" });
    }
  });

  // Get customer stats (service count and percentile ranking)
  // Uses LIVE API call for accurate job count, database for percentile ranking
  app.get("/api/portal/customer-stats/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return res.status(400).json({ error: "Customer ID required" });
      }

      console.log("[Portal] Fetching customer stats for:", customerId);

      // Get LIVE job count from ServiceTitan API
      const { getServiceTitanAPI } = await import('./lib/serviceTitan');
      const serviceTitan = getServiceTitanAPI();
      
      // Fetch all jobs for this customer from API
      const jobs = await serviceTitan.getCustomerJobs(parseInt(customerId));
      
      // Count only COMPLETED jobs to match what the sync does
      const completedJobs = jobs.filter(job => 
        job.status === 'Completed' && job.completedOn !== null
      );
      const serviceCount = completedJobs.length;
      
      console.log(`[Portal] Customer ${customerId}: Found ${jobs.length} total jobs, ${serviceCount} completed`);

      // Don't show stats if customer has 0 completed services
      if (serviceCount === 0) {
        console.log(`[Portal] Customer ${customerId} has 0 completed services`);
        return res.json({ serviceCount: 0, topPercentile: null });
      }

      // Calculate percentile ranking using database for performance
      // (Can't make 11,000+ API calls for comparison)
      const { customersXlsx } = await import('@shared/schema');
      const { gt, count } = await import('drizzle-orm');
      
      // Get total number of customers with at least 1 service in the database
      const [totalResult] = await db
        .select({ 
          total: count(),
        })
        .from(customersXlsx)
        .where(gt(customersXlsx.jobCount, 0));

      const totalCustomersWithService = totalResult.total || 0;

      // If the database hasn't been populated with job data yet, don't show misleading percentiles
      if (totalCustomersWithService === 0) {
        console.log(`[Portal] Customer ${customerId}: Job sync hasn't run yet, skipping percentile calculation`);
        return res.json({ 
          serviceCount, 
          topPercentile: null  // Don't show percentile if database is empty
        });
      }
      
      // Count how many customers have MORE services than this customer
      const [result] = await db
        .select({ 
          total: count(),
        })
        .from(customersXlsx)
        .where(gt(customersXlsx.jobCount, serviceCount));

      const customersWithMore = result.total || 0;

      // Calculate percentile (inverted - lower number = better rank)
      // If 4 out of 100 customers have more services, you're in the top 4%
      const topPercentile = Math.min(99, Math.round((customersWithMore / totalCustomersWithService) * 100)); // Cap at 99% to prevent "Better than 100%"

      console.log(`[Portal] Customer ${customerId}: ${serviceCount} completed services, ${customersWithMore}/${totalCustomersWithService} customers have more → Top ${topPercentile}%`);

      res.json({
        serviceCount,
        topPercentile, // e.g., "top 4%" means only 4% of customers have more services
      });
    } catch (error: any) {
      console.error("[Portal] Customer stats error:", error);
      res.status(500).json({ error: "Failed to fetch customer stats" });
    }
  });

  // Update customer contact information
  app.put("/api/portal/update-contacts", async (req, res) => {
    try {
      const { customerId, email, phone } = req.body;

      if (!customerId) {
        return res.status(400).json({ error: "Customer ID required" });
      }

      console.log(`[Portal] Updating contacts for customer ${customerId}...`);

      const { getServiceTitanAPI } = await import("./lib/serviceTitan");
      const serviceTitan = getServiceTitanAPI();

      await serviceTitan.updateCustomerContacts(parseInt(customerId), {
        email,
        phone
      });

      res.json({ success: true, message: "Contact information updated successfully" });
    } catch (error: any) {
      console.error("[Portal] Update contacts error:", error);
      res.status(500).json({ error: error.message || "Failed to update contact information" });
    }
  });

  // Delete customer contact
  app.delete("/api/portal/delete-contact", async (req, res) => {
    try {
      const { customerId, contactId } = req.body;

      if (!customerId || !contactId) {
        return res.status(400).json({ error: "Customer ID and Contact ID required" });
      }

      console.log(`[Portal] Deleting contact ${contactId} for customer ${customerId}...`);

      const { getServiceTitanAPI } = await import("./lib/serviceTitan");
      const serviceTitan = getServiceTitanAPI();

      await serviceTitan.deleteCustomerContact(parseInt(customerId), parseInt(contactId));

      res.json({ success: true, message: "Contact deleted successfully" });
    } catch (error: any) {
      console.error("[Portal] Delete contact error:", error);
      res.status(500).json({ error: error.message || "Failed to delete contact" });
    }
  });

  // Update service address (location)
  app.put("/api/portal/update-address", async (req, res) => {
    try {
      const { customerId, locationId, street, city, state, zip } = req.body;

      if (!customerId || !locationId) {
        return res.status(400).json({ error: "Customer ID and Location ID required" });
      }

      if (!street || !city || !state || !zip) {
        return res.status(400).json({ error: "All address fields are required" });
      }

      console.log(`[Portal] Updating address for location ${locationId}...`);

      const { getServiceTitanAPI } = await import("./lib/serviceTitan");
      const serviceTitan = getServiceTitanAPI();

      await serviceTitan.updateLocation(parseInt(locationId), {
        street,
        city,
        state,
        zip
      });

      res.json({ success: true, message: "Service address updated successfully" });
    } catch (error: any) {
      console.error("[Portal] Update address error:", error);
      res.status(500).json({ error: error.message || "Failed to update service address" });
    }
  });

  // Get customer's primary location
  app.get("/api/portal/customer-location/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return res.status(400).json({ error: "Customer ID required" });
      }

      console.log(`[Portal] Fetching location for customer ${customerId}...`);

      const { getServiceTitanAPI } = await import("./lib/serviceTitan");
      const serviceTitan = getServiceTitanAPI();

      const location = await serviceTitan.getCustomerPrimaryLocation(parseInt(customerId));

      if (!location) {
        return res.status(404).json({ error: "No location found for customer" });
      }

      res.json({ location });
    } catch (error: any) {
      console.error("[Portal] Get location error:", error);
      res.status(500).json({ error: "Failed to fetch customer location" });
    }
  });

  // Get ALL customer locations (for multi-location display)
  app.get("/api/portal/customer-locations/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return res.status(400).json({ error: "Customer ID required" });
      }

      // Check session authentication
      if (!req.session?.portalCustomerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      console.log(`[Portal] Fetching all locations for customer ${customerId}...`);

      const { getServiceTitanAPI } = await import("./lib/serviceTitan");
      const serviceTitan = getServiceTitanAPI();

      const locations = await serviceTitan.getAllCustomerLocations(parseInt(customerId));

      res.json({ locations });
    } catch (error: any) {
      console.error("[Portal] Get all locations error:", error);
      res.status(500).json({ error: "Failed to fetch customer locations" });
    }
  });

  // Customer Leaderboard - Top customers by service usage
  // TODO: Re-implement for refer-a-friend page using actual ServiceTitan job/appointment data
  app.get("/api/customer-leaderboard", async (req, res) => {
    try {
      // Placeholder until we implement proper leaderboard with ServiceTitan job data
      res.json({ leaderboard: [] });
    } catch (error: any) {
      console.error("[Leaderboard] Error:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Admin: Get Customer Portal analytics
  app.get("/api/admin/portal-stats", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { portalAnalytics } = await import("@shared/schema");

      // Count total searches
      const totalSearchesResult = await db.select({ count: sql<number>`count(*)` })
        .from(portalAnalytics);
      const totalSearches = Number(totalSearchesResult[0]?.count || 0);

      // Count successful searches (found customers)
      const foundSearchesResult = await db.select({ count: sql<number>`count(*)` })
        .from(portalAnalytics)
        .where(sql`${portalAnalytics.found} = true`);
      const totalCustomers = Number(foundSearchesResult[0]?.count || 0);

      // Get recent searches (last 10)
      const recentSearches = await db.select({
        id: portalAnalytics.id,
        searchType: portalAnalytics.searchType,
        searchValue: portalAnalytics.searchValue,
        found: portalAnalytics.found,
        timestamp: portalAnalytics.timestamp,
      })
        .from(portalAnalytics)
        .orderBy(sql`${portalAnalytics.timestamp} DESC`)
        .limit(10);

      res.json({
        totalSearches,
        totalCustomers,
        recentSearches,
      });
    } catch (error: any) {
      console.error("[Admin] Portal stats error:", error);
      res.status(500).json({ error: "Failed to fetch portal stats" });
    }
  });

  // Test SMS endpoint
  app.post("/api/test-sms", async (req, res) => {
    try {
      const { to, message } = req.body;
      
      if (!to) {
        return res.status(400).json({ error: "Phone number required" });
      }
      
      const { sendSMS } = await import("./lib/sms");
      const testMessage = message || "Test message from Economy Plumbing Services - Zoom Phone SMS integration is working! 🎉";
      
      await sendSMS({ to, message: testMessage });
      
      res.json({ success: true, message: "SMS sent successfully" });
    } catch (error: any) {
      console.error("[Test SMS] Error:", error);
      res.status(500).json({ error: error.message || "Failed to send SMS" });
    }
  });

  // ===== EMAIL PREFERENCES & SUPPRESSION =====

  // Get email preferences by token (public - no auth required)
  app.get("/api/email-preferences/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { emailPreferences } = await import('@shared/schema');
      
      const [prefs] = await db
        .select()
        .from(emailPreferences)
        .where(sql`${emailPreferences.unsubscribeToken} = ${token}`)
        .limit(1);
      
      if (!prefs) {
        return res.status(404).json({ message: "Preferences not found" });
      }
      
      res.json({ preferences: prefs });
    } catch (error: any) {
      console.error('[Email Preferences] Error fetching preferences:', error);
      res.status(500).json({ message: "Error fetching preferences" });
    }
  });

  // Update email preferences by token (public - no auth required)
  app.put("/api/email-preferences/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { marketingEmails, reviewRequests, referralEmails, serviceReminders, transactionalOnly } = req.body;
      const { emailPreferences } = await import('@shared/schema');
      
      // Find existing preferences
      const [existing] = await db
        .select()
        .from(emailPreferences)
        .where(sql`${emailPreferences.unsubscribeToken} = ${token}`)
        .limit(1);
      
      if (!existing) {
        return res.status(404).json({ message: "Preferences not found" });
      }
      
      // Check if they're opting out of everything
      const allOptedOut = !marketingEmails && !reviewRequests && !referralEmails && !serviceReminders;
      const anyOptedOut = !marketingEmails || !reviewRequests || !referralEmails || !serviceReminders;
      
      // Update preferences
      const [updated] = await db
        .update(emailPreferences)
        .set({
          marketingEmails: marketingEmails ?? existing.marketingEmails,
          reviewRequests: reviewRequests ?? existing.reviewRequests,
          referralEmails: referralEmails ?? existing.referralEmails,
          serviceReminders: serviceReminders ?? existing.serviceReminders,
          transactionalOnly: transactionalOnly ?? existing.transactionalOnly,
          optedOutAt: anyOptedOut && !existing.optedOutAt ? new Date() : existing.optedOutAt,
          fullyUnsubscribedAt: allOptedOut ? new Date() : null,
          lastUpdated: new Date(),
        })
        .where(sql`${emailPreferences.unsubscribeToken} = ${token}`)
        .returning();
      
      console.log(`[Email Preferences] Updated preferences for ${updated.email}`);
      res.json({ 
        success: true,
        preferences: updated,
        message: allOptedOut 
          ? "You've been unsubscribed from all emails" 
          : "Your email preferences have been updated"
      });
    } catch (error: any) {
      console.error('[Email Preferences] Error updating preferences:', error);
      res.status(500).json({ message: "Error updating preferences" });
    }
  });

  // One-click unsubscribe (public - no auth required)
  app.post("/api/email-preferences/:token/unsubscribe-all", async (req, res) => {
    try {
      const { token } = req.params;
      const { emailPreferences } = await import('@shared/schema');
      
      const [updated] = await db
        .update(emailPreferences)
        .set({
          marketingEmails: false,
          reviewRequests: false,
          referralEmails: false,
          serviceReminders: false,
          transactionalOnly: true,
          optedOutAt: new Date(),
          fullyUnsubscribedAt: new Date(),
          lastUpdated: new Date(),
        })
        .where(sql`${emailPreferences.unsubscribeToken} = ${token}`)
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Preferences not found" });
      }
      
      console.log(`[Email Preferences] Unsubscribed ${updated.email} from all emails`);
      res.json({ 
        success: true,
        message: "You've been unsubscribed from all emails"
      });
    } catch (error: any) {
      console.error('[Email Preferences] Error unsubscribing:', error);
      res.status(500).json({ message: "Error unsubscribing" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
