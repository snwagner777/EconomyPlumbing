# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application for a plumbing business in Austin and Marble Falls, Texas. It provides service information, covered areas, and blog content. A key feature is an online store for maintenance memberships. The project aims to enhance local SEO, boost user engagement, and improve conversion rates. The system also includes an AI-powered blog generation system and comprehensive SEO features for optimal performance and visibility.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI is built with Radix UI, Shadcn UI, Tailwind CSS, and Class Variance Authority (CVA).
- **Design System:** Features a primary blue and secondary teal color scheme, charcoal text, and silver accents, with Inter and Poppins typography. Supports light/dark modes, aiming for a professional aesthetic.
- **SEO & Performance:** Centralized `SEOHead` component for meta tags, OpenGraph, Twitter Cards, canonical URLs, and extensive JSON-LD schema. Includes performance optimizations like resource preconnect, image lazy loading, font optimization, client-side code splitting, and universal WebP image conversion. Dynamic sitemap with auto-updates.
- **Client-Side Routes:** Covers Home, About, Contact, 20+ Service pages, 16 Service Area pages, Blog (with RSS feed), Store, FAQ, Privacy Policy, Refund/Returns, and VIP Membership benefits.
- **Accessibility:** WCAG AA Compliant with focus on contrast ratios, `aria-label` usage, and dynamic Open Graph image construction.
- **Reviews Integration:** Premium visual design for testimonials, strategically placed, auto-categorized by service type, lazy-loaded, and cached.
- **PageSpeed Optimization:** Implements image optimization (width/height attributes, fetchpriority="high", loading="lazy", decoding="async"), resource hints (DNS prefetch, preconnect, font preload), deferred third-party scripts (Google Analytics, ServiceTitan scheduler), and optimized CSS delivery for Core Web Vitals.

### Backend
- **Framework & API:** Express.js with TypeScript, providing RESTful API endpoints.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews.
- **Google Reviews Integration:** Bulk import via DataForSEO API; ongoing updates via Google Places API with deduplication, quality filtering (4+ star), and auto-categorization into 11 service types. Supports multi-source reviews.
- **Performance Optimizations:** Gzip/brotli compression, aggressive API caching with Cache-Control headers, 1-year immutable cache for static assets, and strategic database indexing.
- **AI Blog Generation System:** Uses OpenAI GPT-4o to analyze unused photos and generate SEO-optimized blog posts with smart topic suggestions. Features automated weekly blog creation, future-dated scheduling, and seasonal awareness.
- **404 Error Monitoring:** Automated tracking of 404 errors in the database with immediate email alerts via Resend.
- **Domain Redirect Middleware:** Automatically redirects all traffic from `.replit.app` to `www.plumbersthatcare.com` using a 301 permanent redirect for SEO.

### State Management
- **Client-Side:** TanStack Query for server state; React hooks for local component state.
- **Form Handling:** React Hook Form with Zod validation.

### Analytics & Third-Party Script Management
- Google Analytics 4 integration with deferred loading.
- ServiceTitan Scheduler loads on-demand.

## External Dependencies

- **Payment Processing:** Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`).
- **Database:** Neon (PostgreSQL) via `@neondatabase/serverless` with Drizzle ORM.
- **Online Scheduler:** ServiceTitan for appointment scheduling.
- **Email Integration:** Resend for transactional emails and 404 alerts.
- **Social Media:** Facebook, Instagram, Yelp, Nextdoor.
- **Call Tracking:** Dynamic phone number insertion based on traffic source.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple` for PostgreSQL session store.
- **Google APIs:** Google Places API for review updates, DataForSEO API for historical review import.
- **AI-Powered Photo Quality System:** OpenAI Vision (GPT-4o) for analyzing job photos for quality, categorization, and filtering.
- **WebP Conversion:** Sharp library for universal WebP conversion of photos from CompanyCam and Google Drive imports.
- **Multi-Source Photo Import:** CompanyCam via Zapier webhook, Google Drive (bulk import), and ServiceTitan.
- **Before/After Photo Composer:** AI (GPT-4o vision) for detecting before/after photo pairs and generating Polaroid-style composite images as WebP with AI-generated captions.
- **Social Media Auto-Posting:** Meta Graph API for automated weekly posting of best before/after composites to Facebook/Instagram.
- **ServiceTitan Integration:** Automated sync of online membership purchases to ServiceTitan CRM, including customer creation, invoice generation, and payment processing, handled via secure Stripe webhooks and background sync jobs.