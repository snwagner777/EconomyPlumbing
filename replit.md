# Economy Plumbing Services - Project Documentation

## Overview

Economy Plumbing Services is a full-stack web application designed for a plumbing business operating in Austin and Marble Falls, Texas. Its primary purpose is to provide comprehensive information about plumbing services, service areas, blog content, and an online store for maintenance memberships. The project aims to enhance local SEO, user engagement, and conversion rates for the business.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React 18 with TypeScript.
- **Build System:** Vite.
- **Routing:** Wouter for client-side routing.
- **State Management:** TanStack Query for server state; React hooks for local state.
- **UI:** Radix UI primitives, Shadcn UI components ("new-york" style), Tailwind CSS with custom design tokens, and Class Variance Authority (CVA).
- **Design System:** Primary blue (#1E88E5), secondary teal (#3BA7A6), charcoal text, silver accents. Typography uses Inter and Poppins. Supports comprehensive light/dark modes. Professional, trustworthy aesthetic.
- **SEO & Performance:** Centralized `SEOHead` component for meta tags, OpenGraph, Twitter Cards, canonical URLs, and extensive JSON-LD schema markup (LocalBusiness, Service, FAQ, Product, BlogPosting) for all pages. Performance optimizations include resource preconnect, image lazy loading, and font optimization.

### Backend
- **Framework:** Express.js with TypeScript.
- **API:** RESTful design.
- **Data Layer:** Drizzle ORM for PostgreSQL (currently in-memory with planned migration).
- **API Endpoints:** `/api/blog`, `/api/blog/:slug`, `/api/products`, `/api/products/:slug`, `/api/contact`.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions.

### State Management
- **Client-Side:** TanStack Query for server state; React hooks for local component state.
- **Form Handling:** React Hook Form with Zod validation.

### Routing
- **Client-Side Routes:** Includes Home, About, Contact, Services (20+ specific pages), Service Areas (16 specific city pages), Blog, Store, FAQ, Privacy Policy, Refund/Returns, and VIP Membership benefits.

## Recent Changes

### October 2025 - Google Reviews Integration (COMPLETED)
- **Automated Review System:**
  - Google Places API integration fetches and caches reviews automatically
  - Backend endpoint (`/api/reviews`) with smart caching and filtering
  - Reviews auto-update on first load or when `?refresh=true` param is passed
  - Optional keyword filtering for contextual review display (comma-separated)
  - Minimum rating filter (default: 4+ stars, configurable via `minRating` param)
  - Query params: `keywords`, `minRating`, `refresh`
  
- **ReviewsSection Component:**
  - Responsive grid layout with author photos, 5-star ratings, review text
  - Direct links to Google profiles for proper attribution
  - Loading skeletons for smooth UX
  - Customizable via props: `title`, `keywords`, `minRating`, `maxReviews`
  - TanStack Query integration with 30-minute stale time
  
- **Strategic Placement (3 pages):**
  - **Homepage** (`/`): "What Our Customers Say" - displays up to 3 general reviews
  - **Services** (`/services`): "Trusted by Central Texas Homeowners" - up to 3 reviews
  - **Austin** (`/plumber-austin`): "Austin Customer Reviews" - up to 3 location reviews
  - All pages include "See All Reviews on Google" link to business profile
  
- **Technical Implementation:**
  - **Backend:** `server/lib/googleReviews.ts` handles Google Places API calls
  - **Storage:** Reviews cached in MemStorage until manual refresh
  - **Schema:** Full GoogleReview type in `shared/schema.ts` (id, authorName, authorUrl, profilePhotoUrl, rating, text, relativeTime, timestamp, fetchedAt)
  - **API Endpoint:** `/api/reviews` with query string support
  - **Environment Variables:** `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` (stored in Replit Secrets)
  - **Current Status:** Live with 2 reviews (Nick Allen & Jen Wall, both 5-star ratings)
  - **Google API Limitation:** Returns maximum 5 most recent reviews

### October 2025 - Domain Migration & OpenGraph Setup
- **Critical SEO Fix:** Migrated all canonical URLs, schema markup, and OpenGraph tags from economyplumbingservices.com to plumbersthatcare.com (48+ pages)
- **OpenGraph Image:** Created optimized 1200x630px og-image.jpg from hero image (47KB, JPEG progressive)
- **Complete Domain Update:** All internal links, documentation, and JSON-LD schemas now use correct production domain

### October 2025 - ServiceTitan Scheduler Site-Wide Fix
- **Bug Fix:** Replaced mock SchedulerModal with real ServiceTitan integration across 11 pages
- **Pages Updated:** Home, Services, ServiceAreas, About, FAQ, Austin, CedarPark, Leander, Georgetown, Pflugerville, RoundRock
- **Technical:** All "Schedule Service" buttons now call `openScheduler()` utility, loads ServiceTitan script on-demand
- **Domain Requirement:** Scheduler only functions on whitelisted domain plumbersthatcare.com

### October 2025 - SEO Optimization & Performance Enhancements
- **Schema Markup Enhancement:**
  - Service schema updated to include provider address and geo coordinates for better local SEO
  - Product schema URLs corrected from non-existent /store/checkout to /store
  - LocalBusiness and FAQ schemas properly implemented on Home page
  
- **Performance Optimizations:**
  - Hero images optimized with width="1920" height="1080" attributes for CLS prevention
  - Added `fetchpriority="high"` to all hero images for LCP optimization (PageSpeed recommendation)
  - Created TypeScript JSX namespace augmentation (`client/src/types/jsx.d.ts`) for proper fetchpriority support
  - Logo images have explicit width="85" height="48" dimensions to prevent layout shift
  - Lazy loading enabled on footer logo and all below-the-fold images
  - Header logo loads eagerly to prevent visual flash
  - Preconnect links updated with crossorigin attributes for fonts and ServiceTitan
  - Google Fonts configured with font-display: swap for better text rendering
  
- **Image Optimization (October 2025):**
  - Converted all hero images from PNG/JPG to WebP format using Sharp library
  - Homepage hero: 101KB JPG → 27KB WebP (73% reduction)
  - Backflow image: 100KB JPG → 14KB WebP (86% reduction)
  - Service page images: 7.4MB PNG → 104KB WebP (98.6% reduction)
  - All optimized images stored in `attached_assets/optimized/` directory
  - Logo: PNG → WebP conversion completed
  - Total bandwidth savings: ~7.4MB across all hero images
  
- **Meta Description Optimization:**
  - All 28 meta descriptions optimized to strict 150-160 character range
  - Distribution: 4@150, 2@151, 3@152, 6@153, 3@154, 2@155, 4@156, 1@157, 1@159, 2@160 chars
  
- **Canonical URLs:** Implemented SSR-compatible canonical URLs across all 48+ pages. Templates require explicit canonical props.

- **Service Area Page Differentiation:** Updated ServiceAreaPage template with unique content per city:
  - Added optional `heroImage`, `heroSubtitle`, and `cityHighlight` props
  - Implemented 9 unique hero images across 10 smaller service area pages
  - Each city page has localized content (Buda, Spicewood, Liberty Hill, Marble Falls, Granite Shoals, Burnet, Kyle, Bertram, Horseshoe Bay, Kingsland)
  
- **Cedar Park Route:** Fixed route consistency to use `/plumber-in-cedar-park--tx` (double hyphen) across all internal links.

### October 2025 - PageSpeed Insights Optimizations (Mobile Report: 65→Target 100)

**Initial Scores:** Performance 65/100, Accessibility 91/100, Best Practices 100/100, SEO 85/100

**Fixes Implemented:**

1. **Render-Blocking CSS Mitigation** (450ms potential savings)
   - Cannot modify Vite config per project constraints
   - Mitigated through route-level code splitting reducing critical CSS payload
   
2. **Image Optimization** (29 KiB savings)
   - Recompressed service card images (Commercial, Drain, Leak) with Sharp
   - Optimized to 660px width for 2x retina displays at 330px viewport
   - Quality reduced to 72% for better compression while maintaining visual quality

3. **Unused JavaScript Reduction** (351 KiB savings)
   - React.lazy code splitting already implemented for 40+ non-critical routes
   - Main bundle optimized by lazy-loading Blog, Store, FAQ, service areas, legal pages
   
4. **Unused CSS Reduction** (79 KiB savings)
   - Route-level code splitting reduces CSS payload per page
   - Tailwind optimization requires build config changes (constrained)

5. **Accessibility Improvements** (91→100 target)
   - Added `aria-label` to mobile menu button (dynamic: "Open/Close mobile menu")
   - Added `aria-expanded` attribute to mobile menu toggle
   - All images verified with descriptive alt attributes

6. **SEO Verification** (85→100 target)
   - Meta viewport confirmed present
   - All images have alt attributes
   - Proper link structure (no onClick navigation)
   - Meta descriptions optimized to 150-160 character range

### October 2025 - PageSpeed Performance Optimizations (100/100 Target)
- **Third-Party Script Deferral:**
  - ServiceTitan scheduler: Loads dynamically only when user clicks "Schedule Service" button (saves ~1.9MB initial load)
  - Google Analytics: Deferred using requestIdleCallback with setTimeout fallback for older browsers
  - Implemented in `client/src/lib/scheduler.ts` and `client/src/lib/analytics.ts`

- **Critical CSS & Font Optimization:**
  - Async font loading with preload and onload pattern for Google Fonts
  - Preloaded Inter WOFF2 font for hero text (LCP optimization)
  - DNS prefetch for all third-party domains (fonts.googleapis.com, static.servicetitan.com, googletagmanager.com)
  - Preconnect for critical font resources

- **Route-Level Code Splitting:**
  - Implemented React.lazy and Suspense for 40+ non-critical pages
  - Critical pages (Home, main services) eagerly loaded for best UX
  - Blog, Store, FAQ, legal pages, and service area pages lazy-loaded
  - Reduces initial bundle size significantly

- **Resource Optimization:**
  - All hero images WebP format with fetchpriority="high" for LCP
  - Explicit image dimensions prevent CLS
  - Optimized image loading patterns

### October 2025 - Analytics & Third-Party Integrations
- **Google Analytics 4 Integration:**
  - Implemented GA4 tracking with automatic page view tracking on route changes
  - Created analytics utility (`client/src/lib/analytics.ts`) for event tracking
  - Added custom hook (`client/src/hooks/use-analytics.tsx`) for route-based tracking
  - Environment variable: `VITE_GA_MEASUREMENT_ID` (configured in Replit Secrets)

- **ServiceTitan Scheduler Enhancement:**
  - Fixed async loading issue where scheduler failed when clicked before script loaded
  - Created scheduler utility (`client/src/lib/scheduler.ts`) with proper async handling
  - Implemented 5-second wait timeout with error logging
  - Added user-friendly fallback with phone numbers when scheduler unavailable
  - All "Schedule Service" buttons now use `openScheduler()` utility (10 buttons across 6 components)

- **Phone Link Standardization:**
  - All phone links updated to include +1 country code (e.g., `tel:+15123689159`)
  - Ensures proper mobile device compatibility across all browsers
  - Phone links work on mobile devices; desktop behavior varies by browser/OS configuration

## External Dependencies

- **Payment Processing:** Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`) for checkout.
- **Database:** Neon (PostgreSQL) via `@neondatabase/serverless` with Drizzle ORM.
- **Online Scheduler:** ServiceTitan (tenant ID: `3ce4a586-8427-4716-9ac6-46cb8bf7ac4f`) integrated for scheduling.
- **Email Integration:** Resend for transactional emails. Contact forms send to `cdd5d54b6e6c4413@teamchat.zoom.us`.
- **Social Media:** Facebook, Instagram, Yelp, Nextdoor.
- **Call Tracking:** Dynamic phone number insertion based on traffic source (Google, Facebook/Instagram, Yelp, Nextdoor). Default: (512) 649-2811. Marble Falls: (830) 460-3565 (static).
- **Development Tools:** Replit plugins, TypeScript, ESBuild, PostCSS & Autoprefixer.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple` for PostgreSQL session store (configured).
```