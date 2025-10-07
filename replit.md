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
  
- **Performance Optimizations (PageSpeed 100 Ready):**
  - Hero images optimized with width="1920" height="1080" attributes for CLS prevention
  - Added fetchpriority="high" to all LCP hero images (Home, ServicePage, ServiceAreaPage)
  - Preconnect links updated with crossorigin attributes for fonts and ServiceTitan
  
- **Meta Description Optimization:**
  - All 28 meta descriptions optimized to strict 150-160 character range
  - Distribution: 4@150, 2@151, 3@152, 6@153, 3@154, 2@155, 4@156, 1@157, 1@159, 2@160 chars
  
- **Canonical URLs:** Implemented SSR-compatible canonical URLs across all 48+ pages. Templates require explicit canonical props.

- **Service Area Page Differentiation:** Updated ServiceAreaPage template with unique content per city:
  - Added optional `heroImage`, `heroSubtitle`, and `cityHighlight` props
  - Implemented 9 unique hero images across 10 smaller service area pages
  - Each city page has localized content (Buda, Spicewood, Liberty Hill, Marble Falls, Granite Shoals, Burnet, Kyle, Bertram, Horseshoe Bay, Kingsland)
  
- **Cedar Park Route:** Fixed route consistency to use `/plumber-in-cedar-park--tx` (double hyphen) across all internal links.

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