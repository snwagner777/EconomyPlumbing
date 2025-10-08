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
- **Reviews Integration:** Premium visual design with gradient backgrounds, testimonial cards, star ratings, and trust badges. Strategically positioned mid-page on homepage (after "Why Choose" section) and service pages (before contact form) for optimal conversion. Lazy-loads using Intersection Observer with 30-minute browser caching for zero initial page load impact.
- **Resource Hints:** Preconnect and DNS prefetch for critical third-party domains including Google Fonts, Google Analytics, Stripe JS, Google Maps API, and ServiceTitan scheduler to reduce connection latency.

### Backend
- **Framework:** Express.js with TypeScript.
- **API:** RESTful design with endpoints for `/api/blog`, `/api/blog/:slug`, `/api/products`, `/api/products/:slug`, `/api/contact`, and `/api/reviews`.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews.
- **Google Reviews Integration:** 
  - **One-Time Import:** DataForSEO API used once for initial bulk import of 550+ historical reviews (now disabled for cost efficiency).
  - **Ongoing Updates:** Google Places API fetches newest 5 reviews every 24 hours via background refresh (non-blocking server startup).
  - **Quality Filtering:** Only displays 4+ star reviews with named authors (excludes "Anonymous" reviews).
  - **Review Processing:** Auto-categorized into 11 service types (e.g., water_heater, drain, toilet) based on keyword analysis.
  - **API Endpoint:** `/api/reviews` with 30-minute browser caching (Cache-Control headers), filtering by category, keywords, and minimum rating.
  - **Multi-Source Support:** Architecture supports Google, Facebook, and Yelp reviews with platform-specific badges and links.
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
- **Call Tracking:** Dynamic phone number insertion for analytics, with a default and static Marble Falls number.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple` for PostgreSQL session store.
- **Google APIs:** Google Places API for ongoing review updates. DataForSEO API for one-time historical review import.