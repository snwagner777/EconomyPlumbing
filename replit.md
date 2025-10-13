# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance the online presence of a plumbing business in Austin and Marble Falls, Texas. It provides service information, covered areas, and blog content, alongside an online store for maintenance memberships. The project focuses on improving local SEO, user engagement, and conversion rates, featuring an AI-powered blog generation system and comprehensive SEO tools for optimal visibility and performance. The business vision is to expand market reach, improve customer engagement through an intuitive online platform, and leverage AI for content generation and SEO.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI is built using Radix UI, Shadcn UI, Tailwind CSS, and Class Variance Authority (CVA).
- **Design System:** Features a primary blue and secondary teal color scheme, charcoal text, and silver accents, with Inter and Poppins typography. Supports light/dark modes.
- **SEO & Performance:** Utilizes a centralized `SEOHead` component for meta tags, OpenGraph, Twitter Cards, and auto-generated canonical URLs. Default OpenGraph and Twitter Card tags are server-rendered in `index.html` using optimized 1200x630 social sharing image for immediate social media scraper visibility, with React Helmet providing page-specific overrides. Canonical URLs auto-generate from current route via `generateCanonicalUrl()` helper. JSON-LD structured data enriched with @id references, blog wordCount, and detailed service areaServed arrays (specific cities). 301 redirects implemented for duplicate URL aliases to consolidate SEO authority. All og:image URLs use absolute production URLs with cache-busting. Includes performance optimizations like resource preconnect, image lazy loading, font optimization, client-side code splitting, and universal WebP image conversion. Dynamic sitemap auto-updates with all service areas.
- **Accessibility:** WCAG AA Compliant with focus on contrast ratios, `aria-label` usage, and dynamic Open Graph image construction.
- **Pages:** Includes Home, About, Contact, Service pages, Service Area pages, Blog (with RSS feed), Store, FAQ, Privacy Policy, Refund/Returns, VIP Membership benefits, and conversion-optimized SEO landing pages.
- **RSS Feeds:** Blog RSS feed (`/rss.xml`) and Success Stories RSS feed (`/api/success-stories/rss.xml`) use pre-generated JPEG images for maximum RSS reader and social media automation compatibility (Zapier, etc.). New content automatically generates both WebP (website) and JPEG (RSS/social) versions at creation time. Legacy content uses fallback conversion endpoints.
- **Admin Panels:** 
  - Page Metadata management displays actual default SEO values (e.g., "Water Heater Services | Economy Plumbing") instead of generic "Default" placeholders, showing what title/description each page currently uses when no custom metadata is set.
  - Success Stories admin includes collage reprocessing tool to regenerate all existing collages with AI focal point detection for improved photo positioning
  - Drag-to-Position Collage Editor: Success story before/after images use an intuitive drag-based interface where admins can drag images around within the collage preview to precisely position the main subject. Features proper drag state tracking (stores starting position and focal point), natural movement with 0.5 scaling for 200% zoom, and pixel-perfect preview accuracy. Backend uses extract-based cropping to center focal points exactly as shown in preview, replacing previous discrete gravity positioning. Manual positioning overrides AI detection for precise control.

### Backend
- **Framework & API:** Express.js with TypeScript, providing RESTful API endpoints.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers.
- **AI Blog Generation System:** Uses OpenAI GPT-4o to analyze unused photos and generate SEO-optimized blog posts with smart topic suggestions, automated weekly creation, future-dated scheduling, and seasonal awareness.
- **Dynamic Phone Number Tracking:** Database-driven system for automatic phone number insertion based on traffic source, with an admin panel for management.
- **Security:** OAuth-only authentication for the admin panel with single-email whitelist, rate limiting, httpOnly/secure session cookies, and sameSite CSRF protection.

### State Management
- **Client-Side:** TanStack Query for server state; React hooks for local component state.
- **Form Handling:** React Hook Form with Zod validation.

### Analytics & Third-Party Script Management
- **Multi-Platform Tracking:** Google Analytics 4, Meta Pixel, Google Tag Manager, Microsoft Clarity.
- **Deferred Loading:** All scripts load via `requestIdleCallback` for optimal performance.
- **Conversion Tracking:** Comprehensive tracking for contact forms, phone clicks, scheduler opens, memberships, and user-generated content.
- **Privacy Compliant:** Cookie consent integration.

## External Dependencies

- **Payment Processing:** Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`).
- **Database:** Neon (PostgreSQL) via `@neondatabase/serverless` with Drizzle ORM.
- **Online Scheduler:** ServiceTitan for appointment scheduling.
- **Email Integration:** Resend for transactional emails and 404 alerts.
- **AI Services:** OpenAI (GPT-4o Vision) for blog generation, photo analysis, and success story focal point detection. Success story collages use AI-powered focal point detection to intelligently position before/after photos in Polaroid-style frames, ensuring the main subject is properly centered. Manual focal point editing overrides AI detection for precise control. Before/after composite creation is available but currently disabled per user preference.
- **Photo Management:** CompanyCam, Google Drive, and ServiceTitan integrations for multi-source photo import. Automatic cleanup deletes unused photos after 60 days. Google Drive photos are automatically deleted from Drive after successful download/import.
- **Google Services:** Google Places API for review updates, Google Maps.
- **SEO Data:** DataForSEO API for historical review import.
- **Social Media:** Meta Graph API for automated posting to Facebook/Instagram.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple`.
- **Image Processing:** Sharp library for dual-format image generation (WebP for website performance, JPEG for RSS/social media compatibility). All new blog posts and success stories automatically generate both formats at creation time, stored in object storage.