# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence, manage operations, and drive growth. It provides service information, covered areas, blog content, and an online store. The project integrates AI for content generation, marketing automation, and reputation management to boost local SEO, user engagement, and conversion rates, ultimately expanding market reach and customer engagement. Key ambitions include becoming a leading service provider by leveraging technology, increasing customer lifetime value through personalized engagement, and optimizing operational efficiency with intelligent automation.

## User Preferences
Preferred communication style: Simple, everyday language.

**CRITICAL RULE: NEVER Auto-Generate or Hardcode Phone Numbers**
- If you need a phone number, ASK the user for it
- Never use placeholder phone numbers in production code
- Never hardcode phone numbers
- Fallback/default phones in server code MUST be real business numbers provided by user via environment variables
- All phone numbers displayed to users must come from:
  1. Database tracking_numbers table (preferred - allows dynamic tracking)
  2. Environment variables (NEXT_PUBLIC_DEFAULT_AUSTIN_PHONE, NEXT_PUBLIC_DEFAULT_MARBLE_FALLS_PHONE)
  3. User input via admin panel
- Server-side ultimate fallbacks: `server/lib/phoneNumbers.ts` uses environment variables, logs errors if not set
- Client components: Should receive phone config from server via props; use "Loading..." fallback if not provided
- Exception: Test data and documentation can use (512) 555-XXXX format ONLY

**CRITICAL RULE: Always check existing functionality before creating new pages/features**
- The Admin Panel uses a modular architecture with shared sidebar navigation (`src/components/admin-sidebar.tsx`)
- Main dashboard at `/admin` shows DashboardOverviewClient (metrics, stats, system health)
- Specialized sections have dedicated routes: `/admin/photos`, `/admin/email-marketing`, `/admin/sms`, etc.
- NEVER create duplicate admin pages without first checking AdminSidebar to see if route already exists
- When adding new admin features, add route to AdminSidebar menu sections
- Before implementing any new feature, search the codebase to verify it doesn't already exist
- Consolidation over duplication: One implementation per feature, accessible via sidebar navigation

**CRITICAL RULE: Every new public page MUST have Header, Footer, and SEO optimization**
- ALL public-facing pages must import and render Header and Footer components
- Header receives phoneConfig prop from server-side getPhoneNumbers() for UTM tracking
- Every page MUST have proper SEO metadata (title, description, Open Graph tags)
- Use `getPageMetadata()` helper or manual metadata export for SEO
- Example pattern: Server component passes phoneConfig → Client component renders <Header austinPhone={phoneConfig} /> + content + <Footer />
- Pages without Header/Footer will confuse users and hurt SEO - this is non-negotiable

**CRITICAL RULE: ServiceTitan API Implementation - ALWAYS Verify Before Writing**
- NEVER assume API response structures - ALWAYS check actual code first
- NEVER search the web for ServiceTitan API docs - use ONLY our existing implementation as source of truth
- Before writing ANY code that filters/maps ServiceTitan data:
  1. Read the actual API wrapper code in `server/lib/servicetitan/`
  2. Check the endpoint implementation in `app/api/servicetitan/`
  3. Verify the EXACT fields available in the response
  4. Confirm field names match what ServiceTitan actually returns
- Example: Appointments have `jobId` (not `locationId`), must join with jobs to get location
- Example: Invoices require per-location queries (`invoices?customerId=X&locationId=Y`)
- If unsure about a field's existence, grep the codebase for actual usage before assuming
- Document any new API patterns discovered in this file for future reference

## System Architecture

### Frontend
- **Framework & UI:** Next.js 15 App Router, React 18 with TypeScript, Radix UI, Shadcn UI, Tailwind CSS, CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation, and server-side dynamic phone tracking based on UTM parameters for crawlers.
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and a Customer Portal with ServiceTitan integration supporting phone-based login.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panel:** Modular architecture with 21 routes, shared sidebar (`src/components/admin-sidebar.tsx`), wrapped in `app/admin/layout.tsx`. Main sections: Overview, AI Marketing, Communications, Content, Customers, Site Configuration. Features consolidated tabbed interfaces for Email Marketing (Custom Campaigns) and Reputation (GMB Reviews, Profiles, GMB Setup).
- **Settings Page (`/admin/settings`):** Central hub for Company Info, Marketing Settings, Feature Toggles (review requests, referral nurture, AI blog generation, Google Drive sync), and Pricing Configuration.
- **URL Structure:** Blog Posts at `/{slug}`, Service Areas at `/service-areas/{slug}`, Static Pages at direct paths (e.g., `/contact`).
- **Scheduler Architecture (Refactored Nov 2025):**
  - **Working Scheduler:** Full implementation at `src/components/scheduler/` (ServiceStep, AvailabilityStep, CustomerStep, ReviewStep) with 450+ lines per component - PRODUCTION READY
  - **Public Access:** SchedulerBridge (`src/modules/scheduler/components/SchedulerBridge.tsx`) wraps SchedulerFlow in a modal, triggered by header "Schedule Service" buttons via SchedulerContext
  - **Customer Portal:** SchedulerDialog (`src/modules/scheduler/components/SchedulerDialog.tsx`) uses the same working scheduler components for authenticated customers
  - **Stub Cleanup:** Deleted all placeholder step components from `src/modules/scheduler/components/steps/` (Nov 2025) - no stubs remain
  - **Type Safety:** All scheduler components use shared types from `@shared/types/scheduler` with proper TimeSlot discriminated union (isBackflow: boolean for regular vs backflow slots)

### Backend
- **Framework & API:** Next.js 15 App Router (API routes) and a `worker.ts` process for background jobs.
- **Data Layer:** Drizzle ORM for PostgreSQL.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers, Vouchers, Quote Follow-up Campaigns, Customer Data Imports.
- **Dynamic Phone Number Tracking:** Server-side UTM-based resolution during SSR, enhanced client-side with cookies/referrer.
- **Security & Type Safety:** Session-based authentication (`iron-session`) for admin, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, 100% type-safe TypeScript.
- **ServiceTitan Integration:**
  - **Customer Contact Database (`customers_xlsx`):** Tracks customer phone numbers and emails for ServiceTitan ID matching.
  - **API Services:** Custom ServiceTitan scheduler with OAuth, CRM, Jobs, Settings services.
  - **Smart Scheduler Architecture:** Utilizes parallel capacity requests, dynamic arrival windows, 2-hour appointment slot generation, smart proximity scoring, and Hill Country filtering with 5-minute response caching.
  - **Appointment Booking Rules:** Regular services show 4-hour arrival windows, internally book 2-hour appointments. Backflow Testing ONLY uses 12-hour windows (8am-8pm). Capacity API dictates available hours, windows offered only if ≥2 hours capacity.
  - **Unified Scheduler System:** Frontend, customer portal reschedule, and AI chatbot all use `/api/scheduler/smart-availability`.
  - **ServiceTitan CRM v2 Refactoring (Jan 2025):** Removed deprecated v1 embedded contacts from customer/location creation, restored multi-address email normalization, fixed locationId linking regression in contact workflow.
- **Customer Portal Backend API (Production-Ready):**
  - **Architecture:** Phone-first SMS 2FA login, ServiceTitan API v2 as single source of truth, modular route design (account/locations/contacts).
  - **Self-Service Permissions:** Customers CAN edit: billing address, location names, contact phone/email. Customers CANNOT edit: service addresses, customer type, business data, Fax/Landline contacts.
  - **Production Security:**
    - Rate Limiting: 10 mutations per 5 minutes per session (per-session limits via in-memory store).
    - Audit Logging: All ServiceTitan write operations logged with traceId capture from RFC7807 errors.
    - Standardized Errors: All API responses use `{code, message, traceId?, details?}` format for consistent client handling.
    - Session-based authentication via iron-session, ownership validation on all operations.
  - **Business Rules:** Min 1 contact enforcement (cannot delete last contact), only MobilePhone/Email contact methods exposed (Fax/Landline hidden).
  - **API Routes:**
    - `PATCH /api/customer-portal/account`: Update billing address only (NOT service address).
    - `PATCH /api/customer-portal/locations/[id]`: Rename location only (ownership validated).
    - `POST /api/customer-portal/contacts`: Create new contact (phone required, email optional, auto-linked to customer+location).
    - `PATCH /api/customer-portal/contacts/[id]`: Update contact name/phone/email (ownership validated).
    - `DELETE /api/customer-portal/contacts/[id]`: Delete contact (min 1 contact rule enforced, ownership validated).
  - **Chatbot Security:** Public chatbot can CREATE customers (via ServiceTitan CRM), but UPDATE/DELETE operations require authentication.
- **Marketing Automation:** AI-powered personalized email campaigns using OpenAI GPT-4o with admin approval.
- **SMS Marketing System:** Integration with SimpleTexting API for contact/list management, campaign creation/scheduling, and messaging.
- **Reputation Management System:** Webhook-triggered review request automation:
  - **Architecture:** WEBHOOK-ONLY (no ServiceTitan API polling). Mailgun forwards ServiceTitan invoice PDFs → webhook creates `job_completion` → `review_request` → sends Email 1 + SMS immediately.
  - **Database Schema:** `job_completions` (from webhook, idempotency via `mailgunMessageId`), `review_requests` (linked to `job_completions`, tracks status, sends).
  - **Webhook Flow (`/api/webhooks/mailgun/servicetitan`):** Verifies signature, parses invoice PDF, matches customer, checks idempotency (existing messageId or active review request), creates `job_completion`, creates `review_request`, sends Email 1 and SMS immediately.
  - **Worker Role (`server/worker.ts`):** Runs every 30 minutes to send follow-up emails 2, 3, 4 on Days 7, 14, 21 based on `completionDate`.
  - **Idempotency:** Webhook checks `mailgunMessageId` and existing `review_requests`.
  - **Invoice Total Handling:** Parser returns amounts in cents, stored as-is in DB.
- **Referral System:** Instant voucher generation with QR codes.
- **Email Preference Center:** Granular subscription management.
- **Production Infrastructure:** Automated schedulers, database transactions, idempotency, health monitoring, admin alerting, webhook signature verification.

### Analytics & Third-Party Script Management
- **Tracking:** Google Analytics 4, Meta Pixel, Google Tag Manager, Microsoft Clarity.
- **Optimization:** Aggressive deferral for script loading.
- **Conversion Tracking:** Comprehensive for forms, phone clicks, scheduler opens, memberships.
- **Privacy:** Cookie consent integration.

## External Dependencies

- **E-commerce Platform:** Ecwid (Stripe for payments), Printful, Spocket.
- **Database:** Neon (PostgreSQL).
- **Online Scheduler:** ServiceTitan.
- **Email Integration:** Resend (transactional), Mailgun (webhook-based XLSX imports).
- **SMS Provider:** SimpleTexting.
- **AI Services:** OpenAI (GPT-4o, GPT-4o-mini).
- **Photo Management:** CompanyCam, Google Drive.
- **Google Services:** Google Places API, Google Maps.
- **SEO Data:** DataForSEO API.
- **Social Media:** Meta Graph API.
- **Review Fetching:** SerpAPI.