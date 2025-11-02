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

## Next.js Migration Status

**Status:** Core migration complete (Oct 31, 2025) - All 234 routes migrated, authentication implemented
**Timeline:** 40-60 hours (1-2 weeks of focused work)
**Approach:** Dual-process architecture (Next.js App Router + worker.ts for background jobs)

### Migration Progress
- ✅ **Phase 1-9:** All phases complete - 234/234 routes migrated
- ✅ **Authentication:** Simple username/password auth with iron-session implemented
- ✅ **Admin Protection:** All /admin routes protected with session-based middleware
- ✅ **Worker Process:** All 14 background schedulers running successfully
- ✅ **Public Pages:** All public routes working (home, services, contact, blog, etc.)
- ✅ **Admin Pages:** All admin pages protected and functional
- ✅ **UnifiedAdminDashboard Migration:** 9,139 lines migrated from Express/React to Next.js
  - 115 admin API route files discovered (app/api/admin/*)
  - 8 core endpoints verified working via live polling: check, stats, conversion-stats, sync-status, portal-stats, photos, tracking-numbers, commercial-customers
  - Real-time dashboard polling confirmed: sync-status (every 5s), portal-stats (every 15s), conversion-stats (every 30s)
  - Commercial logo serving working: /commercial-logos/*.svg returns 200
- ✅ **SEO Enhancement - Server-Side Dynamic Phone Tracking (Nov 2, 2025):**
  - **Homepage fully server-rendered** with campaign-specific tracking numbers based on UTM parameters
  - **Crawlers see correct phone numbers** in HTML before JavaScript loads (verified with curl tests)
  - **Hybrid phone system:** Server-side UTM resolution + client-side cookie/referrer enhancement
  - **Live verification:** `?utm_source=google` → (512) 368-9159, `?utm_source=facebook` → (512) 575-3157, default → (512) 649-2811
  - **Implementation:** `server/lib/phoneNumbers.ts` with `getPhoneNumberForSSR()` + URLSearchParams detection
- ✅ **Review System (Nov 2, 2025):**
  - **SerpAPI Integration:** Automated fetching of Google (582) and Yelp (125) reviews every 6 hours
  - **Read-Only Display:** Reviews shown with complete customer names, no reply functionality
  - **GMB Reply System Removed:** Auto-reply functions deleted, database fields remain unused
- 🔄 **Remaining Testing:** 107 admin API endpoints need systematic verification through UI interaction

### Authentication Implementation (Oct 31, 2025)
- **Strategy:** Session-based authentication using iron-session
- **Login:** `/admin/login` with username/password form
- **Protection:** Middleware checks session cookie, redirects to login if not authenticated
- **Credentials:** Stored in Replit Secrets (ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET)
- **Session Duration:** 7 days
- **Note:** Third attempt after Replit OAuth and Clerk both had compatibility issues

### Migration Plan Overview
- **Phase 1:** Infrastructure & worker.ts setup (6-8 hours) ✅
- **Phase 2:** Middleware & global behavior (4-5 hours) ✅
- **Phase 3:** Core API routes & webhooks (10-12 hours) ✅
- **Phase 4:** Background schedulers (6-8 hours) ✅
- **Phase 5:** Public pages & SEO (8-10 hours) ✅
- **Phase 6:** Customer portal (4-5 hours) ✅
- **Phase 7:** Admin dashboard (10-12 hours) ✅
- **Phase 8:** Object storage & AI features (4-5 hours) ✅
- **Phase 9:** Analytics, testing & cutover (6-8 hours) ✅

**Full Details:** See `MIGRATION_V2.md` for complete roadmap

### Key Architectural Decisions
- Next.js 15 App Router for all pages and API routes
- Separate worker.ts process for 14 background schedulers
- Hybrid static assets strategy (critical assets in public/, large assets in object storage)
- All OAuth callbacks preserved (ServiceTitan, Replit)
- Incremental cutover with rollback plan
- No database schema changes (use existing DB as-is)

### Required Secrets for Full Functionality
- ✅ ADMIN_USERNAME - Admin login username
- ✅ ADMIN_PASSWORD - Admin login password
- ✅ SESSION_SECRET - Session encryption key (32+ characters)
- ✅ SERPAPI_API_KEY - SerpAPI key for automated Google/Yelp review fetching (read-only)
- ⚠️ GOOGLE_CLIENT_ID - Google OAuth for GMB review management with reply capability (optional)
- ⚠️ GOOGLE_CLIENT_SECRET - Google OAuth secret (optional)

## TODO: Referral Nurture Campaign Auto-Enrollment
**PENDING IMPLEMENTATION:** Referral nurture campaigns need to be auto-created when customers submit 4+ star reviews. The `createCampaignForReviewer()` function exists in `referralNurtureScheduler.ts` but is not currently called anywhere. This should be wired into the review feedback handler so customers are automatically enrolled in the referral nurture sequence after leaving positive feedback.

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter, TanStack Query. UI uses Radix UI, Shadcn UI, Tailwind CSS, and CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation.
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and a Customer Portal with ServiceTitan integration.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panels:** Unified admin with Marketing Automation section (campaign-specific phone numbers, email templates, settings), ServiceTitan sync monitoring, Customer Portal analytics, photo/metadata management, Reputation Management, SMS Marketing, and centralized tracking phone number management.

### Backend
- **Framework & API:** Express.js with TypeScript, RESTful API.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers.
- **E-commerce:** Ecwid integration with Printful and Spocket.
- **AI Blog Generation System:** OpenAI GPT-4o for SEO-optimized and seasonally aware blog posts.
- **Dynamic Phone Number Tracking (Enhanced Nov 2, 2025):** 
  - **Server-Side Resolution:** UTM parameters detected during SSR, correct tracking number rendered in HTML for SEO
  - **Database-Driven:** All tracking numbers stored with detection rules (utmSources, urlParams, referrerIncludes arrays)
  - **Campaign-Specific Numbers:** Each email campaign has dedicated tracking number (review requests, referral nurture, quote follow-up)
  - **Hybrid Detection:** Server reads URL params → Client enhances with cookies/referrer → 90-day cookie persistence
  - **Attribution Tracking:** All email links include proper UTM parameters, phone numbers sync to centralized admin page
  - **SEO Benefit:** Crawlers see campaign-appropriate phone numbers in HTML before JavaScript loads
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
- **Reputation Management System:** AI-powered review request automation with drip campaign engine (GPT-4o), preview/edit/approve interface for email sequences, and multi-channel requests. Includes automated review fetching via SerpAPI (Google: 582 reviews, Yelp: 125 reviews) for read-only display with complete customer names. Auto-syncs every 6 hours.
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
- **Rendering Strategy (Nov 2, 2025):** 
  - **Server-Side Rendering (SSR)** for homepage with dynamic metadata and UTM-based phone tracking
  - **Hybrid Phone System:** Server detects tracking number from URL parameters → Client enhances with cookies/referrer
  - **SEO-First Architecture:** All content and campaign-specific phone numbers in initial HTML for crawlers
  - **Progressive Enhancement:** Client-side PhoneConfigProvider can update numbers after hydration based on cookies/referrer
- **URL Normalization:** 301 redirects for trailing-slash URLs.
- **Security:** `/src/*` files blocked with 403 Forbidden.

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