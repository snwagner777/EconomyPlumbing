# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence, streamline operations, and drive growth. It offers service information, covered areas, blog content, and an online store. The project integrates AI for content generation, marketing automation, and reputation management to boost local SEO, user engagement, and conversion rates, aiming to become a leading service provider through technology.

## User Preferences
Preferred communication style: Simple, everyday language.

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

**CRITICAL RULE: Dual-Session Bridge Architecture (Phased Migration)**
- The customer portal uses TWO session systems during migration:
  - **Legacy Session** (`customer_portal_session` cookie): Used by `/api/portal/*` routes
  - **Unified Session** (`plumbing_session` cookie): Used by `/api/customer-portal/*` routes
- **Dual-Write Pattern:** All authentication endpoints (verify-code, logout, switch-account) write to BOTH sessions via `destroyAllPortalSessions()` utility in `server/lib/customer-portal/session-utils.ts`
- **Migration Plan:** Gradually migrate all `/api/portal/*` routes to unified session, then remove legacy session and dual-write bridge.
- **Session Utility Location:** `server/lib/customer-portal/session-utils.ts` - Use this for all session destruction to maintain consistency.

## System Architecture

### Frontend
- **Framework & UI:** Next.js 15 App Router, React 18 with TypeScript, Radix UI, Shadcn UI, Tailwind CSS, CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation, and server-side dynamic phone tracking based on UTM parameters.
- **Key Pages:** Home, About, Contact, Services (15+ service pages), Service Areas (16+ city pages), Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot with conversation history, image upload support, and feedback collection.
- **Customer Portal:** Full-featured portal with ServiceTitan integration including phone/email 2FA, dual-session management, dashboard, appointments, memberships, vouchers, services, billing, settings, and self-service options.
- **Scheduler Architecture:** Full implementation at `src/components/scheduler/` with Service, Availability, Customer, and Review steps. Features smart availability, dynamic arrival windows, proximity scoring, and photo upload support.
- **Admin Panel (22 Sections):** Dashboard, AI & Marketing (AI Campaigns, AI Blog, Chatbot), Communications (Email Marketing, SMS Marketing, Reputation), Content (Blog, Photos, Success Stories, Products, Page Metadata), Customers (Customers, Commercial, Referrals, Contacts), Operations (ServiceTitan, Tracking Numbers), Settings.

### Backend
- **Framework & API:** Next.js 15 App Router (100+ API routes) and a `worker.ts` process for background jobs.
- **Data Layer:** Drizzle ORM for PostgreSQL (Neon-hosted) with over 60 tables managing core, content, customer, e-commerce, marketing, referral, review, communications, ServiceTitan sync, portal, and analytics data.
- **Security & Type Safety:** Session-based authentication (`iron-session`), rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, 100% type-safe TypeScript with Drizzle Zod schemas, and audit logging.
- **ServiceTitan Integration:** Modular API wrappers for various ServiceTitan modules, OAuth authentication, customer/contact management (v2 API), job/appointment tracking, estimate/invoice webhooks, membership management, and scheduler integration. Includes CRM v2 refactor for contact management and live membership data.
- **Customer Portal Backend API:** Routes for `/api/customer-portal/*` (unified session) and `/api/portal/*` (legacy session) handling authentication, appointments, jobs, memberships, contacts, and account management. Features phone-first SMS 2FA, dual-session bridge, and self-service permissions.
- **Marketing Automation:** AI-powered personalized email campaigns, custom campaign scheduler, review request automation, and referral nurture emails.
- **SMS Marketing System:** SimpleTexting API integration for contact/list management, campaign creation, and two-way messaging.
- **Reputation Management System:** Webhook-triggered review requests and multi-platform review tracking.
- **Referral System:** Modular form architecture, instant voucher generation, ServiceTitan customer lookup, hybrid data storage (PostgreSQL/ServiceTitan), and background processing for job completion and auto-crediting.
- **Email Preference Center:** Granular subscription management with token-based unsubscribe.
- **ServiceTitan Photo Fetch System:** Event-driven photo retrieval triggered by invoice webhooks. Fetches job photos from ServiceTitan API, analyzes quality (AI scoring ≥70), uploads high-quality photos to Google Drive, and stores metadata in database. Replaces Google Drive polling with async queue processing.
- **Background Worker Schedulers:** `server/worker.ts` handles automated tasks like auto blog generation, photo cleanup, ServiceTitan photo fetch queue processing, review request emails, referral nurture emails, custom campaign scheduling, and ServiceTitan zone synchronization.
- **Production Infrastructure:** Database transactions with idempotency, health monitoring, webhook signature verification, CRON job endpoints, and error tracking.
- **Analytics & Third-Party Script Management:** Integrates Google Analytics 4, Meta Pixel, Google Tag Manager, and Microsoft Clarity with aggressive script deferral and cookie consent.

## External Dependencies

- **ServiceTitan:** OAuth configured, full API integration (CRM, Jobs, Scheduler, Memberships, Estimates, Invoices, Photos/Attachments via Forms API)
- **Stripe:** Payment processing for e-commerce and memberships (webhooks configured)
- **OpenAI:** GPT-4o and GPT-4o-mini for chatbot, blog generation, email campaigns
- **SimpleTexting:** SMS marketing, two-way messaging, campaign management
- **Resend:** Transactional email delivery AND inbound email processing via Replit native connector
  - **Outbound:** Sending emails from `hello@mail.plumbersthatcare.com` (reply-to: `hello@plumbersthatcare.com`)
  - **Inbound:** Receiving emails at `mail.plumbersthatcare.com` domain via webhook at `/api/webhooks/resend/inbound`
  - **Webhook Format:** JSON payload with Svix signature verification, attachments as metadata only (must fetch via Resend Attachments API)
  - **Email Forwarding:** All incoming emails automatically forwarded to `ST-Alerts-828414d7c3d94e90@teamchat.zoom.us`
  - **Attachment Handling:** Webhook provides attachment IDs, must call `GET /emails/{email_id}/attachments/{attachment_id}` to download files
  - **Use Cases:** Receiving invoices/estimates (PDFs) and customer data exports (XLSX) from ServiceTitan
- **Clerk:** Authentication service
- **CompanyCam:** Photo management integration
- **Google Drive:** Photo import automation
- **SerpAPI:** Google review fetching
- **Ecwid:** E-commerce platform (Printful, Spocket integrations)
- **Google Analytics 4:** Website analytics
- **Meta Pixel:** Facebook/Instagram ad tracking
- **Google Tag Manager:** Tag management
- **Microsoft Clarity:** Session recording and heatmaps
- **Google Places API:** For location services (needs API key setup)
- **Google Maps:** For service area mapping (needs API key setup)
- **DataForSEO API:** For SEO data (optional, needs API key if required)
- **Meta Graph API:** For social media posting (needs OAuth if required)