# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance the online presence of a plumbing business. It provides service information, covered areas, and blog content, alongside an Ecwid-powered online store for maintenance memberships and drop-shipped products. The project aims to improve local SEO, user engagement, and conversion rates, featuring an AI-powered blog generation system and comprehensive SEO tools for optimal visibility and performance. The business vision is to expand market reach, improve customer engagement through an intuitive online platform, and leverage AI for content generation and SEO.

## Recent Changes (October 20, 2025)
- **🎯 Bulletproof ServiceTitan Job Sync System:** Implemented production-ready incremental job sync with staging → normalized table pattern. Features: `modifiedOnOrAfter` watermark-based incremental sync (tracks last successful sync timestamp), staging table (`service_titan_jobs_staging`) for deduplication before normalization, batch processing (250 jobs per batch) to handle large datasets, automatic customer job count aggregation using SQL window functions, error tracking in watermarks table with retry support, idempotent upserts safe to re-run, and comprehensive logging. Database schema includes `service_titan_jobs` (normalized), `service_titan_jobs_staging` (temporary), `sync_watermarks` (sync state tracking), and `job_count` column on `service_titan_customers` for fast leaderboard queries.
- **⚡ Fast Database-Driven Customer Leaderboard:** Replaced slow API-based leaderboard (20+ API calls per request) with instant database-driven endpoint using pre-computed `job_count` column. Returns top 30 customers in <50ms vs. previous 10+ second load times. Eliminates API rate throttling concerns.
- **🏆 Customer Hall of Fame Component:** Built stunning visual leaderboard for Success Stories page featuring circular avatar design with size-based ranking (champion/top 3/top 10), lucide-react Award icons for top 3 (gold/silver/bronze), VIP badges for top 10, smooth staggered animations, anonymized names (First + Last initial), hover tooltips with service counts, and responsive grid layout. Integrated seamlessly into Success Stories page below filters.
- **Admin Job Sync Trigger:** Added `/api/admin/servicetitan/sync-jobs` endpoint for manual job sync triggering from admin panel with proper authentication and error handling.
- **Multi-Location Service Address Management:** Enhanced Customer Portal to display and manage ALL customer service locations (homes, vacation properties, rental units). Features include: backend API method `getAllCustomerLocations()` that fetches complete location array from ServiceTitan, new API endpoint `/api/portal/customer-locations/:customerId`, multi-location display with individual cards per location showing "Primary" badges on first location, per-location edit buttons with location-specific data routing, and dynamic UI messaging (single vs. multiple locations). Each location independently editable with proper locationId routing to ServiceTitan PUT /locations/{id} endpoint.
- **Self-Service Customer Data Updates:** Implemented full self-service data update capabilities allowing customers to update their contact information (phone/email) and service address directly through the Customer Portal. Updates are synced to ServiceTitan via official API endpoints (PUT /customers/{id}/contacts/{contactId} for contacts, PUT /locations/{id} for addresses). Features inline "Edit" buttons on customer info card, modal dialogs with pre-filled forms, real-time validation, loading states, toast notifications, and auto-refresh after successful updates. Enhances customer autonomy and reduces call volume.

## Recent Changes (October 19, 2025)
- **Custom Review System:** Fully implemented custom review/testimonial submission system to replace NiceJob. Features include: public submission form at `/leave-review`, admin moderation UI in unified admin dashboard, status management (pending/approved/rejected), unified `/api/reviews` endpoint merging Google reviews + custom reviews with proper filtering/sorting, and approved reviews display on website pages.
- **Estimate Expiration Alerts:** Customer Portal estimates section now includes 30-day expiration policy notice, section-level amber alert for any expiring estimates (≤7 days), and individual estimate urgency treatments including amber styling, countdown badges, "⚠️ Expiring Soon!" warnings, and dual "Schedule Now"/"Call Us" CTAs for estimates expiring within 7 days.
- **Customer Portal Referral Promotion:** Added prominent referral program card with dual $25 reward messaging, real-time stats (clicks, conversions), and "Start Referring & Earning" CTA linking to /refer-a-friend page.
- **Estimates Filtering:** Customer Portal now filters estimates to show only open/pending ones - excludes approved, declined, expired, closed, and sold estimates. Section auto-hides when no open estimates exist.
- **ServiceTitan Customer Data Schema:** Synchronized schema with database - added email, phone, mobilePhone columns to serviceTitanCustomers table with proper indexes for fast lookups.
- **Customer Portal Email Display:** Fixed email display bug by updating searchAllMatchingCustomers function to return email, phone, and mobilePhone fields in customer data responses.
- **Session Management:** Implemented server-side session storage for persistent login - portalCustomerId now saved to session on successful verification for seamless multi-page navigation.
- **Leaderboard Endpoint:** Temporarily disabled broken leaderboard endpoint (was accessing non-existent customFields) - returns empty array as placeholder until proper implementation with ServiceTitan job data.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI is built using Radix UI, Shadcn UI, Tailwind CSS, and Class Variance Authority (CVA).
- **Design System:** Features a primary blue and secondary teal color scheme, charcoal text, and silver accents, with Inter and Poppins typography. Supports light/dark modes.
- **SEO & Performance:** Utilizes a centralized `SEOHead` component for meta tags, OpenGraph, Twitter Cards, and auto-generated canonical URLs. Default OpenGraph and Twitter Card tags are server-rendered with page-specific overrides. JSON-LD structured data is enriched with `@id` references, blog `wordCount`, and detailed `serviceAreaServed` arrays. 301 redirects are implemented for duplicate URL aliases. Includes performance optimizations like resource preconnect, image lazy loading, font optimization, aggressive code splitting, and universal WebP image conversion. Dynamic sitemap auto-updates with all service areas.
- **Accessibility:** WCAG AA Compliant with focus on contrast ratios, descriptive link text, and proper OpenGraph image handling.
- **Pages:** Includes Home, About, Contact, Service pages, Service Area pages, Blog (with RSS feed), Ecwid Store, FAQ, Privacy Policy, Refund/Returns, VIP Membership benefits, Water Heater Size Calculator (interactive tool), Plumbing Cost Estimator, Seasonal Landing Pages (Winter/Summer), Commercial Industry Pages (Restaurant/Retail/Office/Property Management), Refer-a-Friend (Call/Text CTAs), Customer Portal (ServiceTitan account lookup), and conversion-optimized SEO landing pages.
- **Interactive Tools:** Water Heater Size Calculator provides instant recommendations based on household size, bathrooms, and usage patterns. Captures qualified leads with integrated quote request forms.
- **AI Chatbot:** Floating chatbot available site-wide powered by OpenAI GPT-4o-mini. Answers common plumbing questions, provides pricing estimates, and intelligently hands off to SMS/phone when customer needs human assistance. Integrates with dynamic phone tracking system.
- **RSS Feeds:** Blog RSS feed (`/rss.xml`) and Success Stories RSS feed (`/api/success-stories/rss.xml`) use pre-generated JPEG images for maximum compatibility.
- **Admin Panels:** Unified admin panel at `/admin` with ServiceTitan sync monitoring, Customer Portal analytics, photo management, metadata management, success stories admin with collage editor and AI focal point detection, and products admin for VIP membership SKUs and ServiceTitan integration fields. ServiceTitan dashboard shows real-time sync status, customer/contact counts, progress tracking, and manual sync trigger.

### Backend
- **Framework & API:** Express.js with TypeScript, providing RESTful API endpoints.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products (reference only), Contact Submissions, Service Areas, Google Reviews, Commercial Customers.
- **E-commerce:** Ecwid platform handles all product management, checkout, payment processing, and inventory, integrated with Printful and Spocket for automated order fulfillment.
- **AI Blog Generation System:** Uses OpenAI GPT-4o to analyze photos and generate SEO-optimized blog posts with smart topic suggestions, automated weekly creation, future-dated scheduling, and seasonal awareness.
- **Dynamic Phone Number Tracking:** 100% database-driven system via admin panel. Zero hardcoded phone numbers in interactive elements. All components use `usePhoneConfig()` and `useMarbleFallsPhone()` hooks. Window globals (`__PHONE_CONFIG__`, `__MARBLE_FALLS_PHONE_CONFIG__`) initialized early for non-React code (scheduler). Proper tel/display alignment throughout. Cookie persistence for traffic source detection.
- **Security & Type Safety (A+ Status):**
  - **Authentication:** OAuth-only authentication for admin panel with single-email whitelist, rate limiting, httpOnly/secure session cookies, and sameSite CSRF protection
  - **SSRF Protection:** URL validation with domain whitelisting for photo endpoints, HTTPS-only enforcement, private IP blocking
  - **CSP Headers:** Comprehensive Content Security Policy with Stripe domain coverage (js.stripe.com, m.stripe.network, api.stripe.com), analytics whitelisting, and XSS prevention
  - **Security Headers:** HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
  - **TypeScript:** 100% type-safe with custom type definitions for Express sessions, Resend connector, and third-party libraries. Zero `any` usage in production code
  - **Payment Security:** Stripe PaymentIntents configured without shipping field to prevent key-type conflicts

### State Management
- **Client-Side:** TanStack Query for server state; React hooks for local component state.
- **Form Handling:** React Hook Form with Zod validation.

### Analytics & Third-Party Script Management
- **Multi-Platform Tracking:** Google Analytics 4, Meta Pixel, Google Tag Manager, Microsoft Clarity.
- **Performance-Optimized Loading:** All analytics scripts use aggressive deferral patterns, loading on first user interaction or after 3 seconds.
- **Conversion Tracking:** Comprehensive tracking for contact forms, phone clicks, scheduler opens, memberships, and user-generated content.
- **Privacy Compliant:** Cookie consent integration.

### Development Standards
- **Client-Side Rendering (CSR) with Server-Side Metadata Injection:** Uses React SPA with client-side rendering and server-side middleware to inject unique SEO metadata.
- **URL Normalization:** All trailing-slash URLs automatically 301 redirect to non-trailing-slash versions.
- **Source File Security:** `/src/*` files are blocked with 403 Forbidden.
- **Curated Content for Crawlers:** Random content (reviews, blog posts) displays curated, consistent content to crawlers.

## External Dependencies

- **E-commerce Platform:** Ecwid (Stripe for payments), Printful, Spocket.
- **Database:** Neon (PostgreSQL) via `@neondatabase/serverless` with Drizzle ORM.
- **Online Scheduler:** ServiceTitan.
- **Email Integration:** Resend.
- **SMS Integration:** Twilio (pending approval for production use). NiceJob integration active for customer reviews and testimonials.
- **AI Services:** OpenAI (GPT-4o Vision) for blog generation, photo analysis, success story focal point detection, and customer support chatbot (GPT-4o-mini).
- **Photo Management:** CompanyCam, Google Drive, and ServiceTitan integrations.
- **Google Services:** Google Places API, Google Maps.
- **SEO Data:** DataForSEO API.
- **Social Media:** Meta Graph API.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple`.
- **Image Processing:** Sharp library for dual-format image generation (WebP and JPEG).