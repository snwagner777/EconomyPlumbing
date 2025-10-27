# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence. It provides service information, covered areas, blog content, and an Ecwid-powered online store. The project aims to improve local SEO, user engagement, and conversion rates. It features an AI-powered blog generation system, comprehensive SEO tools, an AI-powered marketing automation system for personalized email campaigns and attribution tracking, and a custom AI-powered reputation management system. The business vision is to expand market reach, improve customer engagement through an intuitive online platform, and leverage AI for content generation and SEO.

## User Preferences
Preferred communication style: Simple, everyday language.

## Development Principles
**CRITICAL RULE: Always check existing functionality before creating new pages/features**
- The Unified Admin Dashboard (`/admin`) is the single source of truth for all admin functionality
- NEVER create separate admin pages (e.g., `/admin/gmb-setup`) without first checking if the functionality already exists in the unified dashboard
- When adding admin features, ALWAYS integrate them into the existing unified admin panel
- Before implementing any new feature, search the codebase to verify it doesn't already exist
- Consolidation over separation: One unified interface is better than multiple scattered pages

## TODO: Referral Nurture Campaign Auto-Enrollment
**PENDING IMPLEMENTATION:** Referral nurture campaigns need to be auto-created when customers submit 4+ star reviews. The `createCampaignForReviewer()` function exists in `referralNurtureScheduler.ts` but is not currently called anywhere. This should be wired into the review feedback handler so customers are automatically enrolled in the referral nurture sequence after leaving positive feedback.

## System Architecture

### Frontend Architecture: Next.js 15 App Router + Express Hybrid
- **Public Marketing Site (Next.js 15 SSR/ISR):** Homepage and blog migrated to Next.js App Router with Server Components for optimal SEO. ISR caching with 60s homepage revalidation and 3600s blog revalidation. Server Components for static content, Client Components for interactivity only.
- **Admin/Portal (React SPA - Migration Pending):** Customer portal and admin panel currently remain as React single-page applications served via Vite middleware, planned for Next.js migration.
- **Routing:** Hybrid Express router delegates to Next.js request handler (public pages like /, /blog/*) OR Vite middleware (admin/portal at /admin, /customer-portal, /@vite routes). Express handles all /api/* and /attached_assets/* routes directly.
- **Environment Variables:** NEXT_INTERNAL_URL for server-side fetches (avoids CDN loops), NEXT_PUBLIC_API_URL for client-side API calls, REVALIDATION_SECRET for on-demand cache invalidation.
- **Migration Status:** Homepage ✅, Blog ✅, ServiceTitan Script ✅, JSON-LD Schemas ✅. Remaining: Services, About, Contact, Admin Dashboard, Customer Portal.

### Frontend Stack
- **Framework & UI:** Next.js 15 App Router (public pages) + React 18 SPA (admin/portal) with TypeScript. UI uses Radix UI, Shadcn UI, Tailwind CSS, and CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **SEO & Performance:** Next.js Metadata API, comprehensive JSON-LD structured data (LocalBusiness, Organization, FAQPage), ISR caching (60s homepage, 3600s blog), resource preconnect, image lazy loading via Next.js Image, font optimization, code splitting, WebP conversion, dynamic sitemap generation (planned).
- **JSON-LD Schemas:** Implemented for LocalBusiness (Austin + Marble Falls), Organization, and FAQPage with visible content matching schema for Google compliance. Schemas in `app/lib/jsonLd.ts`.
- **Key Pages:** Home (Next.js SSR ✅), Blog (Next.js ISR ✅), About (React SPA), Contact (React SPA), Services (React SPA), Service Areas, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and Customer Portal with ServiceTitan integration.
- **ServiceTitan Scheduler:** Integrated into Next.js pages via Script component with afterInteractive strategy. Widget ID: 3ce4a586-8427-4716-9ac6-46cb8bf7ac4f. Client Components (ScheduleButton) trigger window.STWidgetManager.
- **Dynamic Phone Numbers:** Client-side detection via inline JavaScript in Next.js pages that fetches /api/tracking-numbers, detects UTM parameters, stores in 90-day cookies, and updates all elements with data-phone="austin" attribute (pending implementation in Next.js).
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panels:** Unified admin with Marketing Automation section (campaign-specific phone numbers, email templates, settings), ServiceTitan sync monitoring, Customer Portal analytics, photo/metadata management, Reputation Management, SMS Marketing, and centralized tracking phone number management.

### Backend
- **Framework & API:** Express.js with TypeScript, RESTful API.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers.
- **E-commerce:** Ecwid integration with Printful and Spocket.
- **AI Blog Generation System:** OpenAI GPT-4o for SEO-optimized and seasonally aware blog posts.
- **Dynamic Phone Number Tracking:** Database-driven system with automatic UTM parameter generation for marketing campaigns. Each email campaign type (review requests, referral nurture, quote follow-up) has its own dedicated tracking phone number. All email links include proper UTM parameters for attribution tracking. Phone numbers sync automatically to centralized tracking number management page.
- **Security & Type Safety:** OAuth-only admin authentication, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, 100% type-safe TypeScript, Stripe PaymentIntents.
- **ServiceTitan Integration:** XLSX-based customer data management for customer portal and marketing, replacing API-based sync. Includes automated imports, data safety measures, and specific fixes for search and login security.
- **Marketing Automation:** AI-powered system with comprehensive email engagement tracking:
  - **Review Request Campaign:** 4 emails over 21 days with campaign-specific tracking phone number
  - **Referral Nurture Campaign:** 4 emails over 6 months (days 14, 60, 150, 210) with auto-pause after 2 consecutive unopened emails
  - **Quote Follow-up Campaign:** 4 emails over 21 days for $0 jobs with campaign-specific tracking phone number
  - **Email Tracking:** emailSendLog table tracks all campaign emails with engagement timestamps (opened, clicked, bounced, complained)
  - **Webhook Integration:** Resend webhooks update engagement counters in both emailSendLog and campaign tables (reviewRequests, referralNurtureCampaigns)
  - **Suppression List:** emailSuppressionList table prevents sending to hard bounces and spam complaints (CAN-SPAM compliance)
  - **Schedulers:** Review request and referral nurture schedulers run every 30 minutes, checking suppression list and email preferences before every send
  - Features: AI customer segmentation (GPT-4o), visual HTML preview/approval workflow, campaign-specific phone tracking, automatic UTM parameter generation for all email links
- **SMS Marketing System:** Complete platform with AI-powered campaign generation, behavioral intelligence, TCPA-compliant opt-in/opt-out, and multi-channel coordination.
- **Reputation Management System:** AI-powered review request automation with drip campaign engine (GPT-4o), preview/edit/approve interface for email sequences, and multi-channel requests.
- **Referral System:** Database-first referral management with ServiceTitan integration for pre-submission validation, hourly processing, job completion tracking, ServiceTitan notes integration, and credit management. Features AI-generated emails: referee welcome emails (sent to new referrals), referrer thank you emails (sent when referral is submitted), and referrer success notifications (sent when referred customer converts and credit is issued). Referrer emails auto-send with customizable AI templates via admin-configurable prompts and brand guidelines (stored in system_settings table). Template customization includes preview API for testing before deployment. All referral emails have full engagement tracking and suppression list compliance.
- **Email Preference Center:** Granular subscription management for CAN-SPAM compliance, with token-based public UI and API endpoints for category-specific opt-outs and one-click unsubscribe.
- **Production-Hardening Infrastructure:** Automated schedulers, database transactions, idempotency protection, health monitoring, admin alerting, and webhook signature verification (Svix).

### State Management
- **Client-Side:** TanStack Query for server state; React hooks for local component state.
- **Form Handling:** React Hook Form with Zod validation.

### Analytics & Third-Party Script Management
- **Tracking:** Google Analytics 4, Meta Pixel, Google Tag Manager, Microsoft Clarity.
- **Optimization:** Aggressive deferral for script loading.
- **Conversion Tracking:** Comprehensive tracking for forms, phone clicks, scheduler opens, and memberships.
- **Privacy:** Cookie consent integration.

### Development Standards
- **Rendering:** Hybrid architecture - Server-Side Rendering (SSR) + Incremental Static Regeneration (ISR) for public pages via Next.js 15, Client-Side Rendering (CSR) for admin/portal.
- **Migration Pattern:** Server Components for SEO-critical static content, Client Components ('use client') only for interactivity (buttons, forms, dynamic widgets).
- **URL Normalization:** 301 redirects for trailing-slash URLs (handled by Express middleware in `server/index.ts`).
- **Security:** `/src/*` files blocked with 403 Forbidden.
- **Cache Strategy:** ISR with on-demand revalidation endpoint at `/_revalidate` (protected by REVALIDATION_SECRET). Homepage: 60s revalidation, Blog posts: 3600s revalidation.

## External Dependencies

- **E-commerce Platform:** Ecwid (Stripe for payments), Printful, Spocket.
- **Database:** Neon (PostgreSQL) via `@neondatabase/serverless` with Drizzle ORM.
- **Online Scheduler:** ServiceTitan.
- **Email Integration:** Resend (transactional), Mailgun (webhook-based XLSX imports).
- **SMS Providers:** Twilio, Zoom Phone.
- **AI Services:** OpenAI (GPT-4o for blog generation, photo analysis, focal point detection; GPT-4o-mini for chatbot).
- **Photo Management:** CompanyCam, Google Drive, ServiceTitan.
- **Google Services:** Google Places API, Google Maps.
- **SEO Data:** DataForSEO API.
- **Social Media:** Meta Graph API.