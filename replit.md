# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence, manage operations, and drive growth. It provides service information, covered areas, blog content, and an online store. The project integrates AI for content generation, marketing automation, and reputation management to boost local SEO, user engagement, and conversion rates, ultimately expanding market reach and customer engagement. Key ambitions include becoming a leading service provider by leveraging technology, increasing customer lifetime value through personalized engagement, and optimizing operational efficiency with intelligent automation.

## User Preferences
Preferred communication style: Simple, everyday language.

**CRITICAL RULE: Modular, Reusable API Architecture**

This is the foundational principle of our entire codebase. ALWAYS develop in modules.

**Why Modular Development:**
- One bug fix applies everywhere (e.g., changing `link.id` to `link.contactId` fixed scheduler AND customer portal simultaneously)
- New features instantly available in all contexts (portal, scheduler, chatbot)
- Eliminates duplicate code and reduces maintenance burden
- Ensures consistency across user experiences
- Makes testing and debugging faster

**Architecture Pattern:**
1. **Core Business Logic:** Pure functions in `server/lib/servicetitan/` (or equivalent module directories)
   - NO authentication logic
   - NO route-specific concerns
   - ONLY business operations and data transformations
   - Example: `server/lib/servicetitan/crm.ts` → `getCustomerContacts(customerId)`, `createCompleteContact(customerId, data)`

2. **API Routes (Context Wrappers):** Thin authentication/authorization layers in `app/api/[context]/`
   - Validate authentication (session tokens, API keys, etc.)
   - Extract user identity from auth context
   - Call core business logic functions
   - Handle errors and return responses
   - Example: `app/api/customer-portal/contacts/route.ts` → validates portal session → calls `serviceTitanCRM.getCustomerContacts(customerId)`
   - Example: `app/api/scheduler/customer-contacts/route.ts` → validates scheduler token → calls same `serviceTitanCRM.getCustomerContacts(customerId)`

3. **React Hooks & Components:** Accept auth context as parameters
   - Never hardcode authentication assumptions
   - Accept tokens/sessions as hook parameters
   - Work in any context (portal, scheduler, chatbot)
   - Example: `useSchedulerContacts(sessionToken)` can be adapted for portal via `usePortalContacts(portalSession)`

**Implementation Checklist:**
Before writing ANY new feature:
- [ ] Does similar functionality already exist? (grep/search first)
- [ ] Can this be used in portal, scheduler, AND chatbot contexts?
- [ ] Am I putting business logic in a reusable module, not in API routes?
- [ ] Are my API routes just thin wrappers around core functions?
- [ ] Can someone else add a new context (e.g., mobile app API) without duplicating my work?

**Red Flags - NEVER do this:**
- ❌ Duplicating ServiceTitan API calls across different routes
- ❌ Writing business logic inside API route handlers
- ❌ Hardcoding authentication in core modules
- ❌ Copy-pasting functions between portal/scheduler/chatbot code
- ❌ Creating context-specific versions of the same functionality

**Real Example - Contact Management:**
- ✅ Core: `server/lib/servicetitan/crm.ts` → `getCustomerContacts()`, `createCompleteContact()`, `updateContact()`, `deleteContact()`
- ✅ Portal API: `app/api/customer-portal/contacts/route.ts` → validates portal session → calls core functions
- ✅ Scheduler API: `app/api/scheduler/customer-contacts/route.ts` → validates scheduler token → calls same core functions
- ✅ Result: ONE bug fix in `crm.ts` fixed contact fetching in BOTH contexts simultaneously

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
- **Admin Panel:** Modular architecture with 21 routes, shared sidebar (`src/components/admin-sidebar.tsx`). Main sections: Overview, AI Marketing, Communications, Content, Customers, Site Configuration. Features consolidated tabbed interfaces for Email Marketing (Custom Campaigns) and Reputation (GMB Reviews, Profiles, GMB Setup). Settings Page (`/admin/settings`) is a central hub for Company Info, Marketing Settings, Feature Toggles, and Pricing Configuration.
- **URL Structure:** Blog Posts at `/{slug}`, Service Areas at `/service-areas/{slug}`, Static Pages at direct paths (e.g., `/contact`).
- **Scheduler Architecture:** Full implementation at `src/components/scheduler/` (ServiceStep, AvailabilityStep, CustomerStep, ReviewStep). Public access via `SchedulerBridge` in a modal. Customer Portal uses `SchedulerDialog` for authenticated customers. Type safety is maintained via `@shared/types/scheduler`.
- **2FA Authentication:** Dual-mode phone/email verification with SMS OTP (SimpleTexting) and email codes (Resend), including rate limiting and comprehensive error handling.
- **Session Management:** Secure server-side session tokens with HMAC-SHA256 signatures, 24-hour TTL, and customer ID resolution from database, persisted via `useSchedulerSession` hook using localStorage (survives tab closes).
- **Scheduler Contact Management (Nov 2025):** Full CRUD operations (GET/POST/PATCH/DELETE) via `app/api/scheduler/customer-contacts/route.ts`. All endpoints use Authorization header for session tokens (no query strings/body), audit logging on mutations, rate limiting. ContactsManager component provides add/edit/delete dialogs when authenticated, read-only masked view when unauthenticated. React hooks (useSchedulerAddContact, useSchedulerUpdateContact, useSchedulerDeleteContact) reuse shared ServiceTitan CRM functions. Modular pattern documented for extension to chatbot/portal - PRODUCTION READY

### Backend
- **Framework & API:** Next.js 15 App Router (API routes) and a `worker.ts` process for background jobs.
- **Data Layer:** Drizzle ORM for PostgreSQL.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers, Vouchers, Quote Follow-up Campaigns, Customer Data Imports.
- **Dynamic Phone Number Tracking:** Server-side UTM-based resolution during SSR, enhanced client-side with cookies/referrer.
- **Security & Type Safety:** Session-based authentication (`iron-session`) for admin, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, 100% type-safe TypeScript.
- **ServiceTitan Integration:** Includes customer contact database tracking, custom scheduler with OAuth, CRM, Jobs, Settings services. Smart Scheduler Architecture utilizes parallel capacity requests, dynamic arrival windows, 2-hour appointment slot generation, smart proximity scoring, and response caching. Appointment booking rules dictate specific window types for regular services and backflow testing. Unified scheduler system across frontend, customer portal, and AI chatbot. CRM v2 Refactoring includes removal of deprecated v1 embedded contacts and fixes for locationId linking.
- **Customer Portal Backend API:** Production-ready with phone-first SMS 2FA login, ServiceTitan API v2 as single source of truth, and modular route design. Self-service permissions allow customers to edit billing address, location names, and contact phone/email. Production security includes rate limiting, audit logging, standardized error responses, and session-based authentication with ownership validation. Business rules enforce a minimum of 1 contact and expose only MobilePhone/Email contact methods. API routes support updating accounts and locations, and CRUD operations for contacts. Public chatbot can create customers but update/delete operations require authentication.
- **Marketing Automation:** AI-powered personalized email campaigns using OpenAI GPT-4o with admin approval.
- **SMS Marketing System:** Integration with SimpleTexting API for contact/list management, campaign creation/scheduling, and messaging.
- **Reputation Management System:** Webhook-triggered review request automation. Mailgun forwards ServiceTitan invoice PDFs, triggering a webhook that creates job completion and review request records, then sends immediate email and SMS. A worker process sends follow-up emails. Idempotency is ensured via `mailgunMessageId` and existing `review_requests`.
- **Referral System:** Instant voucher generation with QR codes.
- **Email Preference Center:** Granular subscription management.
- **Production Infrastructure:** Automated schedulers, database transactions, idempotency, health monitoring, admin alerting, webhook signature verification.
- **Analytics & Third-Party Script Management:** Google Analytics 4, Meta Pixel, Google Tag Manager, Microsoft Clarity. Aggressive deferral for script loading, comprehensive conversion tracking, and cookie consent integration for privacy.

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