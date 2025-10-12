# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance the online presence of a plumbing business in Austin and Marble Falls, Texas. It provides service information, covered areas, and blog content, alongside an online store for maintenance memberships. The project focuses on improving local SEO, user engagement, and conversion rates, featuring an AI-powered blog generation system and comprehensive SEO tools for optimal visibility and performance. The business vision is to expand market reach, improve customer engagement through an intuitive online platform, and leverage AI for content generation and SEO.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI is built using Radix UI, Shadcn UI, Tailwind CSS, and Class Variance Authority (CVA).
- **Design System:** Features a primary blue and secondary teal color scheme, charcoal text, and silver accents, with Inter and Poppins typography. Supports light/dark modes.
- **SEO & Performance:** Utilizes a centralized `SEOHead` component for meta tags, OpenGraph, Twitter Cards, canonical URLs, and extensive JSON-LD schema. Default OpenGraph and Twitter Card tags are server-rendered in `index.html` for immediate social media scraper visibility, with React Helmet providing page-specific overrides. All og:image URLs use absolute production URLs (`https://www.plumbersthatcare.com`). Includes performance optimizations like resource preconnect, image lazy loading, font optimization, client-side code splitting, and universal WebP image conversion. A dynamic sitemap auto-updates.
- **Accessibility:** WCAG AA Compliant with focus on contrast ratios, `aria-label` usage, and dynamic Open Graph image construction.
- **Pages:** Includes Home, About, Contact, Service pages, Service Area pages, Blog (with RSS feed), Store, FAQ, Privacy Policy, Refund/Returns, VIP Membership benefits, and conversion-optimized SEO landing pages.
- **RSS Feeds:** Blog RSS feed (`/rss.xml`) and Success Stories RSS feed (`/api/success-stories/rss.xml`) use pre-generated JPEG images for maximum RSS reader and social media automation compatibility (Zapier, etc.). New content automatically generates both WebP (website) and JPEG (RSS/social) versions at creation time. Legacy content uses fallback conversion endpoints.
- **Admin Panels:** 
  - Page Metadata management displays actual default SEO values (e.g., "Water Heater Services | Economy Plumbing") instead of generic "Default" placeholders, showing what title/description each page currently uses when no custom metadata is set.
  - Maintenance panel includes JPEG backfill tools to generate JPEG versions for existing WebP images, ensuring full RSS/social media compatibility for all content.

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
- **AI Services:** OpenAI (GPT-4o Vision) for blog generation and photo analysis. Before/after composite creation is available but currently disabled per user preference.
- **Photo Management:** CompanyCam, Google Drive, and ServiceTitan integrations for multi-source photo import. Automatic cleanup deletes unused photos after 60 days. Google Drive photos are automatically deleted from Drive after successful download/import.
- **Google Services:** Google Places API for review updates, Google Maps.
- **SEO Data:** DataForSEO API for historical review import.
- **Social Media:** Meta Graph API for automated posting to Facebook/Instagram.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple`.
- **Image Processing:** Sharp library for dual-format image generation (WebP for website performance, JPEG for RSS/social media compatibility). All new blog posts and success stories automatically generate both formats at creation time, stored in object storage.