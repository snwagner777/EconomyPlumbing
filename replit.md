# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance the online presence of a plumbing business. It provides service information, covered areas, and blog content, alongside an Ecwid-powered online store for maintenance memberships and drop-shipped products. The project aims to improve local SEO, user engagement, and conversion rates, featuring an AI-powered blog generation system and comprehensive SEO tools for optimal visibility and performance. The business vision is to expand market reach, improve customer engagement through an intuitive online platform, and leverage AI for content generation and SEO.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI is built using Radix UI, Shadcn UI, Tailwind CSS, and Class Variance Authority (CVA).
- **Design System:** Features a primary blue and secondary teal color scheme, charcoal text, and silver accents, with Inter and Poppins typography. Supports light/dark modes.
- **SEO & Performance:** Utilizes a centralized `SEOHead` component for meta tags, OpenGraph, Twitter Cards, and auto-generated canonical URLs. Default OpenGraph and Twitter Card tags are server-rendered with page-specific overrides. JSON-LD structured data is enriched with `@id` references, blog `wordCount`, and detailed `serviceAreaServed` arrays. 301 redirects are implemented for duplicate URL aliases. Includes performance optimizations like resource preconnect, image lazy loading, font optimization, aggressive code splitting, and universal WebP image conversion. Dynamic sitemap auto-updates with all service areas.
- **Accessibility:** WCAG AA Compliant with focus on contrast ratios, descriptive link text, and proper OpenGraph image handling.
- **Pages:** Includes Home, About, Contact, Service pages, Service Area pages, Blog (with RSS feed), Ecwid Store, FAQ, Privacy Policy, Refund/Returns, VIP Membership benefits, and conversion-optimized SEO landing pages.
- **RSS Feeds:** Blog RSS feed (`/rss.xml`) and Success Stories RSS feed (`/api/success-stories/rss.xml`) use pre-generated JPEG images for maximum compatibility.
- **Admin Panels:** Features metadata management, a success stories admin with a collage reprocessing tool and a drag-to-position collage editor with AI focal point detection, and a products admin for managing VIP membership SKUs and ServiceTitan integration fields.

### Backend
- **Framework & API:** Express.js with TypeScript, providing RESTful API endpoints.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products (reference only), Contact Submissions, Service Areas, Google Reviews, Commercial Customers.
- **E-commerce:** Ecwid platform handles all product management, checkout, payment processing, and inventory, integrated with Printful and Spocket for automated order fulfillment.
- **AI Blog Generation System:** Uses OpenAI GPT-4o to analyze photos and generate SEO-optimized blog posts with smart topic suggestions, automated weekly creation, future-dated scheduling, and seasonal awareness.
- **Dynamic Phone Number Tracking:** 100% database-driven system via admin panel. Zero hardcoded phone numbers in interactive elements. All components use `usePhoneConfig()` and `useMarbleFallsPhone()` hooks. Window globals (`__PHONE_CONFIG__`, `__MARBLE_FALLS_PHONE_CONFIG__`) initialized early for non-React code (scheduler). Proper tel/display alignment throughout. Cookie persistence for traffic source detection.
- **Security:** OAuth-only authentication for the admin panel with single-email whitelist, rate limiting, httpOnly/secure session cookies, and sameSite CSRF protection.

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
- **AI Services:** OpenAI (GPT-4o Vision) for blog generation, photo analysis, and success story focal point detection.
- **Photo Management:** CompanyCam, Google Drive, and ServiceTitan integrations.
- **Google Services:** Google Places API, Google Maps.
- **SEO Data:** DataForSEO API.
- **Social Media:** Meta Graph API.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple`.
- **Image Processing:** Sharp library for dual-format image generation (WebP and JPEG).