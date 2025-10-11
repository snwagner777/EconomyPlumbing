# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance the online presence of a plumbing business in Austin and Marble Falls, Texas. It provides service information, covered areas, and blog content, alongside an online store for maintenance memberships. The project focuses on improving local SEO, user engagement, and conversion rates, featuring an AI-powered blog generation system and comprehensive SEO tools for optimal visibility and performance.

## Recent Changes (October 2025)
- **OAuth-Only Admin Security (October 11, 2025):** Removed insecure username/password login. Admin panel now requires Replit OAuth authentication with single-email whitelist (sean@plumbersthatcare.com). Security features: rate limiting (5 attempts/15min/IP), httpOnly/secure session cookies, sameSite CSRF protection, real-time whitelist verification, automatic session clearing if removed from whitelist. OAuth endpoints: login `/api/oauth/login`, callback `/api/oauth/callback`, logout `/api/oauth/logout`. Legacy `/admin/login` redirects to `/admin/oauth-login`.
- **Google Rich Results Schema Optimization (October 11, 2025):** Fixed non-critical issues in LocalBusiness schema. Resolved array-based multi-location format by creating separate schemas: primary Austin location (main LocalBusiness), secondary Marble Falls location, and Organization schema tying both together. Added missing recommended fields: `hasMap` (Google Maps links), `paymentAccepted`, `currenciesAccepted`. Changed from array-based `telephone`, `address`, `geo` to single values per location for Google parser compatibility. All pages now use optimized multi-location schema structure.
- **Page Metadata Management System:** Implemented comprehensive database-driven SEO metadata management with admin panel at `/admin/page-metadata`. Features include: page_metadata database table with unique path constraint, CRUD API endpoints (public and admin), SEOHead component database integration with 5-minute caching, admin UI with character count indicators and real-time validation, client/server validation enforcing 120-160 character descriptions, and automatic fallback to hardcoded defaults when no database override exists.
- **Commercial Customer Showcase Color Update:** Updated CommercialCustomersShowcase logos from grayscale to full color (90% opacity, 100% on hover) for better brand visibility across 7 service pages.
- **Meta Description SEO Optimization:** All 20+ pages now include phone numbers in meta descriptions within optimal 120-160 character range (14 pages at 150-160 chars for maximum SEO impact).
- **Page Title Branding Standardization:** Updated 5 service page titles to use consistent "Economy Plumbing" branding (Water Heater Services, Water Heater Guide, Commercial Plumbing, Faucet Installation, Gas Leak Detection) while preserving water heater keywords for SEO.
- **Stripe Payment Fix:** Corrected price rounding issue in Checkout.tsx (changed .toFixed(0) to .toFixed(2) on lines 300 and 474) to display accurate cents in Stripe checkout.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI is built using Radix UI, Shadcn UI, Tailwind CSS, and Class Variance Authority (CVA).
- **Design System:** Features a primary blue and secondary teal color scheme, charcoal text, and silver accents, with Inter and Poppins typography. Supports light/dark modes for a professional aesthetic.
- **SEO & Performance:** Utilizes a centralized `SEOHead` component for meta tags, OpenGraph, Twitter Cards, canonical URLs, and extensive JSON-LD schema. Includes performance optimizations like resource preconnect, image lazy loading, font optimization, client-side code splitting, and universal WebP image conversion. A dynamic sitemap auto-updates.
- **Client-Side Routes:** Covers Home, About, Contact, Service pages, Service Area pages, Blog (with RSS feed), Store, FAQ, Privacy Policy, Refund/Returns, VIP Membership benefits, and conversion-optimized SEO landing pages.
- **SEO Landing Pages:** High-converting landing pages (`/plumber-near-me`, `/commercial-services`) designed for organic search and targeted marketing, implementing CRO best practices such as urgency mechanics, transparent pricing, FAQs, testimonials, and satisfaction guarantees.
- **Accessibility:** WCAG AA Compliant with focus on contrast ratios, `aria-label` usage, and dynamic Open Graph image construction.
- **Reviews Integration:** Premium visual design for testimonials, strategically placed, auto-categorized by service type, lazy-loaded, and cached.
- **PageSpeed Optimization:** Implements image optimization, resource hints, deferred third-party scripts, and optimized CSS delivery to achieve high Core Web Vitals scores.

### Backend
- **Framework & API:** Express.js with TypeScript, providing RESTful API endpoints.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers.
- **Google Reviews Integration:** Bulk import via DataForSEO API; ongoing updates via Google Places API with deduplication, quality filtering, and auto-categorization.
- **Performance Optimizations:** Gzip/brotli compression, aggressive API caching with Cache-Control headers, 1-year immutable cache for static assets, and strategic database indexing.
- **AI Blog Generation System:** Uses OpenAI GPT-4o to analyze unused photos and generate SEO-optimized blog posts with smart topic suggestions, automated weekly creation, future-dated scheduling, and seasonal awareness.
- **404 Error Monitoring:** Automated tracking of 404 errors with email alerts via Resend.
- **Domain Redirect Middleware:** Automatically redirects all traffic from `.replit.app` to `www.plumbersthatcare.com` using a 301 permanent redirect.
- **Dynamic Phone Number Tracking:** Database-driven system for automatic phone number insertion based on traffic source, with an admin panel for management.

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
- **Social Media:** Facebook, Instagram, Yelp, Nextdoor.
- **Call Tracking:** Database-driven dynamic phone number tracking system.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple` for PostgreSQL session store.
- **Google APIs:** Google Places API for review updates.
- **DataForSEO API:** For historical review import.
- **AI-Powered Photo Quality System:** OpenAI Vision (GPT-4o) for analyzing job photos.
- **WebP Conversion:** Sharp library for universal WebP conversion.
- **Multi-Source Photo Import:** CompanyCam, Google Drive, and ServiceTitan.
- **Before/After Photo Composer:** AI (GPT-4o vision) for detecting and composing before/after images with AI-generated captions.
- **Social Media Auto-Posting:** Meta Graph API for automated weekly posting to Facebook/Instagram.
- **ServiceTitan Integration:** Automated sync of online membership purchases to ServiceTitan CRM via Stripe webhooks and background sync jobs.