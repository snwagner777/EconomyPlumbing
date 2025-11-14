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

## System Architecture

### Frontend
- **Framework & UI:** Next.js 15 App Router, React 18 with TypeScript, Radix UI, Shadcn UI, Tailwind CSS, CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation, and server-side dynamic phone tracking based on UTM parameters.
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and a Customer Portal with ServiceTitan integration supporting phone-based login.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panel:** Modular architecture with 21 routes, shared sidebar, including sections for Overview, AI Marketing, Communications, Content, Customers, Site Configuration, and a Settings Page.
- **Scheduler Architecture:** Full implementation at `src/components/scheduler/` with Service, Availability, Customer, and Review steps. Public access via `SchedulerBridge` modal; Customer Portal uses `SchedulerDialog`.
- **Authentication:** Dual-mode phone/email 2FA with SMS OTP and email codes, including rate limiting and error handling.
- **Session Management:** Secure server-side session tokens with HMAC-SHA256, 24-hour TTL, and customer ID resolution, persisted via `useSchedulerSession` hook.
- **Scheduler Contact Management:** Full CRUD operations via `app/api/scheduler/customer-contacts/route.ts` with authorization, audit logging, and rate limiting.

### Backend
- **Framework & API:** Next.js 15 App Router (API routes) and a `worker.ts` process for background jobs.
- **Data Layer:** Drizzle ORM for PostgreSQL.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers, Vouchers, Quote Follow-up Campaigns, Customer Data Imports.
- **Dynamic Phone Number Tracking:** Server-side UTM-based resolution during SSR, enhanced client-side with cookies/referrer.
- **Security & Type Safety:** Session-based authentication (`iron-session`) for admin, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, and 100% type-safe TypeScript.
- **ServiceTitan Integration:** Modular API wrappers in `server/lib/servicetitan/` for memberships, forms, jobs, CRM, and settings. Features include customer contact database tracking, custom scheduler with OAuth, smart scheduler architecture (parallel capacity requests, dynamic arrival windows, proximity scoring), and a unified scheduler system. CRM v2 refactoring removed deprecated v1 embedded contacts and fixed locationId linking. Customer Portal Memberships UI fetches live data via dedicated API endpoint.
- **Customer Portal Backend API:** Production-ready with phone-first SMS 2FA login, ServiceTitan API v2 as single source of truth, and modular route design. Self-service permissions for customers to edit billing address, location names, and contact info. Includes rate limiting, audit logging, and session-based authentication.
- **Marketing Automation:** AI-powered personalized email campaigns using OpenAI GPT-4o with admin approval.
- **SMS Marketing System:** Integration with SimpleTexting API for contact/list management, campaign creation/scheduling, and messaging.
- **Reputation Management System:** Webhook-triggered review request automation via Mailgun.
- **Referral System:** Modular form architecture (`useReferralForm` + `ReferralFormView` + context wrappers), instant voucher generation with QR codes, ServiceTitan customer lookup for existing referees, inline portal form with pre-fill.
- **Email Preference Center:** Granular subscription management.
- **Production Infrastructure:** Automated schedulers, database transactions, idempotency, health monitoring, admin alerting, webhook signature verification.
- **Analytics & Third-Party Script Management:** Google Analytics 4, Meta Pixel, Google Tag Manager, Microsoft Clarity, with aggressive deferral and cookie consent integration.

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