# Economy Plumbing Services

## Overview
Economy Plumbing Services is a full-stack web application designed for plumbing businesses. It offers comprehensive service management, localized operations, content publishing, and e-commerce capabilities. The platform leverages AI for content creation, marketing, and reputation management to enhance local SEO, customer engagement, conversion rates, and operational efficiency, ultimately aiming to streamline business operations and strengthen digital presence.

## User Preferences
Preferred communication style: Simple, everyday language.

CRITICAL RULE: Single Module Pattern - DRY (Don't Repeat Yourself)
- ANY functionality used in more than one place MUST be a single reusable module called differently, never duplicated.
- Pattern: Create shared module → Import and use in multiple places → Both desktop and mobile use same data, just styled differently.

CRITICAL RULE: Modular, Reusable API Architecture
- Develop in modules for bug fixes, new features, code reusability, consistency, and faster testing/debugging.
- Architecture Pattern: Core Business Logic (pure functions, no auth/route concerns), API Routes (thin authentication wrappers), React Hooks & Components (accept auth context as parameters).

CRITICAL RULE: NEVER Auto-Generate or Hardcode Phone Numbers
- Always ask the user for phone numbers.
- Never use placeholder or hardcoded phone numbers in production code.
- All displayed phone numbers must come from the `tracking_numbers` table, environment variables, or user input via the admin panel.
- Test data and documentation may use (512) 555-XXXX format ONLY.

CRITICAL RULE: Always check existing functionality before creating new components/pages/features
- NEVER create a new component/page/feature without first searching the codebase for existing implementations.
- ALWAYS modify and refactor existing code rather than creating duplicates.
- Before adding new admin features, check if a route already exists and add new routes to the `AdminSidebar` menu.

CRITICAL RULE: Every new public page MUST have Header, Footer, and SEO optimization
- All public-facing pages must render Header and Footer components.
- Every page must have proper SEO metadata (title, description, Open Graph tags) using `getPageMetadata()` or manual export.

CRITICAL RULE: ServiceTitan API Implementation - ALWAYS Verify Before Writing
- Always check actual API wrapper code in `server/lib/servicetitan/` and endpoint implementation in `app/api/servicetitan/` before using ServiceTitan API.
- Verify exact fields available and ensure field names match ServiceTitan responses.

CRITICAL RULE: ServiceTitan Campaign ID Tracking
- Campaign IDs are required for all ServiceTitan job creation.
- Campaign resolution flow: UTM source lookup in `tracking_numbers` table, fallback to "website" campaign, or throw an error.
- Admin Panel at `/admin/tracking-numbers` manages UTM source to Campaign ID mappings.

CRITICAL RULE: Next.js Server-Side Rendering (SSR) - NEVER Break It
- This is a Next.js 15 App Router project; all pages are server-rendered by default for SEO.
- NEVER: wrap server components in 'use client' providers, create wrappers that force pages client-side, or make entire pages client-side to pass props.
- Correct Pattern: Server page fetches data server-side and passes it as props to a client component for UI rendering.

CRITICAL RULE: ServiceTitan API Testing Protocol
- ALWAYS test API endpoints with real customer data (ID: 27881198) BEFORE implementing features.
- Verify actual response structures, field names, and data types using test customer.

CRITICAL RULE: Automated Testing with Playwright
- Comprehensive end-to-end testing using Playwright for public website, customer portal, and admin panel
- Test Structure: Organized in `tests/` directory with subdirectories for public/, portal/, and admin/ tests
- Coverage: Tests verify critical user flows without manual clicking - login, appointments, invoices, booking, referrals, admin operations
- Data Safety: Tests use test customer ID (27881198) and mock phone numbers (512-555-XXXX format) - never touch production data

CRITICAL RULE: Resend Email Integration - ALWAYS Use Replit Native Connector
- ALL Resend API calls MUST use the Replit Native Connector via `getUncachableResendClient()` from `server/email.ts`
- NEVER use direct environment variables like `RESEND_API_KEY` or `REPLIT_CONNECTOR_RESEND_API_KEY`
- The connector provides both API key and from_email dynamically - credentials rotate automatically for security
- Benefits: Automatic credential rotation, centralized configuration, no manual secret management
- Email Address Formatting:
  - FROM field always shows: `"Economy Plumbing Services" <hello@mail.plumbersthatcare.com>`
  - TO field can include customer names using `formatEmailAddress(email, name)` helper: `"John Smith <customer@email.com>"`
  - Use `toName` parameter to add customer names to TO field for better inbox display and engagement

CRITICAL RULE: Google Drive Integration - ALWAYS Use Replit Native Connector
- ALL Google Drive API calls MUST use the Replit Native Connector via `getUncachableGoogleDriveClient()` helper functions
- NEVER use direct environment variables like `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, or `GOOGLE_SERVICE_ACCOUNT_JSON`
- The connector provides OAuth access tokens dynamically - credentials rotate automatically for security
- Benefits: Automatic credential rotation, OAuth flow handled by Replit, no manual secret management
- Implementation Locations:
  - `server/lib/googleDriveMonitor.ts` - Photo monitoring and import from Google Drive folders
  - `server/lib/servicetitanPhotoFetcher.ts` - ServiceTitan job photos uploaded to Google Drive
- Pattern: Token caching with expiry check, automatic refresh via Replit connector API

CRITICAL RULE: Database Lazy Initialization (Production Fix)
- Problem: Eager database initialization at module load time caused 500 errors in production serverless environments.
- Solution: `server/db.ts` uses Proxy-based lazy initialization - database connection created on **first access**.
- CRITICAL: Clear Build Cache After Database Changes: When modifying `server/db.ts` or any core database files, ALWAYS run `rm -rf .next` to clear Next.js build cache before republishing.

CRITICAL RULE: Phone Number Architecture - UTM-Driven Tracking System
- Phone numbers are **NEVER** hardcoded or static in the codebase.
- System: `PhoneConfigProvider` (server-side) → `tracking_numbers` table → displays different numbers based on `utm_source` parameter
- Admin UI: `/admin/tracking-numbers` manages all phone number mappings and UTM source → ServiceTitan Campaign ID associations
- DO NOT create "primary phone" or "default phone" in business metadata files
- DO NOT bypass tracking number system for any phone display (UI, error messages, emails, social media)
- Fallback/Default: Query `tracking_numbers` table for default phone (where `isDefault=true`) - never hardcode
- Helper Functions: Use `getPhoneNumbers(searchParams)` which respects UTM params and returns appropriate phone for visitor's source
- Benefits: Call attribution tracking, campaign performance measurement, automated ServiceTitan job tagging
- Files: `src/providers/PhoneConfigProvider.tsx`, `server/lib/phoneNumbers.ts`, `app/admin/tracking-numbers/`

CRITICAL RULE: Business Metadata - Static for SEO Performance
- File: `src/lib/businessMetadata.ts` contains static NAP data (Name, Address, Phone) for JSON-LD/SEO
- Used by: SEO/JSON-LD generation, Open Graph tags, schema.org markup
- DO NOT migrate business metadata to database - static files are FASTER and better for SEO
- DO NOT fetch business metadata from database on every request - degrades page load performance
- WHY: Google/search engines prefer predictable, fast-loading structured data for indexing
- Only update when business info actually changes (rare events like address change, new locations)
- Future Enhancement: If admin editability needed, use ISR caching (Next.js revalidation) or build-time generation, NOT per-request database queries
- Pattern: Static export for speed → Import where needed → Consistent data across all pages

CRITICAL RULE: Scheduler Address Validation - NO DEFAULTS
- NEVER use fallback values like `|| 'Austin'`, `|| 'TX'`, or `|| '78701'` in address fields
- ALWAYS require complete address (street, city, state, zip) from user before booking
- FAIL booking request if any required address field is missing - throw validation error
- Location: `app/api/scheduler/book/route.ts` - Lines 126-128, 139-141 previously had dangerous defaults
- Rationale: Default addresses create incorrect customer records in ServiceTitan, mix up customer data, and cause billing/service location confusion
- Correct Pattern: Validate all fields are present → Throw error if missing → Frontend displays clear validation message
- Exception: If customer is authenticated and has existing location, may prefill from their account (but still validate)

CRITICAL RULE: Hardcoded Values - Centralized Sources Only
- Phone numbers: Query `tracking_numbers` table (never hardcode strings like "(512) 368-9159")
- Business info: Import from `businessMetadata.ts` (never inline company name, address, etc.)
- Email addresses: Use `businessMetadata.ts` or admin `systemSettings` table
- FORBIDDEN: Inline strings scattered throughout codebase for business contact info
- Pattern: Single source of truth → Import/query where needed → Update in one place, changes everywhere
- Benefits: Consistency, maintainability, prevents outdated contact info in production
- Audit: Regularly grep codebase for phone patterns like `(512)`, `512-`, email patterns to catch violations

CRITICAL RULE: Customer Portal API - Single Source of Truth
- ALL portal customer data MUST flow through `/api/portal/customer/[id]/route.ts` - the single source of truth with proper security
- NEVER create duplicate customer data endpoints without session validation and ownership assertion
- Security Pattern: Every portal endpoint MUST call `getPortalSession()` and `assertCustomerOwnership()` before returning data
- Cache Invalidation: React Query keys MUST use numeric customerId format: `['/api/portal/customer', customerId]` (NOT string)
- Contact Mutations: ALL contact mutation hooks in `src/modules/contacts/hooks/useContactMutation.ts` invalidate cache with numeric customerId
- Location Contacts: Handle undefined `contact.methods` with fallback `(contact.methods || [])` to prevent crashes
- Modular Architecture: Portal service uses `server/lib/servicetitan/portal-service.ts` for business logic separation
- Files: `app/api/portal/customer/[id]/route.ts`, `app/api/portal/customer-locations/[customerId]/route.ts`, `src/modules/contacts/hooks/useContactMutation.ts`
- Test Customer IDs: 27881198, 3153460 (both have multiple locations and contacts for testing)

## System Architecture

### Frontend
- **Framework & UI:** Next.js 15 App Router, React 18, TypeScript, Radix UI, Shadcn UI, Tailwind CSS, CVA. Utilizes a blue/teal color scheme, Inter/Poppins typography, light/dark modes, and WCAG AA Compliance.
- **SEO & Performance:** `SEOHead`, JSON-LD, 301 redirects, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap, server-side dynamic phone tracking.
- **Key Features:** Standard website pages, Ecwid Store integration, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot with conversation history, image upload, and feedback.
- **Customer Portal:** ServiceTitan integrated portal with 2FA, dashboard, appointment management, memberships, vouchers, service history, billing, settings, and a 4-step scheduler with SMS verification.
- **Admin Panel:** Comprehensive interface for Dashboard, AI & Marketing, Communications, Content, Customers, Operations, and Settings.

### Backend
- **Framework & API:** Next.js 15 App Router with over 100 API routes and a `worker.ts` for background job processing.
- **Data Layer:** Drizzle ORM for PostgreSQL (Neon-hosted) managing over 60 tables.
- **Security & Type Safety:** Session-based authentication (`iron-session`), rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, 100% type-safe TypeScript with Drizzle Zod schemas, and audit logging.
- **ServiceTitan Integration:** Modular API wrappers for CRM, Jobs, Scheduler, Memberships, Estimates, Invoices (v2 API), including OAuth, customer/contact management, job/appointment tracking, estimate/invoice webhooks, and membership management.
- **Customer Portal Backend API:** 37 routes under `/api/portal/*` with unified session, centralized validation, phone-first SMS 2FA, self-service permissions, and ownership validation, supporting multi-account management.
- **Marketing Automation:** AI-powered personalized email campaigns, custom campaign scheduler, review request automation, and referral nurture emails.
- **SMS Marketing System:** Integrates with SimpleTexting API for contact/list management, campaign creation, and two-way messaging.
- **Reputation Management System:** Webhook-triggered review requests and multi-platform review tracking.
- **Referral System:** Modular form architecture, instant voucher generation, ServiceTitan customer lookup, hybrid data storage, and background processing.
- **Email Preference Center:** Granular subscription management with token-based unsubscribe.
- **ServiceTitan Photo Fetch System:** Event-driven photo retrieval, AI quality analysis, Google Drive upload, and metadata storage.
- **Background Worker Schedulers:** Handles automated tasks such as auto blog generation, photo cleanup, ServiceTitan photo fetch queue processing, review requests, referral nurturing, custom campaigns, ServiceTitan zone synchronization, and SEO audit processing.
- **SEO Audit System:** Conducts local performance and SEO testing using Lighthouse, site-audit-seo, and seo-analyzer, with job queue management and an Admin UI.
- **Production Infrastructure:** Supports database transactions with idempotency, health monitoring, webhook signature verification, CRON job endpoints, and error tracking.
- **Analytics & Third-Party Script Management:** Integrates GA4, Meta Pixel, GTM, and Microsoft Clarity with script deferral and cookie consent.

## External Dependencies

- **ServiceTitan:** CRM, Jobs, Scheduler, Memberships, Estimates, Invoices APIs
- **Stripe:** Payment processing
- **OpenAI:** GPT-4o and GPT-4o-mini
- **SimpleTexting:** SMS marketing
- **Resend:** Email delivery
- **Late API:** Social media scheduling
- **Google Drive:** Photo storage
- **SerpAPI:** Google review fetching
- **Ecwid:** E-commerce platform
- **Google Analytics 4:** Website analytics
- **Meta Pixel:** Ad tracking
- **Google Tag Manager:** Tag management
- **Microsoft Clarity:** Session recording
- **Google Places API:** Location services
- **Google Maps:** Mapping