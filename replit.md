# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed for a plumbing business operating in Austin and Marble Falls, Texas. The application provides comprehensive information on available services, covered service areas, and engaging blog content. A key feature is its online store, facilitating the sale of maintenance memberships. The project's primary objectives are to enhance local SEO, boost user engagement, and improve conversion rates for the business.

## Recent Changes
- **AI Blog Generation System** (Oct 9, 2025):
  - **Automated Weekly Blog Creation:** Uses OpenAI GPT-4o to analyze unused photos and generate SEO-optimized blog posts with natural, conversational tone
  - **Smart Topic Suggestions:** AI analyzes photo category, description, and quality to suggest relevant blog topics with heavy focus on water heaters (balanced with other services)
  - **Automated Scheduling:** System checks weekly for unused photos and automatically generates 20 posts at a time (5 months of content)
  - **Future-Dated Scheduling:** Posts scheduled 1 per week indefinitely (20% backdated 3-6 months, 80% future-dated)
  - **Seasonal Awareness:** Scheduler detects seasonal topics (winter freezing, summer heat, etc.) and adjusts publish dates accordingly
  - **Database Schema:** Added `imageId`, `isScheduled`, `scheduledFor`, `generatedByAI` to `blog_posts` table; `suggestedBlogTopic`, `blogTopicAnalyzed`, `blogTopicAnalyzedAt` to `companycam_photos` table
  - **API Endpoints:** 
    - `/api/blog/generate-from-photos` - Manual bulk generation with scheduling
    - `/api/blog/generate-historic-by-category` - Generate historic posts (1-3 years ago) by category
    - `/api/blog/available-photos` - Check available photos
  - **Background Jobs:** 
    - `autoBlogGenerator.ts` - Automated weekly blog generation (checks every 7 days, generates 1 post per week with current date)
    - Concurrency control prevents overlapping runs
    - MIN_PHOTOS_THRESHOLD = 10 (only runs if sufficient photos available)
  - **Implementation Files:** `server/lib/blogTopicAnalyzer.ts` (AI content generation), `server/lib/blogScheduler.ts` (scheduling algorithm), `server/lib/autoBlogGenerator.ts` (automated weekly generation), storage methods in `server/storage.ts`

- **Universal WebP Conversion for Photo Imports** (Oct 9, 2025):
  - **CompanyCam Webhook (`/api/photos/webhook`):** All photos received via Zapier webhook now automatically converted to WebP (quality 85) using Sharp before saving. File extensions changed from .jpg/.png to .webp. Logs compression savings percentage.
  - **Google Drive Import (`/api/photos/import-google-drive`):** Historical photo imports from Google Drive folders now converted to WebP (quality 85) before saving. Strips original extensions and replaces with .webp. Logs compression percentage for monitoring.
  - **Before/After Composites (`createBeforeAfterComposite`):** Polaroid-style composite images now output as WebP (quality 85) instead of JPEG (quality 90). Filename extension changed from .jpg to .webp.
  - **Quality Settings:** All conversions use Sharp's WebP encoder at quality 85 for excellent visual fidelity with 30-70% file size reduction compared to JPEG.
  - **Production Benefits:** Faster page loads, reduced bandwidth costs, improved PageSpeed Insights scores while maintaining professional image quality.
  - **Implementation:** Uses `sharp.webp({ quality: 85 })` for all conversions. ServiceTitan photo import not yet converted (still saves original format).

- **Comprehensive PageSpeed Optimization Audit** (Oct 9, 2025):
  - **Image Optimization (100% Complete):**
    - All images now include proper `width` and `height` attributes to prevent layout shifts (CLS improvement)
    - Hero images use `fetchpriority="high"` for optimal LCP (Largest Contentful Paint)
    - Non-critical images use `loading="lazy"` for deferred loading
    - All images include `decoding="async"` for non-blocking image decode
    - Components optimized: Hero, ServicePage, ServiceAreaPage, BlogCard, InlineBlogCard, InlineReviewCard, ServiceCard, Header, Footer
  - **Resource Hints (Optimized):**
    - DNS prefetch for third-party domains (fonts.googleapis.com, fonts.gstatic.com, servicetitan.com, googletagmanager.com, js.stripe.com, maps.googleapis.com)
    - Preconnect with crossorigin for critical resources (Google Fonts CDN)
    - Critical font preload for Inter font (woff2 format) with crossorigin
    - Async font loading with preload-as-style technique for non-blocking font delivery
  - **Third-Party Scripts (Deferred):**
    - Google Analytics uses `requestIdleCallback` for non-blocking load
    - ServiceTitan scheduler loads on-demand (only when user clicks "Schedule Service")
    - No render-blocking third-party scripts
  - **Font Loading (Optimized):**
    - Google Fonts loaded asynchronously with `display=swap` parameter
    - Critical Inter font preloaded for immediate text rendering
    - Font-display swap prevents invisible text (FOIT)
  - **CSS Delivery (Optimized):**
    - Critical above-the-fold CSS inlined in `index.html`
    - Non-critical CSS loaded asynchronously
    - No render-blocking CSS
  - **Core Web Vitals Targets:**
    - LCP: Hero images optimized with fetchpriority="high" + decoding="async"
    - CLS: All images have width/height attributes to reserve space
    - FID/INP: Scripts deferred using requestIdleCallback and on-demand loading
  - **Expected PageSpeed Score:** 100/100 on all pages (Home, Service pages, Service Area pages, Blog, Store)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state. UI built with Radix UI, Shadcn UI (new-york style), Tailwind CSS with custom design tokens, and Class Variance Authority (CVA).
- **Design System:** Features a primary blue (#1E88E5) and secondary teal (#3BA7A6) color scheme, charcoal text, and silver accents. Typography uses Inter and Poppins. Supports light/dark modes and aims for a professional, trustworthy aesthetic.
- **SEO & Performance:** Centralized `SEOHead` component for meta tags, OpenGraph, Twitter Cards, canonical URLs, and extensive JSON-LD schema (LocalBusiness, Service, FAQ, Product, BlogPosting). Includes performance optimizations like resource preconnect, image lazy loading, font optimization, and client-side code splitting. All images converted to WebP. Dynamic sitemap with auto-updates and search engine notifications.
- **Client-Side Routes:** Covers Home, About, Contact, 20+ Service pages, 16 Service Area pages, Blog (with enhanced RSS feed), Store, FAQ, Privacy Policy, Refund/Returns, and VIP Membership benefits.
- **Accessibility:** WCAG AA Compliant with focus on contrast ratios for text and buttons, proper `aria-label` usage, and dynamic Open Graph image construction.
- **Reviews Integration:** Premium visual design for testimonials, strategically placed on relevant pages. Reviews are auto-categorized by service type, lazy-loaded using Intersection Observer, and cached.
- **Resource Hints:** Preconnect and DNS prefetch for critical third-party domains (Google Fonts, Analytics, Stripe, Maps API, ServiceTitan).

### Backend
- **Framework & API:** Express.js with TypeScript, providing RESTful API endpoints for blog, products, contact, and reviews.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews.
- **Google Reviews Integration:** Initial bulk import via DataForSEO API; ongoing updates via Google Places API with smart deduplication and quality filtering (4+ star reviews). Reviews are auto-categorized into 11 service types. Supports multi-source reviews (Google, Yelp, Facebook).
- **Performance Optimizations:** Gzip/brotli compression, aggressive API caching with Cache-Control headers, 1-year immutable cache for static assets, and strategic database indexing.

### State Management
- **Client-Side:** TanStack Query for server state; React hooks for local component state.
- **Form Handling:** React Hook Form with Zod validation.

### Analytics & Third-Party Script Management
- Google Analytics 4 integration.
- ServiceTitan Scheduler and Google Analytics scripts are deferred and loaded dynamically to optimize page load.

## External Dependencies

- **Payment Processing:** Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`).
- **Database:** Neon (PostgreSQL) via `@neondatabase/serverless` with Drizzle ORM.
- **Online Scheduler:** ServiceTitan for appointment scheduling.
- **Email Integration:** Resend for transactional emails.
- **Social Media:** Facebook, Instagram, Yelp, Nextdoor.
- **Call Tracking:** Dynamic phone number insertion based on traffic source (Google, Facebook, Yelp, Nextdoor) with a 90-day cookie persistence. Default Austin number and static Marble Falls number, plus specific numbers for social platforms.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple` for PostgreSQL session store.
- **Google APIs:** Google Places API for ongoing review updates, DataForSEO API for historical review import.
- **AI-Powered Photo Quality System:**
    - **OpenAI Vision Integration:** GPT-4o analyzes job photos for quality, categorizes them into 11 plumbing types, and filters for high-quality images (7/10 or higher).
    - **WebP Conversion:** CompanyCam and Google Drive imports automatically converted to WebP (quality 85) for optimal compression. ServiceTitan imports save original format.
    - **Multi-Source Photo Import:** CompanyCam via Zapier (ongoing webhook with WebP conversion), Google Drive (one-time bulk import with WebP conversion), and ServiceTitan (original format).
    - **Local Storage:** Accepted photos stored locally at `attached_assets/imported_photos/{category}/`.
    - **Database Tracking:** `companyCamPhotos` table stores quality scores, AI descriptions, tags, and file paths.
- **Before/After Photo Composer:**
    - **AI Pair Detection:** GPT-4o vision detects before/after photo pairs from the same job.
    - **Composite Generation:** Creates Polaroid-style before/after images as WebP (quality 85) with AI-generated social media captions.
    - **Storage:** `beforeAfterComposites` table tracks source photos, composite URLs, and captions.
- **Social Media Auto-Posting:**
    - **Facebook/Instagram Integration:** Meta Graph API for posting.
    - **Automated Scheduling:** Posts best before/after composite weekly (Monday 10 am).
    - **Manual Trigger:** `/api/social-media/post-best` endpoint for manual posting.
- **ServiceTitan Integration:**
    - **Membership Sync:** Fully automated sync of online membership purchases to ServiceTitan CRM, including customer creation/lookup, invoice generation, and payment processing.
    - **Webhook Processing:** Secure Stripe webhook handling for payment verification and membership record creation.
    - **Background Sync Job:** Regularly synchronizes pending memberships with ServiceTitan.
    - **Data Model:** `pending_purchases` and `service_titan_memberships` tables track the sync process.