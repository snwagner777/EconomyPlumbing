import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSubmissionSchema, insertCustomerSuccessStorySchema, type InsertGoogleReview, companyCamPhotos, blogPosts, importedPhotos } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
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
      
      // Static pages with priorities
      const staticPages = [
        { url: '', lastmod: now, changefreq: 'weekly', priority: '1.0' },
        
        // SEO Landing Pages
        { url: 'plumber-near-me', lastmod: now, changefreq: 'weekly', priority: '0.9' },
        { url: 'commercial-services', lastmod: now, changefreq: 'weekly', priority: '0.9' },
        
        // Main Service Pages
        { url: 'water-heater-services', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'drain-cleaning', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'leak-repair', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'toilet-faucet', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'gas-services', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'backflow', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        { url: 'commercial-plumbing', lastmod: now, changefreq: 'monthly', priority: '0.9' },
        
        // Additional Service Pages
        { url: 'backflow-testing', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'drainage-solutions', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        { url: 'drain-cleaning-services', lastmod: now, changefreq: 'monthly', priority: '0.8' },
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
        { url: 'shop', lastmod: now, changefreq: 'monthly', priority: '0.8' },
        
        // Blog & Success Stories
        { url: 'blog', lastmod: now, changefreq: 'weekly', priority: '0.8' },
        { url: 'success-stories', lastmod: now, changefreq: 'weekly', priority: '0.8' },
      ];
      
      // Generate static page URLs
      const staticUrls = staticPages.map(page => `  <url>
    <loc>${baseUrl}/${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');
      
      // Generate blog post URLs (sorted by newest first)
      const blogUrls = posts
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
      
      // Generate product URLs (store checkout pages)
      const productUrls = products
        .filter(p => p.active)
        .map(product => `  <url>
    <loc>${baseUrl}/store/checkout/${product.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');
      
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
      const newPost = await storage.createBlogPost(req.body);
      
      // Notify search engines about new page
      notifySearchEnginesNewPage('blog post');
      
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

      const { analyzePhotoQuality } = await import("./lib/photoQualityAnalyzer");
      const analysis = await analyzePhotoQuality(photoUrl, description);

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

  // Admin authentication middleware - OAuth + whitelist required
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
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata,
        ...(Object.keys(billingDetails).length > 0 && {
          shipping: {
            name: billingDetails.name,
            phone: billingDetails.phone,
            address: {
              line1: customerInfo?.street || '',
              city: customerInfo?.city || '',
              state: customerInfo?.state || '',
              postal_code: customerInfo?.zip || '',
              country: 'US',
            },
          },
        }),
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
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata,
        ...(customerInfo && {
          shipping: {
            name: customerInfo.customerType === 'residential' 
              ? customerInfo.locationName 
              : customerInfo.companyName,
            phone: customerInfo.phone,
            address: {
              line1: customerInfo.street || '',
              city: customerInfo.city || '',
              state: customerInfo.state || '',
              postal_code: customerInfo.zip || '',
              country: 'US',
            },
          },
        }),
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

  const httpServer = createServer(app);

  return httpServer;
}
