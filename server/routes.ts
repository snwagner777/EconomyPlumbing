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
import { fetchDataForSeoYelpReviews } from "./lib/dataForSeoYelpReviews";
import { fetchFacebookReviews } from "./lib/facebookReviews";
import { notifySearchEnginesNewPage } from "./lib/sitemapPing";
import { processBlogImage } from "./lib/blogImageProcessor";
import path from "path";
import fs from "fs";
import { ObjectStorageService } from "./objectStorage";

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
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
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
      const baseUrl = "https://plumbersthatcare.com";
      const now = new Date().toISOString().split('T')[0];
      
      // Static pages with priorities
      const staticPages = [
        { url: '', lastmod: now, changefreq: 'weekly', priority: '1.0' },
        
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
        { url: 'toilet-repair-services', lastmod: now, changefreq: 'monthly', priority: '0.8' },
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
        
        // Blog index
        { url: 'blog', lastmod: now, changefreq: 'weekly', priority: '0.8' },
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
    <loc>${baseUrl}/blog/${post.slug}</loc>
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
      const croppedImagePath = await processBlogImage(imagePath, blogTitle);
      
      res.json({ 
        original: imagePath,
        cropped: croppedImagePath,
        message: "Image processed successfully" 
      });
    } catch (error) {
      console.error('[API] Error processing blog image:', error);
      res.status(500).json({ message: "Failed to process image" });
    }
  });

  // RSS Feed
  app.get("/rss.xml", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      const baseUrl = "https://plumbersthatcare.com";
      
      const rssItems = posts
        .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
        .map(post => {
          const postUrl = `${baseUrl}/blog/${post.slug}`;
          const imageUrl = post.featuredImage ? 
            (post.featuredImage.startsWith('http') ? post.featuredImage : `${baseUrl}${post.featuredImage}`) : 
            `${baseUrl}/attached_assets/logo.jpg`;
          
          // HTML-escape the title for safe use in attributes
          const escapedTitle = post.title
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
          
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
      ${post.featuredImage ? `<enclosure url="${imageUrl}" type="image/jpeg" length="0" />` : ''}
      ${post.featuredImage ? `<media:content url="${imageUrl}" type="image/jpeg" medium="image"><media:title><![CDATA[${post.title}]]></media:title></media:content>` : ''}
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

        // Send sales notification email
        try {
          const { sendSalesNotificationEmail } = await import('./email');
          await sendSalesNotificationEmail({
            productName: product.name,
            productPrice: product.price,
            customerType: pendingPurchase.customerType as 'residential' | 'commercial',
            customerName: pendingPurchase.customerName || undefined,
            companyName: pendingPurchase.companyName || undefined,
            contactPersonName: pendingPurchase.contactPersonName || undefined,
            email: pendingPurchase.email,
            phone: pendingPurchase.phone,
            street: pendingPurchase.street,
            city: pendingPurchase.city,
            state: pendingPurchase.state,
            zip: pendingPurchase.zip,
            stripePaymentIntentId: paymentIntent.id,
          });
          console.log(`[Stripe Webhook] Sales notification email sent for payment: ${paymentIntent.id}`);
        } catch (emailError: any) {
          // Don't fail the webhook if email fails
          console.error('[Stripe Webhook] Failed to send sales notification email:', emailError.message);
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

    if (combined.includes("water heater") || combined.includes("tank") || combined.includes("heater")) {
      return "water_heater";
    }
    if (combined.includes("drain") || combined.includes("clog")) {
      return "drain";
    }
    if (combined.includes("leak") || combined.includes("drip")) {
      return "leak";
    }
    if (combined.includes("toilet")) {
      return "toilet";
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

  // Zapier webhook endpoint for receiving job photos
  app.post("/api/photos/webhook", async (req, res) => {
    try {
      const { photos, jobId, jobDescription, customerName } = req.body;

      // Support both single photo and batch of photos
      const photoArray = Array.isArray(photos) ? photos : [{ photoUrl: req.body.photoUrl, jobId, jobDescription, customerName }];

      if (!photoArray.length || !photoArray[0].photoUrl) {
        return res.status(400).json({
          message: "Photo URL is required. Send either 'photoUrl' or 'photos' array with photoUrl in each object."
        });
      }

      console.log(`[Zapier Webhook] Received ${photoArray.length} photo(s) for processing`);

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

          // Download photo and save locally to server
          const fs = await import('fs/promises');
          const path = await import('path');
          
          // Fetch the photo from CompanyCam URL
          const photoResponse = await fetch(photo.photoUrl);
          const photoBuffer = Buffer.from(await photoResponse.arrayBuffer());
          
          // Create category subfolder
          const categoryFolder = path.join('attached_assets/imported_photos', category);
          await fs.mkdir(categoryFolder, { recursive: true });
          
          // Generate unique filename
          const timestamp = Date.now();
          const photoIdHash = Buffer.from(photo.photoUrl).toString('base64').substring(0, 16);
          const extension = photo.photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const localFileName = `companycam_${timestamp}_${photoIdHash}.${extension}`;
          const localFilePath = path.join(categoryFolder, localFileName);
          
          // Save file to disk
          await fs.writeFile(localFilePath, photoBuffer);
          console.log(`[Zapier Webhook] 💾 Saved to server: ${localFilePath}`);

          // Generate unique photo ID from URL hash
          const photoId = Buffer.from(photo.photoUrl).toString('base64').substring(0, 32);
          const projectId = photo.jobId || jobId || 'zapier-import';

          const processedPhoto = {
            companyCamPhotoId: photoId,
            companyCamProjectId: projectId,
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

      res.json({
        success: true,
        imported: savedPhotos.length,
        rejected: rejectedPhotos.length,
        photos: savedPhotos,
        rejectedPhotos: rejectedPhotos,
        message: `Successfully imported ${savedPhotos.length} quality photos. Rejected ${rejectedPhotos.length} low-quality/irrelevant photos.`
      });
    } catch (error: any) {
      console.error("[Zapier Webhook] Error:", error);
      res.status(500).json({
        message: "Photo webhook processing failed",
        error: error.message
      });
    }
  });

  // Import photos from Google Drive folder
  app.post("/api/photos/import-google-drive", async (req, res) => {
    try {
      const { folderId, createBeforeAfter = true } = req.body;

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

      const processedPhotos = [];
      const rejectedPhotos = [];

      // Process each image
      for (const file of files) {
        try {
          console.log(`[Google Drive Import] Processing: ${file.name}`);

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

          // Save photo locally to server
          const fs = await import('fs/promises');
          const path = await import('path');
          
          // Create category subfolder
          const categoryFolder = path.join('attached_assets/imported_photos', category);
          await fs.mkdir(categoryFolder, { recursive: true });
          
          // Generate unique filename
          const timestamp = Date.now();
          const sanitizedName = file.name?.replace(/[^a-zA-Z0-9._-]/g, '_') || 'unnamed';
          const localFileName = `${timestamp}_${sanitizedName}`;
          const localFilePath = path.join(categoryFolder, localFileName);
          
          // Save file to disk
          await fs.writeFile(localFilePath, buffer);
          console.log(`[Google Drive Import] 💾 Saved to server: ${localFilePath}`);

          // Create photo record with local file path
          const photoId = file.id || Buffer.from(file.name || '').toString('base64').substring(0, 32);

          const processedPhoto = {
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

          processedPhotos.push(processedPhoto);
          console.log(`[Google Drive Import] ✅ Accepted ${file.name} - Category: ${category}, Score: ${analysis.qualityScore}/10`);
        } catch (error: any) {
          console.error(`[Google Drive Import] Error processing ${file.name}:`, error);
          rejectedPhotos.push({
            fileName: file.name,
            error: error.message
          });
        }
      }

      // Save to database
      const savedPhotos = processedPhotos.length > 0
        ? await storage.savePhotos(processedPhotos)
        : [];

      let composites: any[] = [];

      // Automatically create before/after composites if requested
      if (createBeforeAfter && savedPhotos.length >= 2) {
        console.log(`[Google Drive Import] Creating before/after composites...`);
        const { processBeforeAfterPairs } = await import("./lib/beforeAfterComposer");
        
        // Group photos by category for better before/after matching
        const photosByCategory: Record<string, any[]> = {};
        for (const photo of savedPhotos) {
          if (!photosByCategory[photo.category]) {
            photosByCategory[photo.category] = [];
          }
          photosByCategory[photo.category].push(photo);
        }

        // Process each category
        for (const [category, photos] of Object.entries(photosByCategory)) {
          if (photos.length >= 2) {
            try {
              const categoryComposites = await processBeforeAfterPairs(photos, `google-drive-${category}`);
              for (const composite of categoryComposites) {
                const saved = await storage.saveBeforeAfterComposite(composite);
                composites.push(saved);
              }
            } catch (error: any) {
              console.error(`[Google Drive Import] Error creating composites for ${category}:`, error);
            }
          }
        }
      }

      // Organize results by category
      const photosByCategory: Record<string, any[]> = {};
      const categoryStats: Record<string, { count: number; avgScore: number }> = {};
      
      for (const photo of savedPhotos) {
        if (!photosByCategory[photo.category]) {
          photosByCategory[photo.category] = [];
          categoryStats[photo.category] = { count: 0, avgScore: 0 };
        }
        photosByCategory[photo.category].push(photo);
        categoryStats[photo.category].count++;
        categoryStats[photo.category].avgScore += photo.qualityScore || 0;
      }

      // Calculate average scores
      for (const category in categoryStats) {
        categoryStats[category].avgScore = categoryStats[category].avgScore / categoryStats[category].count;
      }

      console.log(`[Google Drive Import] Complete: ${savedPhotos.length} photos saved, ${composites.length} composites created, ${rejectedPhotos.length} rejected`);
      console.log(`[Google Drive Import] Categories:`, Object.keys(photosByCategory).join(', '));

      res.json({
        success: true,
        summary: {
          totalImported: savedPhotos.length,
          totalRejected: rejectedPhotos.length,
          compositesCreated: composites.length,
          categories: Object.keys(photosByCategory).length,
        },
        organization: {
          byCategory: photosByCategory,
          categoryStats,
        },
        photos: savedPhotos,
        composites,
        rejectedPhotos,
        message: `Successfully imported ${savedPhotos.length} quality photos across ${Object.keys(photosByCategory).length} categories and created ${composites.length} before/after composites. Rejected ${rejectedPhotos.length} low-quality/irrelevant photos.`
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

  const httpServer = createServer(app);

  return httpServer;
}
