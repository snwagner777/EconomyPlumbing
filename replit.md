# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance the online presence of a plumbing business in Austin and Marble Falls, Texas. It provides service information, covered areas, and blog content, alongside an **Ecwid-powered online store** for maintenance memberships and drop-shipped products. The project focuses on improving local SEO, user engagement, and conversion rates, featuring an AI-powered blog generation system and comprehensive SEO tools for optimal visibility and performance. The business vision is to expand market reach, improve customer engagement through an intuitive online platform, and leverage AI for content generation and SEO.

## User Preferences
Preferred communication style: Simple, everyday language.

## Development Standards
- **Client-Side Rendering (CSR) with Server-Side Metadata Injection:** Following the same proven approach as other projects (80%+ Ahrefs scores), this site uses React SPA with client-side rendering. Server-side middleware (`server/lib/metadataInjector.ts`) injects unique title/description/canonical tags into the initial HTML before sending to browsers/crawlers - ensuring meta tags are present WITHOUT JavaScript execution. This delivers crawler-ready SEO metadata while maintaining the simplicity of CSR. All metadata values are HTML-escaped to prevent injection attacks.
- **URL Normalization:** All trailing-slash URLs (e.g., `/about/`) automatically 301 redirect to non-trailing-slash versions (`/about`) to prevent duplicate content issues.
- **Source File Security:** `/src/*` files blocked with 403 Forbidden to prevent crawlers from indexing development files.
- **Curated Content for Crawlers:** Random/rotating content (reviews, blog posts) shown on pages must display curated, consistent content to crawlers (e.g., top-rated reviews, latest posts) instead of random selections. This ensures stable SEO signals.

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI is built using Radix UI, Shadcn UI, Tailwind CSS, and Class Variance Authority (CVA).
- **Design System:** Features a primary blue and secondary teal color scheme, charcoal text, and silver accents, with Inter and Poppins typography. Supports light/dark modes.
- **SEO & Performance:** Utilizes a centralized `SEOHead` component for meta tags, OpenGraph, Twitter Cards, and auto-generated canonical URLs. Default OpenGraph and Twitter Card tags are server-rendered in `index.html` using optimized 1200x630 social sharing image for immediate social media scraper visibility, with React Helmet providing page-specific overrides. Canonical URLs auto-generate from current route via `generateCanonicalUrl()` helper. JSON-LD structured data enriched with @id references, blog wordCount, and detailed service areaServed arrays (specific cities). 301 redirects implemented for duplicate URL aliases to consolidate SEO authority. All og:image URLs use absolute production URLs with cache-busting. Includes performance optimizations like resource preconnect, image lazy loading, font optimization, aggressive code splitting (only Home page eagerly loaded, all service/admin pages lazy loaded via React.lazy), and universal WebP image conversion. Dynamic sitemap auto-updates with all service areas.
- **Accessibility:** WCAG AA Compliant with focus on contrast ratios, descriptive link text (no generic "Learn More" or "Read More"), and proper OpenGraph image handling. All blog posts and success stories use their featured/hero images for social sharing, with site logo as fallback - never generic defaults.
- **Pages:** Includes Home, About, Contact, Service pages, Service Area pages, Blog (with RSS feed), Ecwid Store (with drop-shipping), FAQ, Privacy Policy, Refund/Returns, VIP Membership benefits, and conversion-optimized SEO landing pages.
- **RSS Feeds:** Blog RSS feed (`/rss.xml`) and Success Stories RSS feed (`/api/success-stories/rss.xml`) use pre-generated JPEG images for maximum RSS reader and social media automation compatibility (Zapier, etc.). New content automatically generates both WebP (website) and JPEG (RSS/social) versions at creation time. Legacy content uses fallback conversion endpoints.
- **Admin Panels:** 
  - Page Metadata management displays actual default SEO values (e.g., "Water Heater Services | Economy Plumbing") instead of generic "Default" placeholders, showing what title/description each page currently uses when no custom metadata is set.
  - Success Stories admin includes collage reprocessing tool to regenerate all existing collages with AI focal point detection for improved photo positioning
  - Drag-to-Position Collage Editor: Success story before/after images use an intuitive drag-based interface where admins can drag images around within the collage preview to precisely position the main subject. Features proper drag state tracking (stores starting position and focal point), natural movement with 0.5 scaling for 200% zoom, and pixel-perfect preview accuracy. Backend uses extract-based cropping to center focal points exactly as shown in preview, replacing previous discrete gravity positioning. Manual positioning overrides AI detection for precise control.
  - Products Admin (/admin/products): Manages VIP membership SKUs and ServiceTitan integration fields. Allows editing of SKU codes and Duration Billing IDs for each membership product, enabling automated sync via Zapier to ServiceTitan when customers purchase memberships.

### Backend
- **Framework & API:** Express.js with TypeScript, providing RESTful API endpoints.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products (reference only - Ecwid manages active products), Contact Submissions, Service Areas, Google Reviews, Commercial Customers.
- **E-commerce:** Ecwid platform handles all product management, checkout, payment processing, and inventory. Integrated with Printful (print-on-demand) and Spocket (US/EU drop-shipping) for automated order fulfillment.
- **AI Blog Generation System:** Uses OpenAI GPT-4o to analyze unused photos and generate SEO-optimized blog posts with smart topic suggestions, automated weekly creation, future-dated scheduling, and seasonal awareness.
- **Dynamic Phone Number Tracking:** Database-driven system for automatic phone number insertion based on traffic source (Google Ads, Bing, Facebook, etc.), with cookie persistence across user sessions and an admin panel for management.
- **Security:** OAuth-only authentication for the admin panel with single-email whitelist, rate limiting, httpOnly/secure session cookies, and sameSite CSRF protection.

### State Management
- **Client-Side:** TanStack Query for server state; React hooks for local component state.
- **Form Handling:** React Hook Form with Zod validation.

### Analytics & Third-Party Script Management
- **Multi-Platform Tracking:** Google Analytics 4, Meta Pixel, Google Tag Manager, Microsoft Clarity.
- **Performance-Optimized Loading:** All analytics scripts use aggressive deferral pattern - load on first user interaction (mousedown, touchstart, keydown, scroll) OR after 3 seconds maximum. This defers 300+ KiB of third-party scripts until after initial page render, significantly improving LCP and Time to Interactive. Pattern automatically applies to all pages via `initAllAnalytics()`.
- **Conversion Tracking:** Comprehensive tracking for contact forms, phone clicks, scheduler opens, memberships, and user-generated content.
- **Privacy Compliant:** Cookie consent integration.

## External Dependencies

- **E-commerce Platform:** Ecwid for product management, checkout, and payment processing. Integrated with Stripe for payments (managed by Ecwid). Drop-shipping via Printful (print-on-demand custom products) and Spocket (US/EU suppliers for 2-5 day shipping).
- **Database:** Neon (PostgreSQL) via `@neondatabase/serverless` with Drizzle ORM.
- **Online Scheduler:** ServiceTitan for appointment scheduling (integrated into contact forms).
- **Email Integration:** Resend for transactional emails and 404 alerts.
- **AI Services:** OpenAI (GPT-4o Vision) for blog generation, photo analysis, and success story focal point detection. Success story collages use AI-powered focal point detection to intelligently position before/after photos in Polaroid-style frames, ensuring the main subject is properly centered. Manual focal point editing overrides AI detection for precise control. Before/after composite creation is available but currently disabled per user preference.
- **Photo Management:** CompanyCam, Google Drive, and ServiceTitan integrations for multi-source photo import. Automatic cleanup deletes unused photos after 60 days. Google Drive photos are automatically deleted from Drive after successful download/import.
- **Google Services:** Google Places API for review updates, Google Maps.
- **SEO Data:** DataForSEO API for historical review import.
- **Social Media:** Meta Graph API for automated posting to Facebook/Instagram.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple`.
- **Image Processing:** Sharp library for dual-format image generation (WebP for website performance, JPEG for RSS/social media compatibility). All new blog posts and success stories automatically generate both formats at creation time, stored in object storage.