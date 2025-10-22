import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { getServiceTitanAPI } from "./lib/serviceTitan";
import { processSegmentAutoEntry, processSegmentAutoExit, refreshAllSegments } from "./lib/audienceManager";
import { getAllServiceHealth, getSystemHealth } from "./lib/healthMonitor";

// Declare global types for SSR cache invalidation
declare global {
  var invalidateSSRCache: (() => void) | undefined;
}
import { insertContactSubmissionSchema, insertCustomerSuccessStorySchema, type InsertGoogleReview, companyCamPhotos, blogPosts, importedPhotos, reviewRequestCampaigns, reviewDripEmails } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { emailCampaigns } from "@shared/schema";
import Stripe from "stripe";
import multer from "multer";
import { sendContactFormEmail, sendReferralEmail, sendSuccessStoryNotificationEmail, sendNegativeReviewAlert } from "./email";
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
import { fetchDataForSeoReviews } from "./lib/dataForSeoReviews";
import { fetchDataForSeoYelpReviews } from "./lib/dataForSeoYelpReviews";
import { fetchFacebookReviews } from "./lib/facebookReviews";
import { notifySearchEnginesNewPage } from "./lib/sitemapPing";
import { processBlogImage } from "./lib/blogImageProcessor";
import path from "path";
import fs from "fs";
import { ObjectStorageService } from "./objectStorage";
import { analyzeProductionPhoto } from "./lib/productionPhotoAnalyzer";
import OpenAI from "openai";
import { generateH1FromTitle } from "./lib/generateH1";

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
      
      // If this was from a review request, update the request status
      if (reviewData.requestId) {
        await storage.completeReviewRequest(reviewData.requestId, review.id);
      }
      
      console.log(`[Review] New submission from ${reviewData.customerName} (${review.rating} stars)`);
      
      // Check if this is a negative review and send alerts (async, don't block response)
      const negativeThreshold = parseInt((await storage.getReputationSetting('negative_review_threshold'))?.settingValue || '2');
      const alertsEnabled = (await storage.getReputationSetting('negative_review_alerts_enabled'))?.settingValue === 'true';
      
      if (review.rating <= negativeThreshold && alertsEnabled) {
        // Send email alert
        sendNegativeReviewAlert({
          customerName: review.customerName,
          rating: review.rating,
          reviewText: review.text,
          email: review.email,
          phone: review.phone,
          serviceDate: review.serviceDate,
          reviewId: review.id,
        }).catch(err => {
          console.error('[Review] Failed to send negative review email alert:', err);
        });

        // Send SMS alert if enabled
        const smsAlertsEnabled = (await storage.getReputationSetting('negative_review_sms_alerts'))?.settingValue === 'true';
        const alertPhone = (await storage.getReputationSetting('negative_review_alert_phone'))?.settingValue;
        
        if (smsAlertsEnabled && alertPhone) {
          const { sendSMS } = await import('./lib/sms');
          const message = `NEGATIVE REVIEW ALERT: ${review.customerName} left a ${review.rating}-star review.\n\nReview: "${review.text.substring(0, 100)}${review.text.length > 100 ? '...' : ''}"\n\nRespond immediately to prevent damage. View in admin dashboard.`;
          
          sendSMS({
            to: alertPhone,
            message: message,
            customerId: null,
            campaignId: null,
          }).catch(err => {
            console.error('[Review] Failed to send negative review SMS alert:', err);
          });
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
        profilePhotoUrl: review.photoUrl || null,
        rating: review.rating,
        text: review.text,
        relativeTime: `${Math.floor((Date.now() - new Date(review.submittedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`,
        timestamp: Math.floor(new Date(review.submittedAt).getTime() / 1000),
        categories: review.serviceCategory ? [review.serviceCategory] : [],
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
          review.categories?.includes(category)
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

  // Public: Get review request by token (for review submission page)
  app.get("/api/review-request/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const request = await storage.getReviewRequestByToken(token);
      
      if (!request) {
        return res.status(404).json({ message: "Review request not found or expired" });
      }
      
      // Mark as clicked if not already
      if (!request.clickedAt) {
        await storage.markReviewRequestClicked(token);
      }
      
      // Return sanitized data (don't expose internal fields)
      res.json({
        customerName: request.customerName,
        email: request.email || undefined,
        phone: request.phone || undefined,
        serviceTitanCustomerId: request.serviceTitanCustomerId,
        serviceTitanJobId: request.serviceTitanJobId,
        requestId: request.id,
      });
    } catch (error: any) {
      console.error('[Review Request] Token lookup error:', error);
      res.status(500).json({ message: "Error loading review request" });
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
      
      // Try to find referrer's ServiceTitan customer ID immediately
      const { getServiceTitanAPI } = await import('./lib/serviceTitan');
      const serviceTitan = getServiceTitanAPI();
      let referrerCustomerId: number | null = null;
      
      try {
        // Search by email first (more reliable), then phone
        const searchValue = referrerEmail || referrerPhone;
        referrerCustomerId = await serviceTitan.searchCustomerWithFallback(searchValue);
        if (referrerCustomerId) {
          console.log(`[Referral] ✅ Matched referrer to ServiceTitan customer ${referrerCustomerId}`);
        } else {
          console.log('[Referral] ⚠️ Could not find referrer in ServiceTitan yet');
        }
      } catch (error) {
        console.error('[Referral] Error looking up referrer:', error);
        // Continue even if lookup fails - we can match later
      }

      // CRITICAL: Check if referee is ALREADY a customer (ineligible for referral)
      // Use REAL-TIME API check (not cache) for accuracy
      let refereeCustomerId: number | null = null;
      let isExistingCustomer = false;
      
      try {
        // First check local cache (fast)
        refereeCustomerId = await serviceTitan.searchLocalCustomer(refereePhone);
        if (!refereeCustomerId && refereeEmail) {
          refereeCustomerId = await serviceTitan.searchLocalCustomer(refereeEmail);
        }
        
        // If not in cache, check ServiceTitan API directly (real-time)
        if (!refereeCustomerId) {
          console.log(`[Referral] Cache miss - checking ServiceTitan API directly for referee...`);
          refereeCustomerId = await serviceTitan.searchCustomerWithFallback(refereePhone);
          if (!refereeCustomerId && refereeEmail) {
            refereeCustomerId = await serviceTitan.searchCustomerWithFallback(refereeEmail);
          }
        }
        
        if (refereeCustomerId) {
          isExistingCustomer = true;
          console.log(`[Referral] ❌ Referee "${refereeName}" is ALREADY a customer (ID: ${refereeCustomerId}) - ineligible`);
        } else {
          console.log(`[Referral] ✅ Referee "${refereeName}" is NOT yet a customer - eligible`);
        }
      } catch (error) {
        console.error('[Referral] Error checking referee:', error);
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
      
      // Send email notification to business
      try {
        await sendReferralEmail({
          referrerName,
          referrerPhone,
          refereeName,
          refereePhone,
          refereeEmail: refereeEmail || undefined,
        });
      } catch (emailError) {
        console.error('[Referral] Email sending failed:', emailError);
        // Continue even if email fails
      }
      
      res.json({ 
        success: true, 
        message: "Referral submitted successfully! We'll reach out to your friend soon.",
        referralId: referral.id,
      });
    } catch (error: any) {
      console.error('[Referral] Error:', error);
      res.status(500).json({ message: "Error submitting referral: " + error.message });
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

  // Send referral via SMS + Email (Customer Portal)
  app.post("/api/referrals/send", async (req, res) => {
    try {
      const {
        referrerName,
        referrerPhone,
        referrerCustomerId,
        referralCode,
        refereeName,
        refereePhone,
        refereeEmail,
        sendEmail,
        sendSMS,
      } = req.body;

      if (!referrerName || !referrerPhone || !referralCode || !refereeName || !refereePhone) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const { sendSMS: sendSMSUtil, sendReferralNotification } = await import('./lib/sms');
      const { getReferralEmailTemplate } = await import('./lib/emailTemplates');
      const { getUncachableResendClient } = await import('./email');
      
      // Build referral URL
      const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://www.plumbersthatcare.com'
        : 'http://localhost:5000';
      const referralUrl = `${baseUrl}/ref/${referralCode}`;

      // Track outreach status
      let smsSent = false;
      let emailSent = false;

      // Send SMS notification (graceful fallback if Twilio not configured)
      if (sendSMS) {
        try {
          await sendReferralNotification(refereePhone, referrerName, referralCode);
          console.log(`[Referrals] ✅ SMS sent to ${refereePhone}`);
          smsSent = true;
        } catch (error: any) {
          // Log warning but don't fail the whole referral
          console.warn(`[Referrals] ⚠️ SMS failed (continuing anyway): ${error.message}`);
          // SMS failure is not critical - referral can still succeed via email or manual outreach
        }
      }

      // Send email notification
      if (sendEmail && refereeEmail) {
        try {
          const { client, fromEmail } = await getUncachableResendClient();
          const emailTemplate = getReferralEmailTemplate({
            referrerName,
            refereeName,
            referralUrl,
          });

          await client.emails.send({
            from: fromEmail,
            to: refereeEmail,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });
          
          console.log(`[Referrals] ✅ Email sent to ${refereeEmail}`);
          emailSent = true;
        } catch (error: any) {
          console.warn(`[Referrals] ⚠️ Email failed (continuing anyway): ${error.message}`);
        }
      }

      // Create referral record
      const { referrals } = await import('@shared/schema');
      const { getServiceTitanAPI } = await import('./lib/serviceTitan');
      const serviceTitan = getServiceTitanAPI();
      
      let refereeCustomerId: number | null = null;
      let creditNotes: string | null = null;
      
      // Check if referee is already a customer
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

      const [referral] = await db.insert(referrals).values({
        referralCode,
        referrerName,
        referrerPhone,
        referrerCustomerId: referrerCustomerId || null,
        refereeName,
        refereePhone,
        refereeEmail: refereeEmail || null,
        refereeCustomerId,
        status: 'contacted', // Already contacted via SMS/Email
        submittedAt: new Date(),
        contactedAt: new Date(),
        creditNotes,
      }).returning();

      console.log(`[Referrals] Created referral record: ${referral.id} (SMS: ${smsSent}, Email: ${emailSent})`);
      res.json({ 
        success: true, 
        referralId: referral.id,
        smsSent,
        emailSent 
      });
    } catch (error: any) {
      console.error('[Referrals] Error sending referral:', error);
      res.status(500).json({ message: "Error sending referral: " + error.message });
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
      const { serviceTitanCustomers } = await import('@shared/schema');
      const { desc } = await import('drizzle-orm');
      
      console.log('[Customers Leaderboard] Fetching top customers from database...');
      
      // Get top 30 customers by job count (show more for diversity)
      const topCustomers = await db
        .select({
          name: serviceTitanCustomers.name,
          jobCount: serviceTitanCustomers.jobCount,
        })
        .from(serviceTitanCustomers)
        .where(sql`${serviceTitanCustomers.jobCount} > 0`)
        .orderBy(desc(serviceTitanCustomers.jobCount))
        .limit(30);

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

        // 3. Fetch Yelp reviews from DataForSEO
        const yelpAlias = 'economy-plumbing-services-austin-3'; // Yelp business alias
        console.log('[Reviews API] Fetching Yelp reviews from DataForSEO...');
        const yelpReviews = await fetchDataForSeoYelpReviews(yelpAlias);
        console.log(`[Reviews API] DataForSEO returned ${yelpReviews.length} Yelp reviews`);
        allReviews.push(...yelpReviews);

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

  // Admin: Get all reviews (all statuses)
  app.get("/api/admin/reviews", requireAdmin, async (req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json({ reviews });
    } catch (error: any) {
      console.error('[Admin Reviews] Error fetching reviews:', error);
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });

  // Admin: Approve a review
  app.post("/api/admin/reviews/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const review = await storage.approveReview(id);
      console.log(`[Admin Reviews] Approved review ${id}`);
      res.json({ success: true, review });
    } catch (error: any) {
      console.error('[Admin Reviews] Error approving review:', error);
      res.status(500).json({ message: "Error approving review" });
    }
  });

  // Admin: Reject a review
  app.post("/api/admin/reviews/:id/reject", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const review = await storage.rejectReview(id);
      console.log(`[Admin Reviews] Rejected review ${id}`);
      res.json({ success: true, review });
    } catch (error: any) {
      console.error('[Admin Reviews] Error rejecting review:', error);
      res.status(500).json({ message: "Error rejecting review" });
    }
  });

  // Admin: Delete a review permanently
  app.delete("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReview(id);
      console.log(`[Admin Reviews] Deleted review ${id}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[Admin Reviews] Error deleting review:', error);
      res.status(500).json({ message: "Error deleting review" });
    }
  });

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
  app.get("/api/admin/system-health", requireAdmin, async (req, res) => {
    try {
      const [allServices, systemHealth] = await Promise.all([
        getAllServiceHealth(),
        getSystemHealth()
      ]);

      res.json({
        systemHealth,
        services: allServices.map((service: any) => ({
          serviceName: service.serviceName,
          serviceType: service.serviceType,
          status: service.status,
          statusMessage: service.statusMessage,
          lastSuccessfulRunAt: service.lastSuccessfulRunAt,
          lastFailedRunAt: service.lastFailedRunAt,
          consecutiveFailures: service.consecutiveFailures,
          totalRuns: service.totalRuns,
          totalFailures: service.totalFailures,
          lastDurationMs: service.lastDurationMs,
          avgDurationMs: service.avgDurationMs,
          lastError: service.lastError,
          lastErrorAt: service.lastErrorAt,
          lastCheckedAt: service.lastCheckedAt,
        }))
      });
    } catch (error: any) {
      console.error('[Admin] Error fetching system health:', error);
      res.status(500).json({ error: error.message });
    }
  });

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

  // Admin: Create review request
  app.post("/api/admin/review-requests", requireAdmin, async (req, res) => {
    try {
      const { customerName, email, phone, serviceTitanCustomerId, serviceTitanJobId, method } = req.body;
      
      if (!customerName || !method || (!email && !phone)) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Generate unique token for personalized link
      const uniqueToken = crypto.randomUUID();
      const reviewUrl = `https://www.plumbersthatcare.com/leave-review/${uniqueToken}`;
      
      // Create email/SMS content
      const emailSubject = `How was your service from Economy Plumbing?`;
      const emailBody = `Hi ${customerName},\n\nThank you for choosing Economy Plumbing Services! We'd love to hear about your experience.\n\nPlease take a moment to leave us a review:\n${reviewUrl}\n\nYour feedback helps us improve and helps other customers make informed decisions.\n\nThank you!\nEconomy Plumbing Services`;
      
      const smsBody = `Hi ${customerName}! Thanks for choosing Economy Plumbing. We'd love your feedback: ${reviewUrl}`;
      
      // Create request in database
      const request = await storage.createReviewRequest({
        customerName,
        email: email || null,
        phone: phone || null,
        serviceTitanCustomerId: serviceTitanCustomerId || null,
        serviceTitanJobId: serviceTitanJobId || null,
        method,
        uniqueToken,
        emailSubject,
        emailBody,
        smsBody,
        status: 'pending',
        automatedSend: false,
      });
      
      console.log(`[Review Request] Created for ${customerName} (${method})`);
      res.json({ 
        success: true, 
        request,
        reviewUrl 
      });
    } catch (error: any) {
      console.error('[Review Request] Creation error:', error);
      res.status(400).json({ message: "Error creating review request: " + error.message });
    }
  });

  // Admin: Get all review requests
  app.get("/api/admin/review-requests", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const requests = await storage.getAllReviewRequests(status);
      res.json(requests);
    } catch (error: any) {
      console.error('[Review Request Admin] Error fetching requests:', error);
      res.status(500).json({ message: "Error fetching review requests" });
    }
  });

  // Admin: Send review request (email/SMS)
  app.post("/api/admin/review-requests/:id/send", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const request = await storage.getReviewRequestById(id);
      
      if (!request) {
        return res.status(404).json({ message: "Review request not found" });
      }
      
      const errors: string[] = [];
      
      // Send email if requested
      if ((request.method === 'email' || request.method === 'both') && request.email) {
        try {
          const { sendReviewRequestEmail } = await import('./email');
          await sendReviewRequestEmail({
            to: request.email,
            customerName: request.customerName,
            subject: request.emailSubject!,
            body: request.emailBody!,
          });
          console.log(`[Review Request] Email sent to ${request.email}`);
        } catch (emailError: any) {
          console.error('[Review Request] Email error:', emailError);
          errors.push(`Email: ${emailError.message}`);
        }
      }
      
      // Send SMS if requested
      if ((request.method === 'sms' || request.method === 'both') && request.phone) {
        try {
          const { sendSMS } = await import('./lib/sms');
          await sendSMS({
            to: request.phone,
            message: request.smsBody!,
          });
          console.log(`[Review Request] SMS sent to ${request.phone}`);
        } catch (smsError: any) {
          console.error('[Review Request] SMS error:', smsError);
          errors.push(`SMS: ${smsError.message}`);
        }
      }
      
      // Update request status
      if (errors.length === 0) {
        await storage.markReviewRequestSent(id);
        res.json({ success: true, message: "Review request sent successfully" });
      } else {
        await storage.markReviewRequestFailed(id, errors.join('; '));
        res.status(500).json({ success: false, message: "Failed to send review request", errors });
      }
    } catch (error: any) {
      console.error('[Review Request] Send error:', error);
      res.status(400).json({ message: "Error sending review request: " + error.message });
    }
  });

  // ============================================
  // REPUTATION / REVIEW MANAGEMENT SYSTEM
  // ============================================

  // Admin: Get all review request campaigns
  app.get("/api/admin/review-campaigns", requireAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getAllReviewCampaigns();
      res.json({ campaigns });
    } catch (error: any) {
      console.error('[Review Campaigns] Error fetching campaigns:', error);
      res.status(500).json({ message: "Error fetching campaigns" });
    }
  });

  // Admin: Create review request campaign with AI
  app.post("/api/admin/review-campaigns", requireAdmin, async (req, res) => {
    try {
      const { generateDripCampaignStrategy, generateDripEmailContent } = await import('./lib/aiReviewDrip');
      
      // Generate AI-optimized drip strategy
      console.log('[Review Campaigns] Generating AI drip strategy...');
      const strategy = await generateDripCampaignStrategy();
      
      // Generate AI email content for each drip timing
      console.log('[Review Campaigns] Generating email content...');
      const emailContent = await generateDripEmailContent(strategy.dripSchedule);
      
      // Wrap campaign + drip emails creation in database transaction
      // This ensures atomicity: either all succeed or all fail (no partial state)
      const campaign = await db.transaction(async (tx) => {
        // Create campaign in database
        const [newCampaign] = await tx.insert(reviewRequestCampaigns).values({
          name: strategy.campaignName,
          description: strategy.description,
          isActive: true,
          isDefault: false,
          generatedByAI: true,
          aiTimingStrategy: strategy as any,
          triggerEvent: 'job_completed',
          delayHours: 0,
          behaviorTrackingEnabled: true,
          clickedButNotReviewedBranch: true,
          totalSent: 0,
          totalClicks: 0,
          totalReviewsCompleted: 0,
          conversionRate: strategy.expectedConversionRate || 0,
        }).returning();
        
        // Create drip emails - all in same transaction
        for (const email of emailContent.emails) {
          await tx.insert(reviewDripEmails).values({
            campaignId: newCampaign.id,
            sequenceNumber: email.sequenceNumber,
            dayOffset: email.dayOffset,
            behaviorCondition: email.behaviorCondition,
            subject: email.subject,
            preheader: email.preheader,
            htmlContent: email.bodyStructure.opening + '\n\n' + email.bodyStructure.mainMessage + '\n\n' + email.bodyStructure.callToAction + '\n\n' + email.bodyStructure.closing,
            textContent: email.bodyStructure.opening + '\n\n' + email.bodyStructure.mainMessage + '\n\n' + email.bodyStructure.callToAction + '\n\n' + email.bodyStructure.closing,
            generatedByAI: true,
            aiPrompt: emailContent.aiPrompt,
            aiVersion: 1,
            messagingTactic: email.messagingTactic,
            totalSent: 0,
            totalOpened: 0,
            totalClicked: 0,
            totalReviewed: 0,
            enabled: true,
          });
        }
        
        return newCampaign;
      });
      
      console.log('[Review Campaigns] Campaign + drip emails created successfully (transactional):', campaign.id);
      res.json({ success: true, campaign });
    } catch (error: any) {
      console.error('[Review Campaigns] Error creating campaign:', error);
      res.status(500).json({ message: "Error creating campaign: " + error.message });
    }
  });

  // Admin: Get drip emails for a campaign
  app.get("/api/admin/review-campaigns/:id/emails", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const emails = await storage.getReviewDripEmails(id);
      res.json({ emails });
    } catch (error: any) {
      console.error('[Review Campaigns] Error fetching drip emails:', error);
      res.status(500).json({ message: "Error fetching drip emails" });
    }
  });

  // Admin: Update review campaign
  app.patch("/api/admin/review-campaigns/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const campaign = await storage.updateReviewCampaign(id, updates);
      console.log(`[Review Campaigns] Updated campaign ${id}`);
      res.json({ success: true, campaign });
    } catch (error: any) {
      console.error('[Review Campaigns] Error updating campaign:', error);
      res.status(500).json({ message: "Error updating campaign" });
    }
  });

  // Admin: Get reputation system settings
  app.get("/api/admin/reputation-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getReputationSettings();
      res.json(settings);
    } catch (error: any) {
      console.error('[Reputation Settings] Error fetching settings:', error);
      res.status(500).json({ message: "Error fetching settings" });
    }
  });

  // Admin: Update reputation system settings
  app.put("/api/admin/reputation-settings", requireAdmin, async (req, res) => {
    try {
      const { settingKey, settingValue } = req.body;
      const setting = await storage.updateReputationSetting(settingKey, settingValue);
      console.log(`[Reputation Settings] Updated ${settingKey}`);
      res.json({ success: true, setting });
    } catch (error: any) {
      console.error('[Reputation Settings] Error updating settings:', error);
      res.status(500).json({ message: "Error updating settings" });
    }
  });

  // Admin: Get customer engagement tracking data
  app.get("/api/admin/customer-engagement", requireAdmin, async (req, res) => {
    try {
      const { limit = 50, customerId } = req.query;
      
      // Get engagement data for review campaigns
      const engagementData = await db
        .select()
        .from(reviewBehaviorTracking)
        .orderBy(desc(reviewBehaviorTracking.lastActivityAt))
        .limit(Number(limit));
      
      // Get email engagement for recent review requests
      const emailEngagement = await db
        .select()
        .from(reviewRequestSendLog)
        .orderBy(desc(reviewRequestSendLog.sentAt))
        .limit(Number(limit));
      
      // Get SMS engagement from sms_send_log
      const smsEngagement = await db
        .select()
        .from(smsSendLog)
        .orderBy(desc(smsSendLog.sentAt))
        .limit(Number(limit));
      
      res.json({
        engagement: engagementData,
        emailActivity: emailEngagement,
        smsActivity: smsEngagement
      });
    } catch (error: any) {
      console.error('[Customer Engagement] Error fetching engagement data:', error);
      res.status(500).json({ message: "Error fetching engagement data" });
    }
  });

  // Admin: Get AI review responses
  app.get("/api/admin/ai-review-responses", requireAdmin, async (req, res) => {
    try {
      const responses = await storage.getAllAIReviewResponses();
      res.json({ responses });
    } catch (error: any) {
      console.error('[AI Review Responses] Error fetching responses:', error);
      res.status(500).json({ message: "Error fetching AI responses" });
    }
  });

  // Admin: Generate AI response for a review
  app.post("/api/admin/ai-review-responses/generate", requireAdmin, async (req, res) => {
    try {
      const { reviewType, reviewId, customerName, rating, reviewText } = req.body;
      
      // Call OpenAI to generate response
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const sentiment = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';
      const tone = 'professional_friendly';
      
      const aiPrompt = `Generate a ${tone} response to this ${sentiment} customer review:

Customer: ${customerName}
Rating: ${rating}/5 stars
Review: "${reviewText}"

Write a professional, authentic response that:
- Thanks the customer by name
- Addresses their specific feedback
- Maintains Economy Plumbing's friendly, approachable brand voice
- ${sentiment === 'negative' ? 'Apologizes and offers to make it right' : 'Expresses gratitude and reinforces quality service'}
- Keeps it concise (2-3 sentences)

Response:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional customer service representative for Economy Plumbing Services. Write authentic, warm responses to customer reviews.',
          },
          {
            role: 'user',
            content: aiPrompt,
          },
        ],
        temperature: 0.7,
      });

      const generatedResponse = response.choices[0].message.content || '';
      
      // Save AI response to database
      const aiResponse = await storage.createAIReviewResponse({
        reviewType,
        reviewId,
        customerName,
        rating,
        reviewText,
        generatedResponse,
        aiPrompt,
        aiModel: 'gpt-4o',
        sentiment,
        tone,
        status: 'pending',
        regenerationCount: 0,
      });
      
      console.log('[AI Review Responses] Generated response for review:', reviewId);
      res.json({ success: true, response: aiResponse });
    } catch (error: any) {
      console.error('[AI Review Responses] Error generating response:', error);
      res.status(500).json({ message: "Error generating AI response: " + error.message });
    }
  });

  // Admin: Approve AI review response
  app.post("/api/admin/ai-review-responses/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { editedResponse } = req.body;
      const moderatorId = (req.user as any)?.id || 'admin';
      
      await storage.approveAIReviewResponse(id, moderatorId, editedResponse);
      console.log(`[AI Review Responses] Approved response ${id}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[AI Review Responses] Error approving response:', error);
      res.status(500).json({ message: "Error approving response" });
    }
  });

  // Admin: Get negative review alerts
  app.get("/api/admin/negative-review-alerts", requireAdmin, async (req, res) => {
    try {
      const alerts = await storage.getNegativeReviewAlerts();
      res.json({ alerts });
    } catch (error: any) {
      console.error('[Negative Review Alerts] Error fetching alerts:', error);
      res.status(500).json({ message: "Error fetching alerts" });
    }
  });

  // Admin: Acknowledge negative review alert
  app.post("/api/admin/negative-review-alerts/:id/acknowledge", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const moderatorId = (req.user as any)?.id || 'admin';
      
      await storage.acknowledgeNegativeReviewAlert(id, moderatorId);
      console.log(`[Negative Review Alerts] Acknowledged alert ${id}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[Negative Review Alerts] Error acknowledging alert:', error);
      res.status(500).json({ message: "Error acknowledging alert" });
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

  // AI Chatbot endpoint
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }

      // Check if OpenAI is configured
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return res.json({
          message: "I'm having trouble connecting right now. Please text or call us directly for immediate assistance!",
          needsHandoff: true
        });
      }

      const openai = new OpenAI({ apiKey: openaiKey });

      // System prompt for the chatbot
      const systemPrompt = `You are an AI assistant for Economy Plumbing Services, a trusted plumbing company serving Austin and Marble Falls, Texas.

Your role:
- Answer common plumbing questions (water heaters, drains, leaks, pricing estimates)
- Help customers understand services
- Provide general scheduling information
- Be friendly, helpful, and professional

Services we offer:
- Water heater installation & repair (tank and tankless)
- Drain cleaning & hydro jetting
- Leak detection & repair
- Emergency plumbing (24/7)
- Backflow testing
- Commercial plumbing
- Gas line services
- Toilet & faucet repair

Pricing estimates:
- Water heater installation: $1,200-$2,800 depending on size
- Drain cleaning: $150-$400
- Leak repair: $200-$600
- Emergency service: Available 24/7

When to hand off to human via SMS/Call:
- Customer wants specific pricing for their situation
- Customer wants to schedule an appointment
- Customer has an emergency (burst pipe, major leak, no hot water)
- Customer asks complex technical questions beyond general info
- Customer explicitly asks to speak with someone
- You're unsure or don't have enough information

If handoff is needed, respond with: "I'd be happy to connect you with our team! They can provide personalized pricing and schedule your service. Would you prefer to text or call us?"

Keep responses concise (2-3 sentences max). Be warm and helpful.`;

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

      // Detect if handoff keywords are present
      const handoffKeywords = [
        "connect you with",
        "speak with",
        "talk to",
        "text or call",
        "contact our team",
        "schedule",
        "pricing for your",
        "emergency",
      ];

      const needsHandoff = handoffKeywords.some(keyword => 
        aiResponse.toLowerCase().includes(keyword.toLowerCase())
      );

      res.json({
        message: aiResponse,
        needsHandoff
      });

    } catch (error: any) {
      console.error("Chatbot error:", error);
      res.status(500).json({
        message: "I'm having trouble connecting right now. Please text or call us directly for immediate assistance!",
        needsHandoff: true
      });
    }
  });

  // ServiceTitan Customer Portal Routes
  
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
        customerId: parseInt(customerId),
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
      res.json({ customerId: req.session.portalCustomerId });
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
      const customerId = await serviceTitan.searchLocalCustomer(searchValue);

      if (!customerId) {
        console.log("[Portal Auth] No customer found in synced database");
        return res.status(404).json({ 
          error: "We couldn't find an account with that email or phone number. Please verify your information or contact us at (512) 396-7811 for assistance.",
          found: false 
        });
      }

      console.log("[Portal Auth] Customer found in cache:", customerId);

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
        customerId,
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

      console.log("[Portal Auth] Verification successful, looking up customer...");

      // Use the customer ID that was stored during verification
      // This is more reliable than re-looking up via contacts table
      const customerId = verification.customerId;
      console.log(`[Portal Auth] Using stored customer ID: ${customerId}`);

      if (!customerId) {
        console.error("[Portal Auth] No customer ID in verification record");
        return res.status(500).json({ 
          error: "Verification record is missing customer information. Please try again.",
          code: "MISSING_CUSTOMER_ID"
        });
      }

      const customerIds = [customerId];

      // Import schemas
      const { serviceTitanCustomers, serviceTitanContacts } = await import("@shared/schema");
      const { sql } = await import("drizzle-orm");

      // Fetch complete customer data with ALL contacts for each customer
      const customersData = await db
        .select()
        .from(serviceTitanCustomers)
        .where(sql`${serviceTitanCustomers.id} = ANY(${customerIds})`);

      // Fetch ALL contacts for these customers
      const allContacts = await db
        .select()
        .from(serviceTitanContacts)
        .where(sql`${serviceTitanContacts.customerId} = ANY(${customerIds})`);

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
      if (matchingCustomers.length === 1 && req.session) {
        req.session.portalCustomerId = matchingCustomers[0].id;
        await new Promise<void>((resolve, reject) => {
          req.session!.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        console.log(`[Portal Auth] Session saved for customer ${matchingCustomers[0].id}`);
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

      // Send email notification to admin
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
        to: process.env.ADMIN_EMAIL || 'info@plumbersthatcare.com',
        subject,
        html: htmlContent,
      });

      console.log(`[Portal] PDF request email sent for ${type} #${number}`);

      res.json({ success: true });
    } catch (error: any) {
      console.error("[Portal] PDF request error:", error);
      res.status(500).json({ error: "Failed to send PDF request" });
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
  app.get("/api/portal/customer/:customerId/emails", async (req, res) => {
    try {
      const { customerId } = req.params;
      
      // Check if user has valid portal session
      if (!req.session.portalCustomerId || req.session.portalCustomerId.toString() !== customerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const customerIdNum = parseInt(customerId);
      
      // Fetch email marketing history from email_send_log
      const emailHistory = await db
        .select({
          id: emailSendLog.id,
          subject: campaignEmails.subject,
          campaignName: emailCampaigns.name,
          sentAt: emailSendLog.sentAt,
          openedAt: emailSendLog.openedAt,
          clickedAt: emailSendLog.clickedAt,
          status: emailSendLog.resendStatus,
        })
        .from(emailSendLog)
        .leftJoin(campaignEmails, eq(emailSendLog.campaignEmailId, campaignEmails.id))
        .leftJoin(emailCampaigns, eq(emailSendLog.campaignId, emailCampaigns.id))
        .where(eq(emailSendLog.serviceTitanCustomerId, customerIdNum))
        .orderBy(desc(emailSendLog.sentAt))
        .limit(50);
      
      // Fetch review request emails from review_request_send_log
      const reviewEmails = await db
        .select({
          id: reviewRequestSendLog.id,
          subject: reviewDripEmails.subject,
          campaignName: reviewRequestCampaigns.name,
          sentAt: reviewRequestSendLog.sentAt,
          openedAt: reviewRequestSendLog.openedAt,
          clickedAt: reviewRequestSendLog.clickedAt,
          status: reviewRequestSendLog.resendStatus,
        })
        .from(reviewRequestSendLog)
        .leftJoin(reviewDripEmails, eq(reviewRequestSendLog.dripEmailId, reviewDripEmails.id))
        .leftJoin(reviewRequestCampaigns, eq(reviewRequestSendLog.campaignId, reviewRequestCampaigns.id))
        .where(eq(reviewRequestSendLog.serviceTitanCustomerId, customerIdNum))
        .orderBy(desc(reviewRequestSendLog.sentAt))
        .limit(50);
      
      // Combine and sort by sent date
      const allEmails = [...emailHistory, ...reviewEmails].sort((a, b) => 
        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      );
      
      res.json({ emails: allEmails });
    } catch (error: any) {
      console.error("[Portal] Email history error:", error);
      res.status(500).json({ error: "Failed to fetch email history" });
    }
  });

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

      const { serviceTitanCustomers, serviceTitanContacts } = await import('@shared/schema');
      const { isSyncRunning } = await import('./lib/serviceTitanSync');

      // Get customer and contact counts
      const [customerCount, contactCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(serviceTitanCustomers),
        db.select({ count: sql<number>`count(*)` }).from(serviceTitanContacts)
      ]);

      // Get most recent sync timestamp
      const recentCustomer = await db.select({ lastSynced: serviceTitanCustomers.lastSyncedAt })
        .from(serviceTitanCustomers)
        .orderBy(sql`${serviceTitanCustomers.lastSyncedAt} DESC`)
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
  app.get("/api/portal/customer-stats/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return res.status(400).json({ error: "Customer ID required" });
      }

      console.log("[Portal] Fetching customer stats for:", customerId);

      const { getServiceTitanAPI } = await import("./lib/serviceTitan");
      const serviceTitan = getServiceTitanAPI();

      // Get all jobs for this customer
      const customerJobs = await serviceTitan.getCustomerJobs(parseInt(customerId));
      
      // Count completed jobs
      const completedJobs = customerJobs.filter(job => 
        job.completedOn && job.status?.toLowerCase().includes('complete')
      );
      const serviceCount = completedJobs.length;

      console.log(`[Portal] Customer ${customerId} has ${serviceCount} completed services`);

      // Calculate percentile ranking
      // Get total service counts from our cached customers
      const { serviceTitanCustomers } = await import('@shared/schema');
      
      // Get all customers with their job counts from our database
      // We'll use a simple heuristic: customers with more than N services are "above" this customer
      const allCustomers = await db.select({ 
        id: serviceTitanCustomers.id 
      }).from(serviceTitanCustomers);

      // For now, use a simplified percentile calculation
      // In production, you might want to cache job counts for all customers
      let customersAboveCount = 0;
      let customersChecked = 0;
      
      // Sample up to 100 customers for percentile calculation (for performance)
      const sampleSize = Math.min(100, allCustomers.length);
      const step = Math.max(1, Math.floor(allCustomers.length / sampleSize));
      
      for (let i = 0; i < allCustomers.length; i += step) {
        if (customersChecked >= sampleSize) break;
        
        const otherCustomer = allCustomers[i];
        if (otherCustomer.id === parseInt(customerId)) continue;
        
        try {
          const otherJobs = await serviceTitan.getCustomerJobs(otherCustomer.id);
          const otherCompletedCount = otherJobs.filter(job => 
            job.completedOn && job.status?.toLowerCase().includes('complete')
          ).length;
          
          if (otherCompletedCount > serviceCount) {
            customersAboveCount++;
          }
          customersChecked++;
        } catch (error) {
          console.error(`[Portal] Error checking customer ${otherCustomer.id}:`, error);
          // Continue with other customers
        }
      }

      // Calculate percentile (what % of customers this customer is better than)
      const percentile = customersChecked > 0 
        ? Math.round((1 - (customersAboveCount / customersChecked)) * 100)
        : 50; // Default to 50th percentile if we can't calculate

      console.log(`[Portal] Customer ${customerId} is in top ${100 - percentile}% (${customersAboveCount}/${customersChecked} customers have more services)`);

      res.json({
        serviceCount,
        topPercentile: 100 - percentile, // e.g., "top 15%" means 85th percentile
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

  // Get email preferences for a customer
  app.get("/api/email-preferences/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const preferences = await storage.getEmailPreferencesByEmail(email);
      
      if (!preferences) {
        // Return default preferences if none exist
        return res.json({
          email,
          unsubscribedMarketing: false,
          unsubscribedReviews: false,
          unsubscribedServiceReminders: false,
          unsubscribedReferrals: false,
          unsubscribedAll: false
        });
      }
      
      res.json(preferences);
    } catch (error: any) {
      console.error("[Email Preferences] Get error:", error);
      res.status(500).json({ error: "Failed to fetch email preferences" });
    }
  });

  // Update email preferences
  app.put("/api/email-preferences", async (req, res) => {
    try {
      const { email, ...preferences } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email address required" });
      }
      
      const updated = await storage.upsertEmailPreferences({ email, ...preferences });
      res.json(updated);
    } catch (error: any) {
      console.error("[Email Preferences] Update error:", error);
      res.status(500).json({ error: "Failed to update email preferences" });
    }
  });

  // Unsubscribe from specific category (public endpoint for one-click unsubscribe)
  app.post("/api/unsubscribe/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email address required" });
      }
      
      if (!['marketing', 'reviews', 'serviceReminders', 'referrals'].includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      
      const updated = await storage.unsubscribeFromCategory(email, category as any);
      res.json({ 
        success: true, 
        message: `Successfully unsubscribed from ${category} emails`,
        preferences: updated
      });
    } catch (error: any) {
      console.error("[Email Preferences] Unsubscribe category error:", error);
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // Unsubscribe from all emails (public endpoint for one-click unsubscribe)
  app.post("/api/unsubscribe-all", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email address required" });
      }
      
      const updated = await storage.unsubscribeFromAll(email);
      res.json({ 
        success: true, 
        message: "Successfully unsubscribed from all emails",
        preferences: updated
      });
    } catch (error: any) {
      console.error("[Email Preferences] Unsubscribe all error:", error);
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // Admin: Get suppression list
  app.get("/api/admin/suppression-list", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { limit, offset } = req.query;
      const suppressions = await storage.getSuppressionList({
        limit: limit ? parseInt(limit as string) : 100,
        offset: offset ? parseInt(offset as string) : 0
      });
      
      const stats = await storage.getSuppressionStats();
      
      res.json({ suppressions, stats });
    } catch (error: any) {
      console.error("[Admin] Get suppression list error:", error);
      res.status(500).json({ error: "Failed to fetch suppression list" });
    }
  });

  // Admin: Add email to suppression list
  app.post("/api/admin/suppression-list", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { email, reason, reasonDetails } = req.body;
      
      if (!email || !reason) {
        return res.status(400).json({ error: "Email and reason required" });
      }
      
      const suppression = await storage.addToSuppressionList({
        email,
        reason,
        reasonDetails: reasonDetails || null,
        resendEmailId: null,
        campaignId: null,
        lastAttemptedAt: null
      });
      
      res.json(suppression);
    } catch (error: any) {
      console.error("[Admin] Add to suppression list error:", error);
      res.status(500).json({ error: "Failed to add to suppression list" });
    }
  });

  // Admin: Remove email from suppression list
  app.delete("/api/admin/suppression-list/:email", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { email } = req.params;
      await storage.removeFromSuppressionList(email);
      
      res.json({ success: true, message: "Email removed from suppression list" });
    } catch (error: any) {
      console.error("[Admin] Remove from suppression list error:", error);
      res.status(500).json({ error: "Failed to remove from suppression list" });
    }
  });

  /**
   * Email Campaign Management - ServiceTitan Integration
   */

  // Get all email campaigns
  app.get("/api/admin/campaigns", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { status, isEvergreen } = req.query;
      const campaigns = await storage.getEmailCampaigns({
        status: status as string,
        isEvergreen: isEvergreen === 'true' ? true : isEvergreen === 'false' ? false : undefined
      });
      
      res.json(campaigns);
    } catch (error: any) {
      console.error("[Admin] Get campaigns error:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // Get specific campaign
  app.get("/api/admin/campaigns/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const campaign = await storage.getEmailCampaignById(req.params.id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error: any) {
      console.error("[Admin] Get campaign error:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  // Get campaign emails (drip sequence)
  app.get("/api/admin/campaigns/:id/emails", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { campaignEmails } = await import("@shared/schema");
      const { eq, asc } = await import("drizzle-orm");
      
      const emails = await db
        .select()
        .from(campaignEmails)
        .where(eq(campaignEmails.campaignId, req.params.id))
        .orderBy(asc(campaignEmails.sequenceNumber));
      
      res.json({ emails });
    } catch (error: any) {
      console.error("[Admin] Get campaign emails error:", error);
      res.status(500).json({ error: "Failed to fetch campaign emails" });
    }
  });

  // Create a new campaign (stored locally, awaiting ServiceTitan sync)
  app.post("/api/admin/campaigns", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const campaign = await storage.createEmailCampaign(req.body);
      res.json(campaign);
    } catch (error: any) {
      console.error("[Admin] Create campaign error:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Update campaign (e.g., add tracking phone number)
  app.patch("/api/admin/campaigns/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const updated = await storage.updateEmailCampaign(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("[Admin] Update campaign error:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // Create campaign in ServiceTitan and sync
  app.post("/api/admin/campaigns/:id/sync-to-servicetitan", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const campaignId = req.params.id;
      const campaign = await storage.getEmailCampaignById(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      // Create campaign in ServiceTitan
      const serviceTitanAPI = getServiceTitanAPI();
      const { phoneNumber } = req.body; // Optional: admin can provide tracking phone number
      
      const stCampaign = await serviceTitanAPI.createCampaign({
        name: campaign.name,
        phoneNumber: phoneNumber || campaign.trackingPhoneNumber || undefined,
      });
      
      // Sync ServiceTitan campaign ID back to local campaign
      const synced = await storage.syncCampaignToServiceTitan(
        campaignId,
        stCampaign.id,
        stCampaign.name
      );
      
      res.json({
        success: true,
        message: "Campaign created in ServiceTitan and synced",
        campaign: synced,
        serviceTitanCampaignId: stCampaign.id
      });
    } catch (error: any) {
      console.error("[Admin] Sync to ServiceTitan error:", error);
      res.status(500).json({ 
        error: "Failed to sync to ServiceTitan",
        details: error.message 
      });
    }
  });

  // Get ServiceTitan campaigns (for reference/comparison)
  app.get("/api/admin/servicetitan/campaigns", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const serviceTitanAPI = getServiceTitanAPI();
      const stCampaigns = await serviceTitanAPI.getCampaigns();
      
      res.json(stCampaigns);
    } catch (error: any) {
      console.error("[Admin] Get ServiceTitan campaigns error:", error);
      res.status(500).json({ 
        error: "Failed to fetch ServiceTitan campaigns",
        details: error.message 
      });
    }
  });

  /**
   * AI Customer Segmentation - GPT-4o Analysis
   */

  // Trigger AI segmentation analysis
  app.post("/api/admin/ai-segmentation/analyze", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { runAISegmentation } = await import("./lib/aiSegmentation");
      
      const result = await runAISegmentation(storage);
      
      res.json({
        success: true,
        message: `Created ${result.segmentIds.length} customer segments`,
        segmentIds: result.segmentIds,
        analysis: {
          opportunitiesFound: result.analysis.opportunities.length,
          totalCustomersAnalyzed: result.analysis.totalCustomersAnalyzed,
          analysisDate: result.analysis.analysisDate,
        },
      });
    } catch (error: any) {
      console.error("[Admin] AI segmentation error:", error);
      res.status(500).json({ 
        error: "Failed to run AI segmentation",
        details: error.message 
      });
    }
  });

  // Get all customer segments
  app.get("/api/admin/segments", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { status, segmentType } = req.query;
      const segments = await storage.getCustomerSegments({
        status: status as string,
        segmentType: segmentType as string,
      });
      
      res.json(segments);
    } catch (error: any) {
      console.error("[Admin] Get segments error:", error);
      res.status(500).json({ error: "Failed to fetch segments" });
    }
  });

  // Get specific segment
  app.get("/api/admin/segments/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const segment = await storage.getCustomerSegmentById(req.params.id);
      
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }
      
      res.json(segment);
    } catch (error: any) {
      console.error("[Admin] Get segment error:", error);
      res.status(500).json({ error: "Failed to fetch segment" });
    }
  });

  // Update segment (e.g., change status)
  app.patch("/api/admin/segments/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const updated = await storage.updateCustomerSegment(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("[Admin] Update segment error:", error);
      res.status(500).json({ error: "Failed to update segment" });
    }
  });

  // Get segment members
  app.get("/api/admin/segments/:id/members", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const { activeOnly, limit, offset } = req.query;

      const members = await storage.getSegmentMembers(id, {
        activeOnly: activeOnly === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(members);
    } catch (error: any) {
      console.error('[API] Error fetching segment members:', error);
      res.status(500).json({ error: "Failed to fetch segment members" });
    }
  });

  // Manual segment refresh (auto-entry + auto-exit)
  app.post("/api/admin/segments/:id/refresh", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;

      const entryResults = await processSegmentAutoEntry(id);
      const exitResults = await processSegmentAutoExit(id);

      res.json({
        success: true,
        results: {
          entered: entryResults.entered,
          skipped: entryResults.skipped,
          exited: exitResults.exited,
          retained: exitResults.retained,
        },
      });
    } catch (error: any) {
      console.error('[API] Error refreshing segment:', error);
      res.status(500).json({ error: "Failed to refresh segment" });
    }
  });

  // Refresh all segments
  app.post("/api/admin/segments/refresh-all", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const results = await refreshAllSegments();

      res.json({
        success: true,
        results,
      });
    } catch (error: any) {
      console.error('[API] Error refreshing all segments:', error);
      res.status(500).json({ error: "Failed to refresh all segments" });
    }
  });

  // Approve campaign (creates in ServiceTitan Marketing API)
  app.post("/api/admin/campaigns/:id/approve", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const campaign = await storage.getEmailCampaignById(id);

      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      if (campaign.status !== 'pending_approval') {
        return res.status(400).json({ error: "Campaign is not pending approval" });
      }

      // Get segment details
      const segment = await storage.getCustomerSegmentById(campaign.segmentId);
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }

      // Create campaign in ServiceTitan Marketing API
      const serviceTitan = getServiceTitanAPI();
      const stCampaign = await serviceTitan.createCampaign({
        name: campaign.name,
        active: false, // Start inactive until phone number is added
      });

      // Update campaign with ServiceTitan details and set approvedAt manually
      const [updatedCampaign] = await db
        .update(emailCampaigns)
        .set({
          serviceTitanCampaignId: stCampaign.id,
          serviceTitanCampaignName: stCampaign.name,
          status: 'awaiting_phone_number',
          approvedBy: req.user?.id || 'admin',
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailCampaigns.id, id))
        .returning();

      res.json({
        success: true,
        campaign: updatedCampaign,
        serviceTitanCampaign: stCampaign,
      });
    } catch (error: any) {
      console.error('[API] Error approving campaign:', error);
      res.status(500).json({ error: error.message || "Failed to approve campaign" });
    }
  });

  // Add tracking number to campaign
  app.post("/api/admin/campaigns/:id/tracking-number", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const { trackingNumber } = req.body;

      if (!trackingNumber) {
        return res.status(400).json({ error: "Tracking number is required" });
      }

      // Update campaign with tracking number and change status to ready_to_send
      const [updatedCampaign] = await db
        .update(emailCampaigns)
        .set({
          trackingPhoneNumber: trackingNumber,
          status: 'ready_to_send',
          updatedAt: new Date(),
        })
        .where(eq(emailCampaigns.id, id))
        .returning();

      if (!updatedCampaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.json({
        success: true,
        campaign: updatedCampaign,
      });
    } catch (error: any) {
      console.error('[API] Error adding tracking number:', error);
      res.status(500).json({ error: error.message || "Failed to add tracking number" });
    }
  });

  // Get marketing system settings
  app.get("/api/admin/marketing-settings", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const settings = await storage.getMarketingSystemSettings();
      res.json({
        masterSendEnabled: settings?.masterSendEnabled || false,
        dailyEmailLimit: settings?.dailyEmailLimit || 500,
        testModeEnabled: settings?.testModeEnabled || true,
      });
    } catch (error: any) {
      console.error('[API] Error fetching marketing settings:', error);
      res.status(500).json({ error: "Failed to fetch marketing settings" });
    }
  });

  // Update marketing system settings
  app.put("/api/admin/marketing-settings", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { masterSendEnabled, dailyEmailLimit, testModeEnabled } = req.body;

      const updated = await storage.updateMarketingSystemSettings({
        masterSendEnabled,
        dailyEmailLimit,
        testModeEnabled,
      });

      res.json(updated);
    } catch (error: any) {
      console.error('[API] Error updating marketing settings:', error);
      res.status(500).json({ error: "Failed to update marketing settings" });
    }
  });

  // Get audience movement logs
  app.get("/api/admin/audience-logs", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { segmentId, customerId, action, limit, offset } = req.query;

      const logs = await storage.getAudienceMovementLogs({
        segmentId: segmentId as string,
        customerId: customerId ? parseInt(customerId as string) : undefined,
        action: action as 'entered' | 'exited' | undefined,
        limit: limit ? parseInt(limit as string) : 100,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(logs);
    } catch (error: any) {
      console.error('[API] Error fetching audience logs:', error);
      res.status(500).json({ error: "Failed to fetch audience logs" });
    }
  });

  // EMAIL CAMPAIGN ANALYTICS
  app.get("/api/email/analytics/dashboard", requireAdmin, async (req, res) => {
    try {
      const { emailSendLog, campaignEmails } = await import("@shared/schema");
      const { db } = await import("./db");
      const { sql, and, gte } = await import("drizzle-orm");
      
      // Get stats for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get aggregate metrics
      const [metrics] = await db
        .select({
          totalSent: sql<number>`COUNT(*)`,
          totalDelivered: sql<number>`COUNT(CASE WHEN ${emailSendLog.deliveredAt} IS NOT NULL THEN 1 END)`,
          totalOpened: sql<number>`COUNT(CASE WHEN ${emailSendLog.openedAt} IS NOT NULL THEN 1 END)`,
          totalClicked: sql<number>`COUNT(CASE WHEN ${emailSendLog.clickedAt} IS NOT NULL THEN 1 END)`,
          totalBounced: sql<number>`COUNT(CASE WHEN ${emailSendLog.bouncedAt} IS NOT NULL THEN 1 END)`,
          totalComplained: sql<number>`COUNT(CASE WHEN ${emailSendLog.complainedAt} IS NOT NULL THEN 1 END)`,
        })
        .from(emailSendLog)
        .where(gte(emailSendLog.sentAt, thirtyDaysAgo));
      
      // Calculate rates
      const deliveryRate = metrics.totalSent > 0 
        ? Math.round((metrics.totalDelivered / metrics.totalSent) * 100) 
        : 0;
      const openRate = metrics.totalDelivered > 0 
        ? Math.round((metrics.totalOpened / metrics.totalDelivered) * 100) 
        : 0;
      const clickRate = metrics.totalOpened > 0 
        ? Math.round((metrics.totalClicked / metrics.totalOpened) * 100) 
        : 0;
      const bounceRate = metrics.totalSent > 0 
        ? Math.round((metrics.totalBounced / metrics.totalSent) * 100) 
        : 0;
      
      res.json({
        stats: {
          ...metrics,
          deliveryRate,
          openRate,
          clickRate,
          bounceRate,
        },
      });
    } catch (error: any) {
      console.error('[API] Error fetching email analytics:', error);
      res.status(500).json({ error: error.message || "Failed to fetch email analytics" });
    }
  });

  // RESEND EMAIL WEBHOOK - Track email engagement events
  app.post("/api/webhooks/resend", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      // Verify webhook signature using Svix
      const signature = req.headers['svix-signature'] as string;
      const timestamp = req.headers['svix-timestamp'] as string;
      const svixId = req.headers['svix-id'] as string;
      
      if (!signature || !timestamp || !svixId) {
        console.warn('[Resend Webhook] Missing signature headers');
        return res.status(401).json({ error: "Missing signature headers" });
      }
      
      // Get webhook signing secret from environment
      const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.error('[Resend Webhook] RESEND_WEBHOOK_SECRET not configured');
        // In development, we can continue without verification (with warning)
        // In production, this should fail
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({ error: "Webhook secret not configured" });
        }
        console.warn('[Resend Webhook] ⚠️ WARNING: Processing webhook without verification (development mode)');
      }
      
      let event: any;
      
      // Verify signature if webhook secret is configured
      if (webhookSecret) {
        try {
          const { Webhook } = await import('svix');
          const wh = new Webhook(webhookSecret);
          
          // Verify the webhook signature
          event = wh.verify(req.body.toString(), {
            'svix-signature': signature,
            'svix-timestamp': timestamp,
            'svix-id': svixId,
          }) as any;
          
          console.log('[Resend Webhook] ✓ Signature verified successfully');
        } catch (err) {
          console.error('[Resend Webhook] ✗ Signature verification failed:', err);
          return res.status(401).json({ error: "Invalid webhook signature" });
        }
      } else {
        // Parse without verification (development only)
        event = JSON.parse(req.body.toString());
      }
      
      console.log('[Resend Webhook] Received event:', event.type);
      
      // Extract email ID from the event (Resend uses 'email_id' in their webhooks)
      const emailId = event.data?.email_id;
      if (!emailId) {
        console.warn('[Resend Webhook] No email_id in event:', event);
        return res.status(200).json({ received: true });
      }

      // Find the email send log entry
      const { emailSendLog } = await import("@shared/schema");
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      
      const sendLog = await db.query.emailSendLog.findFirst({
        where: eq(emailSendLog.resendEmailId, emailId),
      });

      if (!sendLog) {
        console.warn('[Resend Webhook] No send log found for email_id:', emailId);
        return res.status(200).json({ received: true });
      }

      // Update the send log based on event type
      const updates: any = {};
      
      switch (event.type) {
        case 'email.delivered':
          updates.deliveredAt = new Date(event.created_at);
          updates.resendStatus = 'delivered';
          break;
          
        case 'email.opened':
          updates.openedAt = new Date(event.created_at);
          break;
          
        case 'email.clicked':
          updates.clickedAt = new Date(event.created_at);
          break;
          
        case 'email.bounced':
          updates.bouncedAt = new Date(event.created_at);
          updates.resendStatus = 'bounced';
          
          // Add to suppression list for hard bounces
          if (event.data?.bounce_type === 'hard') {
            const { emailSuppressionList } = await import("@shared/schema");
            await db.insert(emailSuppressionList).values({
              email: sendLog.recipientEmail,
              reason: 'hard_bounce',
              reasonDetails: event.data?.bounce_reason || 'Hard bounce from Resend',
              resendEmailId: emailId,
              campaignId: sendLog.campaignId,
            }).onConflictDoNothing();
          }
          break;
          
        case 'email.complained':
          updates.complainedAt = new Date(event.created_at);
          updates.resendStatus = 'complained';
          
          // Add to suppression list for spam complaints
          const { emailSuppressionList } = await import("@shared/schema");
          await db.insert(emailSuppressionList).values({
            email: sendLog.recipientEmail,
            reason: 'spam_complaint',
            reasonDetails: 'Spam complaint from Resend',
            resendEmailId: emailId,
            campaignId: sendLog.campaignId,
          }).onConflictDoNothing();
          break;
          
        default:
          console.log('[Resend Webhook] Unhandled event type:', event.type);
      }

      // Update the send log if we have updates
      if (Object.keys(updates).length > 0) {
        await db.update(emailSendLog)
          .set(updates)
          .where(eq(emailSendLog.id, sendLog.id));
        
        // Also update campaign email metrics
        const { campaignEmails } = await import("@shared/schema");
        const { sql } = await import("drizzle-orm");
        
        if (updates.openedAt) {
          await db.update(campaignEmails)
            .set({ totalOpened: sql`${campaignEmails.totalOpened} + 1` })
            .where(eq(campaignEmails.id, sendLog.campaignEmailId));
        }
        
        if (updates.clickedAt) {
          await db.update(campaignEmails)
            .set({ totalClicked: sql`${campaignEmails.totalClicked} + 1` })
            .where(eq(campaignEmails.id, sendLog.campaignEmailId));
        }
        
        if (updates.bouncedAt) {
          await db.update(campaignEmails)
            .set({ totalBounced: sql`${campaignEmails.totalBounced} + 1` })
            .where(eq(campaignEmails.id, sendLog.campaignEmailId));
        }
        
        console.log('[Resend Webhook] Updated send log:', sendLog.id, 'with:', updates);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('[Resend Webhook] Error processing webhook:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Register SMS Marketing routes
  const { registerSMSMarketingRoutes } = await import("./api/smsMarketing");
  registerSMSMarketingRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
