# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application aimed at enhancing a plumbing business's online presence, streamlining operations, and fostering growth. It provides service information, covered areas, blog content, and an online store. The project integrates AI for content generation, marketing automation, and reputation management to boost local SEO, user engagement, and conversion rates. Key ambitions include becoming a leading service provider through technology, increasing customer lifetime value, and optimizing operational efficiency with intelligent automation.

## User Preferences
Preferred communication style: Simple, everyday language.

**CRITICAL RULE: Modular, Reusable API Architecture**

This is the foundational principle of our entire codebase. ALWAYS develop in modules.

**Why Modular Development:**
- One bug fix applies everywhere
- New features instantly available in all contexts
- Eliminates duplicate code and reduces maintenance burden
- Ensures consistency across user experiences
- Makes testing and debugging faster

**Architecture Pattern:**
1. **Core Business Logic:** Pure functions in `server/lib/servicetitan/` (or equivalent module directories)
   - NO authentication logic
   - NO route-specific concerns
   - ONLY business operations and data transformations

2. **API Routes (Context Wrappers):** Thin authentication/authorization layers in `app/api/[context]/`
   - Validate authentication
   - Extract user identity from auth context
   - Call core business logic functions
   - Handle errors and return responses

3. **React Hooks & Components:** Accept auth context as parameters
   - Never hardcode authentication assumptions
   - Accept tokens/sessions as hook parameters
   - Work in any context (portal, scheduler, chatbot)

**Implementation Checklist:**
Before writing ANY new feature:
- [ ] Does similar functionality already exist?
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
- If unsure about a field's existence, grep the codebase for actual usage before assuming
- Document any new API patterns discovered in this file for future reference

**CRITICAL RULE: Next.js Server-Side Rendering (SSR) - NEVER Break It**
- This is a Next.js 15 App Router project - ALL pages are server-rendered by default for SEO
- NEVER wrap server components in 'use client' providers - this defeats the entire purpose of Next.js
- NEVER create wrapper components that force entire pages to be client-side
- Red Flags - NEVER do this:
  - ❌ Creating a `<MarketingPageShell>` that wraps pages in a client provider
  - ❌ Creating a `<PhoneNumberProvider>` context that makes pages client-side
  - ❌ Wrapping server components in any 'use client' context providers
  - ❌ Making entire pages client-side just to pass props down
- Correct Pattern - ALWAYS follow this:
  - ✅ Server page (`page.tsx`) fetches data server-side (getPhoneNumbers, database queries, etc.)
  - ✅ Server page passes data as props to client component
  - ✅ Client component receives props and renders UI
  - ✅ Example: `app/(public)/page.tsx` (server) → fetches phone config → passes to `HomeClient.tsx` (client)
- Why This Matters:
  - SEO: Google crawlers need server-rendered HTML with phone numbers, content, metadata
  - Performance: Server-side data fetching is faster than client-side
  - UTM Tracking: Phone numbers are dynamically resolved based on URL params during SSR
  - Type Safety: Props are statically typed, contexts can be misused
- If you're tempted to create a provider/wrapper: STOP and ask "Can I pass this as a prop instead?"
- Exception: Only use 'use client' for interactive components that truly need client-side state (forms, modals, etc.)

## System Architecture

### Frontend
- **Framework & UI:** Next.js 15 App Router, React 18 with TypeScript, Radix UI, Shadcn UI, Tailwind CSS, CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation, and server-side dynamic phone tracking based on UTM parameters.
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and a Customer Portal with ServiceTitan integration supporting phone-based login.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panel:** Modular architecture with 21 routes, shared sidebar. Main sections: Overview, AI Marketing, Communications, Content, Customers, Site Configuration. Settings Page (`/admin/settings`) for Company Info, Marketing Settings, Feature Toggles, and Pricing Configuration.
- **Scheduler Architecture:** Full implementation at `src/components/scheduler/` with Service, Availability, Customer, and Review steps. Public access via `SchedulerBridge` modal. Customer Portal uses `SchedulerDialog`.
- **2FA Authentication:** Dual-mode phone/email verification with SMS OTP (SimpleTexting) and email codes (Resend), including rate limiting and error handling.
- **Session Management:** Secure server-side session tokens with HMAC-SHA256 signatures, 24-hour TTL, and customer ID resolution, persisted via `useSchedulerSession` hook.
- **Scheduler Contact Management:** Full CRUD operations via `app/api/scheduler/customer-contacts/route.ts` with authorization, audit logging, and rate limiting.

### Backend
- **Framework & API:** Next.js 15 App Router (API routes) and a `worker.ts` process for background jobs.
- **Data Layer:** Drizzle ORM for PostgreSQL.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers, Vouchers, Quote Follow-up Campaigns, Customer Data Imports.
- **Dynamic Phone Number Tracking:** Server-side UTM-based resolution during SSR, enhanced client-side with cookies/referrer.
- **Security & Type Safety:** Session-based authentication (`iron-session`) for admin, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, and 100% type-safe TypeScript.
- **ServiceTitan Integration:** Customer contact database tracking, custom scheduler with OAuth, CRM, Jobs, Settings services. Smart Scheduler Architecture uses parallel capacity requests, dynamic arrival windows, proximity scoring. Unified scheduler system across frontend, customer portal, and AI chatbot. CRM v2 Refactoring includes removal of deprecated v1 embedded contacts and fixes for locationId linking.
- **Customer Portal Backend API:** Production-ready with phone-first SMS 2FA login, ServiceTitan API v2 as single source of truth, modular route design. Self-service permissions allow customers to edit billing address, location names, and contact phone/email. Production security includes rate limiting, audit logging, standardized error responses, and session-based authentication.
- **Marketing Automation:** AI-powered personalized email campaigns using OpenAI GPT-4o with admin approval.
- **SMS Marketing System:** Integration with SimpleTexting API for contact/list management, campaign creation/scheduling, and messaging.
- **Reputation Management System:** Webhook-triggered review request automation via Mailgun.
- **Referral System:** Instant voucher generation with QR codes.
- **Email Preference Center:** Granular subscription management.
- **Production Infrastructure:** Automated schedulers, database transactions, idempotency, health monitoring, admin alerting, webhook signature verification.
- **Analytics & Third-Party Script Management:** Google Analytics 4, Meta Pixel, Google Tag Manager, Microsoft Clarity. Aggressive deferral for script loading and cookie consent integration.

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