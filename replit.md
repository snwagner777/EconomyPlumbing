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

### October 2025 - SEO & Content Uniqueness Improvements
- **Canonical URLs:** Implemented SSR-compatible canonical URLs across all 48+ pages. Templates now require explicit canonical props to ensure proper rendering during server-side generation.
- **Service Area Page Differentiation:** Updated ServiceAreaPage template to support unique content per city:
  - Added optional `heroImage`, `heroSubtitle`, and `cityHighlight` props
  - Implemented 9 unique hero images across 10 smaller service area pages
  - Each city page now has localized content (Buda, Spicewood, Liberty Hill, Marble Falls, Granite Shoals, Burnet, Kyle, Bertram, Horseshoe Bay, Kingsland)
  - Eliminated duplicate content issues for improved local SEO performance
- **Cedar Park Route:** Fixed route consistency to use `/plumber-in-cedar-park--tx` (double hyphen) across all internal links and components.

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