# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence, streamline operations, and drive growth. It offers comprehensive service information, covered areas, blog content, and an online store. The project integrates AI for content generation, marketing automation, and reputation management, focusing on boosting local SEO, user engagement, and conversion rates. The vision is to leverage technology for operational efficiency and superior customer engagement to become a leading service provider.

## User Preferences
Preferred communication style: Simple, everyday language.

**CRITICAL RULE: Single Module Pattern - DRY (Don't Repeat Yourself)**
- ANY functionality used in more than one place MUST be a single reusable module called differently, never duplicated.
- Examples: Menu configuration (`src/lib/menuConfig.ts`), email utilities (`server/email.ts`), session helpers (`server/lib/customer-portal/portal-session.ts`).
- Pattern: Create shared module → Import and use in multiple places → Both desktop and mobile use same data, just styled differently.
- Red Flags - NEVER do this: Duplicate menu definitions, copy-paste code between components, hardcode same data in multiple files.

**CRITICAL RULE: Modular, Reusable API Architecture**
- Develop in modules for bug fixes, new features, code reusability, consistency, and faster testing/debugging.
- Architecture Pattern: Core Business Logic (pure functions, no auth/route concerns), API Routes (thin authentication wrappers), React Hooks & Components (accept auth context as parameters).
- Red Flags - NEVER do this: Duplicating ServiceTitan API calls, writing business logic in API handlers, hardcoding authentication in core modules, copy-pasting code, creating context-specific functionality.

**CRITICAL RULE: NEVER Auto-Generate or Hardcode Phone Numbers**
- Always ask the user for phone numbers.
- Never use placeholder or hardcoded phone numbers in production code.
- All displayed phone numbers must come from the `tracking_numbers` table, environment variables, or user input via the admin panel.
- Test data and documentation may use (512) 555-XXXX format ONLY.

**CRITICAL RULE: Always check existing functionality before creating new components/pages/features**
- NEVER create a new component/page/feature without first searching the codebase for existing implementations.
- ALWAYS modify and refactor existing code rather than creating duplicates.
- Use grep/search tools to find existing implementations before writing new code.
- Before adding new admin features, check if a route already exists and add new routes to the `AdminSidebar` menu.
- Consolidate features: one implementation per feature, accessible via sidebar.

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
- **Frontend:** Modular architecture with `useReferralForm` hook (headless logic) + `ReferralFormView` (presentation) + context wrappers (`PublicReferralForm` for public pages, `PortalReferralForm` for customer portal with pre-fill).
- **Defensive Field Visibility:** Only hide fields if valid default values exist (≥2 chars for name, valid phone/email for contacts).
- **API Integration:** Hybrid approach - looks up existing referees in ServiceTitan via `serviceTitanCRM.findCustomer()` (phone-based), links to existing customers, defers new customer creation to scheduler when address data is collected.
- **Email-only referrals:** Skip ServiceTitan lookup (phone required for API), defer customer creation to booking flow.
- **Workflow:** Submit referral → Look up existing customer → Create voucher → Background processor tracks job completion → Auto-credit when referee completes job.
- **Customer Portal:** Inline toggle form (not modal) with pre-filled referrer data extracted from customer contacts.

**CRITICAL RULE: Customer Contact Management - Dual API System**
- Customer-level contacts: Use `serviceTitanCRM.getCustomerContacts(customerId)` - Returns contacts with methods array.
- Location-level contacts: Use `serviceTitanCRM.getLocationContacts(locationId)` - Returns contacts linked to specific location.
- Contacts can exist at customer level, location level, or both - must check both sources.

**CRITICAL RULE: Unified Session Architecture (Migration Complete)**
- The customer portal uses a SINGLE unified session system (`plumbing_session` cookie) via `getSession()` from `@/lib/session`
- **Centralized Helper:** All portal routes MUST use `getPortalSession()` and `assertCustomerOwnership()` from `server/lib/customer-portal/portal-session.ts`
- **Session Pattern:** Routes call `const { customerId, availableCustomerIds } = await getPortalSession()` for validation
- **Ownership Validation:** Use `assertCustomerOwnership(requestedId, availableCustomerIds)` before accessing customer data
- **All Routes Migrated:** 37 portal routes in `/api/portal/*` now use unified session helper (legacy `customer_portal_session` cookie completely removed)
- **Security:** Never trust request body customer IDs - always validate against `availableCustomerIds` from session
- **Session Management:** Authentication endpoints (verify-code, logout, switch-account) use `session.destroy()` for cleanup

**CRITICAL RULE: Automated Testing with Playwright**
- Comprehensive end-to-end testing using Playwright for public website, customer portal, and admin panel
- **Test Structure:** Organized in `tests/` directory with subdirectories for public/, portal/, and admin/ tests
- **Test Helpers:** Reusable utilities in `tests/helpers/` for authentication, navigation, and assertions
- **Coverage:** Tests verify critical user flows without manual clicking - login, appointments, invoices, booking, referrals, admin operations
- **Commands:** `npm test` runs full suite, `npm test:public`, `npm test:portal`, `npm test:admin` run specific sections
- **CI-Ready:** Tests run against development server and use mock data to avoid affecting real customer data or ServiceTitan API
- **Data Safety:** Tests use test customer ID (27881198) and mock phone numbers (512-555-XXXX format) - never touch production data

**CRITICAL RULE: Resend Email Integration - ALWAYS Use Replit Native Connector**
- ALL Resend API calls MUST use the Replit Native Connector via `getUncachableResendClient()` from `server/email.ts`
- NEVER use direct environment variables like `RESEND_API_KEY` or `REPLIT_CONNECTOR_RESEND_API_KEY`
- The connector provides both API key and from_email dynamically - credentials rotate automatically for security
- Pattern: `const { client, fromEmail } = await getUncachableResendClient()` then use `client.emails.send()`
- Webhook signature verification uses `RESEND_WEBHOOK_SIGNING_SECRET` environment variable (this is correct)
- Attachment fetching extracts API key from connector client: `apiKey = (client as any).key`
- Benefits: Automatic credential rotation, centralized configuration, no manual secret management
- **Email Address Formatting:**
  - FROM field always shows: `"Economy Plumbing Services" <hello@plumbersthatcare.com>`
  - TO field can include customer names using `formatEmailAddress(email, name)` helper: `"John Smith <customer@email.com>"`
  - Pattern: `await sendEmail({ to: email, toName: customerName, subject, html })` for personalized recipient display
  - Use `toName` parameter to add customer names to TO field for better inbox display and engagement
  - Full documentation available at `docs/email-from-formatting.md`

**CRITICAL RULE: Database Lazy Initialization (Production Fix)**
- **Problem:** Eager database initialization at module load time caused 500 errors in production serverless environments where connection isn't ready during build/init phase.
- **Solution:** `server/db.ts` uses Proxy-based lazy initialization - database connection created on **first access**, not at module load time.
- **Implementation:**
  - Private singleton: `let _db: ReturnType<typeof drizzle> | null = null`
  - Initialization gate: `function initializeDatabase()` creates connection only once when first called
  - Proxy exports with function binding: `export const db = new Proxy(...)` that properly binds methods to real Drizzle instance
  - Alternative getters: `getDb()` and `getPool()` for code that needs concrete instances (e.g., `instanceof` checks)
- **Pattern:** All existing code continues to work: `import { db } from '@/server/db'` - no changes required to 120+ API routes
- **Production-Ready:** Architect-approved solution that preserves Pool/Drizzle semantics while avoiding module-load connection attempts
- **CRITICAL: Clear Build Cache After Database Changes:** When modifying `server/db.ts` or any core database files, ALWAYS run `rm -rf .next` to clear Next.js build cache before republishing. Production deployments use cached builds, so changes won't take effect without clearing the cache first.
- **Red Flags - NEVER do this:** Revert to eager initialization (`const pool = new Pool()` at top level), bypass lazy loading, modify 100+ routes when a single-file fix exists, or republish without clearing `.next` cache after database changes>

## System Architecture

### Frontend
- **Framework & UI:** Next.js 15 App Router, React 18 with TypeScript, Radix UI, Shadcn UI, Tailwind CSS, CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **Navigation System:** Unified menu configuration in `src/lib/menuConfig.ts`.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation, and server-side dynamic phone tracking.
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, and commercial industry pages.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot with conversation history, image upload, and feedback.
- **Customer Portal:** Full-featured portal with ServiceTitan integration, 2FA, dashboard, appointments, memberships, vouchers, services, billing, settings, and self-service.
- **Scheduler Architecture:** Implemented at `src/components/scheduler/` with Service, Availability, Customer, and Review steps, smart availability, dynamic arrival windows, proximity scoring, and photo upload.
- **Admin Panel:** Features 23 sections including Dashboard, AI & Marketing, Communications, Content, Customers, Operations, and Settings.

### Backend
- **Framework & API:** Next.js 15 App Router (100+ API routes) and a `worker.ts` process for background jobs.
- **Data Layer:** Drizzle ORM for PostgreSQL (Neon-hosted) with over 60 tables.
- **Security & Type Safety:** Session-based authentication (`iron-session`), rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, 100% type-safe TypeScript with Drizzle Zod schemas, and audit logging.
- **ServiceTitan Integration:** Modular API wrappers for CRM, Jobs, Scheduler, Memberships, Estimates, Invoices, Photos/Attachments. Includes OAuth, customer/contact management (v2 API), job/appointment tracking, estimate/invoice webhooks, membership management, and scheduler integration.
- **Customer Portal Backend API:** 37 routes in `/api/portal/*` using unified session (`plumbing_session`) with centralized validation. Features phone-first SMS 2FA, self-service permissions, and ownership validation.
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
- **Resend:** Transactional email delivery and inbound email processing
- **CompanyCam:** Photo management
- **Google Drive:** Photo import automation
- **SerpAPI:** Google review fetching
- **Ecwid:** E-commerce platform
- **Google Analytics 4:** Website analytics
- **Meta Pixel:** Ad tracking
- **Google Tag Manager:** Tag management
- **Microsoft Clarity:** Session recording
- **Google Places API:** Location services
- **Google Maps:** Mapping