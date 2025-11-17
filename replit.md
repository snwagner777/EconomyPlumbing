# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence, streamline operations, and drive growth. It offers comprehensive service information, covered areas, blog content, and an online store. The project integrates AI for content generation, marketing automation, and reputation management, with a focus on boosting local SEO, user engagement, and conversion rates. The goal is to leverage technology for operational efficiency and superior customer engagement, establishing the business as a leading service provider.

## User Preferences
Preferred communication style: Simple, everyday language.

**CRITICAL RULE: Single Module Pattern - DRY (Don't Repeat Yourself)**
- ANY functionality used in more than one place MUST be a single reusable module called differently, never duplicated.
- Pattern: Create shared module → Import and use in multiple places → Both desktop and mobile use same data, just styled differently.

**CRITICAL RULE: Modular, Reusable API Architecture**
- Develop in modules for bug fixes, new features, code reusability, consistency, and faster testing/debugging.
- Architecture Pattern: Core Business Logic (pure functions, no auth/route concerns), API Routes (thin authentication wrappers), React Hooks & Components (accept auth context as parameters).

**CRITICAL RULE: NEVER Auto-Generate or Hardcode Phone Numbers**
- Always ask the user for phone numbers.
- Never use placeholder or hardcoded phone numbers in production code.
- All displayed phone numbers must come from the `tracking_numbers` table, environment variables, or user input via the admin panel.
- Test data and documentation may use (512) 555-XXXX format ONLY.

**CRITICAL RULE: Always check existing functionality before creating new components/pages/features**
- NEVER create a new component/page/feature without first searching the codebase for existing implementations.
- ALWAYS modify and refactor existing code rather than creating duplicates.
- Before adding new admin features, check if a route already exists and add new routes to the `AdminSidebar` menu.

**CRITICAL RULE: Every new public page MUST have Header, Footer, and SEO optimization**
- All public-facing pages must render Header and Footer components.
- Every page must have proper SEO metadata (title, description, Open Graph tags) using `getPageMetadata()` or manual export.

**CRITICAL RULE: ServiceTitan API Implementation - ALWAYS Verify Before Writing**
- Always check actual API wrapper code in `server/lib/servicetitan/` and endpoint implementation in `app/api/servicetitan/` before using ServiceTitan API.
- Verify exact fields available and ensure field names match ServiceTitan responses.

**CRITICAL RULE: ServiceTitan Campaign ID Tracking**
- Campaign IDs are required for all ServiceTitan job creation.
- Campaign resolution flow: UTM source lookup in `tracking_numbers` table, fallback to "website" campaign, or throw an error.
- Admin Panel at `/admin/tracking-numbers` manages UTM source to Campaign ID mappings.

**CRITICAL RULE: Next.js Server-Side Rendering (SSR) - NEVER Break It**
- This is a Next.js 15 App Router project; all pages are server-rendered by default for SEO.
- NEVER: wrap server components in 'use client' providers, create wrappers that force pages client-side, or make entire pages client-side to pass props.
- Correct Pattern: Server page fetches data server-side and passes it as props to a client component for UI rendering.

**CRITICAL RULE: ServiceTitan API Testing Protocol**
- ALWAYS test API endpoints with real customer data (ID: 27881198) BEFORE implementing features.
- Verify actual response structures, field names, and data types using test customer.

**CRITICAL RULE: Referral System Architecture - Modular Hybrid System**
- **Frontend:** Modular architecture with `useReferralForm` hook (headless logic) + `ReferralFormView` (presentation) + context wrappers.
- **Defensive Field Visibility:** Only hide fields if valid default values exist (≥2 chars for name, valid phone/email for contacts).
- **API Integration:** Hybrid approach - looks up existing referees in ServiceTitan via `serviceTitanCRM.findCustomer()` (phone-based), links to existing customers, defers new customer creation to scheduler when address data is collected.
- **Workflow:** Submit referral → Look up existing customer → Create voucher → Background processor tracks job completion → Auto-credit when referee completes job.

**CRITICAL RULE: Customer Contact Management - Dual API System**
- Customer-level contacts: Use `serviceTitanCRM.getCustomerContacts(customerId)` - Returns contacts with methods array.
- Location-level contacts: Use `serviceTitanCRM.getLocationContacts(locationId)` - Returns contacts linked to specific location.
- Contacts can exist at customer level, location level, or both - must check both sources.

**CRITICAL RULE: Unified Session Architecture (Migration Complete)**
- The customer portal uses a SINGLE unified session system (`plumbing_session` cookie) via `getSession()` from `@/lib/session`
- **Centralized Helper:** All portal routes MUST use `getPortalSession()` and `assertCustomerOwnership()` from `server/lib/customer-portal/portal-session.ts`
- **Ownership Validation:** Use `assertCustomerOwnership(requestedId, availableCustomerIds)` before accessing customer data
- **Security:** Never trust request body customer IDs - always validate against `availableCustomerIds` from session

**CRITICAL RULE: Automated Testing with Playwright**
- Comprehensive end-to-end testing using Playwright for public website, customer portal, and admin panel
- **Test Structure:** Organized in `tests/` directory with subdirectories for public/, portal/, and admin/ tests
- **Coverage:** Tests verify critical user flows without manual clicking - login, appointments, invoices, booking, referrals, admin operations
- **Data Safety:** Tests use test customer ID (27881198) and mock phone numbers (512-555-XXXX format) - never touch production data

**CRITICAL RULE: Resend Email Integration - ALWAYS Use Replit Native Connector**
- ALL Resend API calls MUST use the Replit Native Connector via `getUncachableResendClient()` from `server/email.ts`
- NEVER use direct environment variables like `RESEND_API_KEY` or `REPLIT_CONNECTOR_RESEND_API_KEY`
- The connector provides both API key and from_email dynamically - credentials rotate automatically for security
- Benefits: Automatic credential rotation, centralized configuration, no manual secret management
- **Email Address Formatting:**
  - FROM field always shows: `"Economy Plumbing Services" <hello@plumbersthatcare.com>`
  - TO field can include customer names using `formatEmailAddress(email, name)` helper: `"John Smith <customer@email.com>"`
  - Use `toName` parameter to add customer names to TO field for better inbox display and engagement

**CRITICAL RULE: Database Lazy Initialization (Production Fix)**
- **Problem:** Eager database initialization at module load time caused 500 errors in production serverless environments.
- **Solution:** `server/db.ts` uses Proxy-based lazy initialization - database connection created on **first access**.
- **CRITICAL: Clear Build Cache After Database Changes:** When modifying `server/db.ts` or any core database files, ALWAYS run `rm -rf .next` to clear Next.js build cache before republishing.

## System Architecture

### Frontend
- **Framework & UI:** Next.js 15 App Router, React 18 with TypeScript, Radix UI, Shadcn UI, Tailwind CSS, CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **Navigation System:** Unified menu configuration in `src/lib/menuConfig.ts`.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation, and server-side dynamic phone tracking.
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, and commercial industry pages.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot with conversation history, image upload, and feedback.
- **Customer Portal:** Full-featured portal with ServiceTitan integration, 2FA, dashboard, appointments, memberships, vouchers, services, billing, settings, and self-service. The scheduler implements a 4-step flow (Service → Customer/Verification → Availability → Review) with SMS verification.
- **Admin Panel:** Features 23 sections including Dashboard, AI & Marketing, Communications, Content, Customers, Operations, and Settings.

### Backend
- **Framework & API:** Next.js 15 App Router (100+ API routes) and a `worker.ts` process for background jobs.
- **Data Layer:** Drizzle ORM for PostgreSQL (Neon-hosted) with over 60 tables.
- **Security & Type Safety:** Session-based authentication (`iron-session`), rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, 100% type-safe TypeScript with Drizzle Zod schemas, and audit logging.
- **ServiceTitan Integration:** Modular API wrappers for CRM, Jobs, Scheduler, Memberships, Estimates, Invoices, Photos/Attachments. Includes OAuth, customer/contact management (v2 API), job/appointment tracking, estimate/invoice webhooks, membership management, and scheduler integration.
- **Customer Portal Backend API:** 37 routes in `/api/portal/*` using unified session (`plumbing_session`) with centralized validation. Features phone-first SMS 2FA, self-service permissions, and ownership validation, including multi-account management.
- **Marketing Automation:** AI-powered personalized email campaigns, custom campaign scheduler, review request automation, and referral nurture emails.
- **SMS Marketing System:** SimpleTexting API integration for contact/list management, campaign creation, and two-way messaging.
- **Reputation Management System:** Webhook-triggered review requests and multi-platform review tracking.
- **Referral System:** Modular form architecture, instant voucher generation, ServiceTitan customer lookup, hybrid data storage, and background processing.
- **Email Preference Center:** Granular subscription management with token-based unsubscribe.
- **ServiceTitan Photo Fetch System:** Event-driven photo retrieval, AI quality analysis, Google Drive upload, and metadata storage.
- **Background Worker Schedulers:** `server/worker.ts` handles automated tasks like auto blog generation, photo cleanup, ServiceTitan photo fetch queue processing, review requests, referral nurturing, custom campaigns, ServiceTitan zone synchronization, and SEO audit processing.
- **SEO Audit System:** Local performance and SEO testing using Lighthouse, site-audit-seo, and seo-analyzer, with job queue management and an Admin UI.
- **Production Infrastructure:** Database transactions with idempotency, health monitoring, webhook signature verification, CRON job endpoints, and error tracking.
- **Analytics & Third-Party Script Management:** Integrates GA4, Meta Pixel, GTM, and Microsoft Clarity with script deferral and cookie consent.

## External Dependencies

- **ServiceTitan:** CRM, Jobs, Scheduler, Memberships, Estimates, Invoices, Photos/Attachments APIs
- **Stripe:** Payment processing
- **OpenAI:** GPT-4o and GPT-4o-mini for AI features
- **SimpleTexting:** SMS marketing
- **Resend:** Transactional and promotional email delivery, inbound email processing
- **Late API:** Social media scheduling and posting (Facebook, Instagram, LinkedIn, Twitter/X, Threads, TikTok, YouTube, Pinterest, Reddit, Bluesky)
- **Google Drive:** Photo storage and archiving (photos pushed from ServiceTitan)
- **SerpAPI:** Google review fetching
- **Ecwid:** E-commerce platform
- **Google Analytics 4:** Website analytics
- **Meta Pixel:** Ad tracking
- **Google Tag Manager:** Tag management
- **Microsoft Clarity:** Session recording
- **Google Places API:** Location services
- **Google Maps:** Mapping