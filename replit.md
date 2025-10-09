# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application for a plumbing business in Austin and Marble Falls, Texas. It provides information on services, service areas, blog content, and an online store for maintenance memberships. The project aims to improve local SEO, user engagement, and conversion rates.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React 18 with TypeScript, Vite for building.
- **Routing:** Wouter for client-side routing.
- **State Management:** TanStack Query for server state; React hooks for local state.
- **UI:** Radix UI primitives, Shadcn UI components ("new-york" style), Tailwind CSS with custom design tokens, and Class Variance Authority (CVA).
- **Design System:** Uses a primary blue (#1E88E5) and secondary teal (#3BA7A6) color scheme, charcoal text, and silver accents. Typography uses Inter and Poppins. Supports light/dark modes and aims for a professional, trustworthy aesthetic.
- **SEO & Performance:** Features a centralized `SEOHead` component for meta tags, OpenGraph, Twitter Cards, canonical URLs, and extensive JSON-LD schema markup (LocalBusiness, Service, FAQ, Product, BlogPosting). Includes performance optimizations like resource preconnect, image lazy loading, and font optimization.
- **Client-Side Routes:** Covers Home, About, Contact, 20+ specific Service pages, 16 specific Service Area city pages, Blog, Store, FAQ, Privacy Policy, Refund/Returns, and VIP Membership benefits.
- **Optimizations:** Implements lazy loading for reviews and non-blocking background refresh for data. Optimized images to WebP format with explicit dimensions and `fetchpriority="high"`. Enhanced meta descriptions and canonical URLs across all pages. Implemented route-level code splitting using `React.lazy` and `Suspense` for non-critical pages. Applied React.memo optimization to frequently rendered card components (ServiceCard, BlogCard, TestimonialCard, WhyChooseCard) to prevent unnecessary re-renders.
- **Accessibility (WCAG AA Compliant):** All interactive text elements (links, phone numbers, emails, CTAs) use `text-foreground` instead of `text-primary` to meet 4.5:1 contrast ratio requirements. All buttons explicitly declare `bg-primary text-primary-foreground` for proper contrast. Favicon implemented for browser tabs and mobile devices. Cookie banner close button includes `aria-label` for screen readers. Open Graph images configured with dynamic URL construction for proper social sharing.
- **Reviews Integration:** Premium visual design with gradient backgrounds, testimonial cards, star ratings, and trust badges. Strategically positioned mid-page on homepage (after "Why Choose" section), service pages (before contact form), and blog posts (inline, floating right on desktop) for optimal conversion. Blog posts feature a single inline review card that floats to the right on desktop (320-384px wide) and displays full-width on mobile, positioned at the start of content. Service pages show 3 reviews in grid layout. Lazy-loads using Intersection Observer with 30-minute browser caching for zero initial page load impact. Reviews auto-categorized by service type and displayed contextually on relevant pages and blog posts.
- **Resource Hints:** Preconnect and DNS prefetch for critical third-party domains including Google Fonts, Google Analytics, Stripe JS, Google Maps API, and ServiceTitan scheduler to reduce connection latency.

### Backend
- **Framework:** Express.js with TypeScript.
- **API:** RESTful design with endpoints for `/api/blog`, `/api/blog/:slug`, `/api/products`, `/api/products/:slug`, `/api/contact`, and `/api/reviews`.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews.
- **Google Reviews Integration:** 
  - **One-Time Import:** DataForSEO API used for initial bulk import of 360 historical reviews. Can be re-triggered via `/api/reviews?refresh=true`.
  - **Ongoing Updates:** Google Places API fetches newest 5 reviews every 24 hours via background refresh (non-blocking server startup).
  - **Smart Deduplication:** Uses text + timestamp matching to detect duplicates. Automatically prefers Places API reviews (with author names, URLs, profile photos) over DataForSEO reviews (anonymous). When duplicates detected, deletes old DataForSEO version and keeps Places API version.
  - **Quality Filtering:** Only displays 4+ star reviews.
  - **Review Processing:** Auto-categorized into 11 service types (e.g., water_heater, drain, toilet) based on keyword analysis.
  - **API Endpoint:** `/api/reviews` with 30-minute browser caching (Cache-Control headers), filtering by category, keywords, and minimum rating.
  - **Multi-Source Support:** 495 total reviews (360 Google via DataForSEO, 125 Yelp, 10 Google via Places API). Architecture supports Google, Facebook, and Yelp reviews with platform-specific badges and links.
  - **Display Features:** Premium cards with platform badges (Google/Facebook/Yelp icons), hover-revealed links to original reviews, star ratings, and author avatars.
- **Performance Optimizations:**
  - **Compression:** Gzip/brotli compression middleware (level 6) reduces bandwidth by ~70%
  - **API Caching:** Aggressive Cache-Control headers on all GET endpoints (10min-2hr based on content volatility)
  - **Static Assets:** 1-year immutable cache headers for images and static files
  - **Database Indexes:** Strategic indexes on 9 frequently queried columns across 5 tables for 10-30% faster queries

### State Management
- **Client-Side:** TanStack Query for server state; React hooks for local component state.
- **Form Handling:** React Hook Form with Zod validation.

### Analytics & Third-Party Script Management
- **Google Analytics 4:** Integrated with automatic page view tracking.
- **ServiceTitan Scheduler:** Loads dynamically only when triggered by user interaction to improve initial page load performance. Includes error handling and a user-friendly fallback.
- **Third-Party Script Deferral:** ServiceTitan scheduler and Google Analytics scripts are deferred to optimize page load.

## External Dependencies

- **Payment Processing:** Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`).
- **Database:** Neon (PostgreSQL) via `@neondatabase/serverless` with Drizzle ORM.
- **Online Scheduler:** ServiceTitan for appointment scheduling.
- **Email Integration:** Resend for transactional emails.
- **Social Media:** Facebook, Instagram, Yelp, Nextdoor.
- **Call Tracking:** Dynamic phone number insertion for analytics with traffic source detection (Google, Facebook, Yelp, Nextdoor). Numbers automatically swap based on referrer/UTM parameters and persist via 90-day cookie.
  - **Implementation:** PhoneConfigContext provider listens to route changes and updates all components using usePhoneConfig() hook
  - **Phone Numbers:** 
    - Default/Austin: (512) 368-9159
    - Facebook/Instagram: (512) 575-3157
    - Yelp: (512) 893-7316
    - Nextdoor: (512) 846-9146
    - Marble Falls (static): (830) 460-3565
  - **Testing:** Add `?utm_source=facebook` or `?utm_source=yelp` to any URL and navigate between pages to see numbers update in real-time
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple` for PostgreSQL session store.
- **Google APIs:** Google Places API for ongoing review updates. DataForSEO API for one-time historical review import.
- **AI-Powered Photo Quality System:**
  - **OpenAI Vision Integration:** Uses GPT-4o to analyze job photos for quality (sharpness, lighting, composition, relevance).
  - **Auto Categorization:** AI categorizes photos into 11 plumbing types (water_heater, drain, leak, toilet, faucet, gas, backflow, commercial, general).
  - **Quality Filtering:** Only keeps photos scoring 7/10 or higher. Auto-rejects blurry, dark, or irrelevant images.
  - **ServiceTitan Photo Import:** Automatically fetches photos from completed jobs in last 30 days. Processes with AI before saving.
  - **Database Tracking:** companyCamPhotos table with quality scores, AI descriptions, tags, and usage tracking.
- **Before/After Photo Composer:**
  - **AI Pair Detection:** Uses GPT-4o vision to detect before/after photo pairs from same job (analyzes same location/fixture).
  - **Polaroid-Style Composites:** Creates professional before/after images with white borders and BEFORE/AFTER labels.
  - **AI-Generated Captions:** GPT-4o writes engaging social media captions (under 150 chars) with problem description, solution, and call-to-action.
  - **Storage:** beforeAfterComposites table with source photos, composite URL, caption, and social media tracking.
- **Social Media Auto-Posting:**
  - **Facebook/Instagram Integration:** Meta Graph API for posting to both platforms.
  - **Weekly Scheduler:** Automatically posts best before/after composite every Monday at 10am.
  - **Manual Override:** API endpoint `/api/social-media/post-best` to manually trigger posts for testing.
  - **Post Tracking:** Records Facebook/Instagram post IDs and timestamps.
  - **API Endpoints:**
    - `POST /api/photos/import-servicetitan` - Import photos from last 30 days of ServiceTitan jobs (with AI quality filtering)
    - `POST /api/photos/create-before-after` - Create before/after composites from a specific job ID
    - `GET /api/before-after-composites` - List all composites
    - `POST /api/social-media/post-best` - Manually post best composite to Facebook/Instagram
  - **Security Note:** Admin endpoints (create-before-after, post-best) are currently unauthenticated for internal use. Consider adding authentication for production use to prevent public misuse.
- **ServiceTitan Integration (Complete):** 
  - **Membership Sync:** Fully automated sync of online membership purchases to ServiceTitan CRM.
  - **Customer Management:** Searches for existing customers by email/phone; creates new residential or commercial customers if needed.
  - **Checkout Flow:** 
    1. Collects customer info (residential: name/address/phone/email; commercial: company/contact/address/phone/email)
    2. Saves pending purchase linked to Stripe payment intent ID
    3. User completes Stripe payment
  - **Webhook Processing:** 
    1. Verifies Stripe webhook signature (uses raw body middleware)
    2. Retrieves pending purchase by payment intent ID
    3. Creates membership record with status='pending'
    4. Deletes pending purchase
  - **Background Sync Job:** 
    1. Runs every 30 seconds (non-blocking server startup)
    2. Finds pending memberships
    3. Searches/creates ServiceTitan customer
    4. Creates invoice with membership pricebook item
    5. Marks invoice as paid
    6. Updates membership with ServiceTitan IDs and status='synced'
  - **Error Handling:** Failed syncs marked with error details for monitoring/retry.
  - **Data Model:** Complete with pending_purchases and service_titan_memberships tables, structured addresses, sync status tracking.
  - **Status:** Production-ready. Requires ServiceTitan API credentials (CLIENT_ID, CLIENT_SECRET, TENANT_ID, APP_KEY) and product membership type IDs.