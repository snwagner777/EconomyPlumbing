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