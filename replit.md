# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence, streamline operations, and drive growth. It offers service information, covered areas, blog content, and an online store. The project integrates AI for content generation, marketing automation, and reputation management to boost local SEO, user engagement, and conversion rates. The goal is to become a leading service provider through technology, increase customer lifetime value, and optimize operational efficiency with intelligent automation.

## User Preferences
Preferred communication style: Simple, everyday language.

**CRITICAL RULE: Modular, Reusable API Architecture**
- Develop in modules for bug fixes, new features, code reusability, consistency, and faster testing/debugging.
- **Architecture Pattern:** Core Business Logic (pure functions, no auth/route concerns), API Routes (thin authentication wrappers), React Hooks & Components (accept auth context as parameters).
- **Implementation Checklist:** Verify existing functionality, ensure reusability across portal/scheduler/chatbot, place business logic in reusable modules, make API routes thin wrappers, design for new context integration.
- **Red Flags - NEVER do this:** Duplicating ServiceTitan API calls, writing business logic in API handlers, hardcoding authentication in core modules, copy-pasting code, creating context-specific functionality.

**CRITICAL RULE: NEVER Auto-Generate or Hardcode Phone Numbers**
- Always ask the user for phone numbers.
- Never use placeholder or hardcoded phone numbers in production code.
- All displayed phone numbers must come from the `tracking_numbers` table, environment variables, or user input via the admin panel.
- Server-side fallbacks in `server/lib/phoneNumbers.ts` use environment variables; client components receive phone config via props.
- Test data and documentation may use (512) 555-XXXX format ONLY.

**CRITICAL RULE: Always check existing functionality before creating new pages/features**
- The Admin Panel uses a modular architecture with shared sidebar navigation (`src/components/admin-sidebar.tsx`).
- Before adding new admin features, check if a route already exists and add new routes to the `AdminSidebar` menu.
- Consolidate features: one implementation per feature, accessible via sidebar.

**CRITICAL RULE: Every new public page MUST have Header, Footer, and SEO optimization**
- All public-facing pages must render Header and Footer components.
- Header automatically receives phone numbers from `PhoneConfigProvider`.
- Every page must have proper SEO metadata (title, description, Open Graph tags) using `getPageMetadata()` or manual export.
- Server page fetches data and passes it to a client component that renders UI, including Header and Footer.

**CRITICAL RULE: ServiceTitan API Implementation - ALWAYS Verify Before Writing**
- Always check actual API wrapper code in `server/lib/servicetitan/` and endpoint implementation in `app/api/servicetitan/` before using ServiceTitan API.
- Verify exact fields available and ensure field names match ServiceTitan responses.
- Document any new API patterns.

**CRITICAL RULE: ServiceTitan Campaign ID Tracking**
- Campaign IDs are required for all ServiceTitan job creation.
- Campaign resolution flow: UTM source lookup in `tracking_numbers` table, fallback to "website" campaign, or throw an error.
- Admin Panel at `/admin/tracking-numbers` manages UTM source to Campaign ID mappings.
- Always validate `campaignId` before reaching the ServiceTitan API.

**CRITICAL RULE: Next.js Server-Side Rendering (SSR) - NEVER Break It**
- This is a Next.js 15 App Router project; all pages are server-rendered by default for SEO.
- **NEVER:** wrap server components in 'use client' providers, create wrappers that force pages client-side, or make entire pages client-side to pass props.
- **Correct Pattern:** Server page fetches data server-side and passes it as props to a client component for UI rendering.
- This ensures SEO, performance, UTM tracking, and type safety.
- Use 'use client' only for interactive components requiring client-side state.

## System Architecture

### Frontend
- **Framework & UI:** Next.js 15 App Router, React 18 with TypeScript, Radix UI, Shadcn UI, Tailwind CSS, CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation, and server-side dynamic phone tracking based on UTM parameters.
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and a Customer Portal with ServiceTitan integration supporting phone-based login.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panel:** Modular architecture with 21 routes, shared sidebar, including sections for Overview, AI Marketing, Communications, Content, Customers, Site Configuration, and a Settings Page.
- **Scheduler Architecture:** Full implementation at `src/components/scheduler/` with Service, Availability, Customer, and Review steps. Public access via `SchedulerBridge` modal; Customer Portal uses `SchedulerDialog`.
- **Authentication:** Dual-mode phone/email 2FA with SMS OTP (SimpleTexting) and email codes (Resend), including rate limiting and error handling.
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
- **Referral System:** Instant voucher generation with QR codes.
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

## Testing Checklists

### Contact Management Testing (Customer Portal)
**Status:** Completed implementation, pending user testing

**Implementation Details:**
- Full Edit/Delete functionality for location contacts via `ManageLocationContactsDialog`
- Support for ALL phone types (MobilePhone, HomePhone, WorkPhone, etc.) using `type.includes('Phone')`
- Validation against both customer-level AND location-level contacts
- Type conversion for ServiceTitan API (numeric customer IDs)
- Contact deduplication across multiple locations
- Minimum 1 contact business rule enforcement

**Setup & Access:**
- Log into Customer Portal at `/customer-portal`
- Navigate to a location with existing contacts
- Click "Manage Contacts" button on a location card
- Verify "Manage Location Contacts" dialog opens

**View Contacts (Basic Display):**
- Confirm all existing contacts are displayed
- Verify contact names, titles, phone numbers (formatted), and email addresses display correctly
- Verify icons show correctly (phone icon for phones, envelope for emails)

**Phone Type Support (CRITICAL - Fixed Bug):**
- Test contact with MobilePhone, HomePhone, WorkPhone - all should display and be editable
- Test contact with any other phone type variant

**Edit Contact Flow:**
- Click Edit button (pencil icon), verify dialog opens with pre-filled data
- Modify name/phone/email and save, verify success toast and UI refresh
- Test Cancel button
- Test editing all fields at once

**Delete Contact Flow:**
- Click Delete button (alert icon), verify confirmation dialog
- Test Cancel and Delete actions
- Verify success toast and contact removal from list

**Business Rules:**
- Try to delete the last contact - should see error "Cannot delete the last contact"
- Delete a contact when multiple exist - should succeed
- Add new contact, then delete it - should work

**Multi-Location Scenarios (CRITICAL - Fixed Bug):**
- Test editing a contact that appears on multiple locations
- Test deleting a contact linked to multiple locations
- Test editing a location-only contact (not at customer level)
- Test deleting a location-only contact

**Add New Contact (Existing Feature):**
- Add new contact with name, phone, and email
- Verify it appears and can be edited/deleted

**Loading States:**
- Verify "Updating..." and "Deleting..." text with spinners
- Verify buttons disabled during mutations
- Verify no duplicate submissions on rapid clicking

**Error Handling:**
- Test with poor network (if possible)
- Verify error toast on API failures
- Verify dialog recovery after errors

**Edge Cases:**
- Contact with name but no phone/email
- Contact with phone but no name
- Contact with email but no phone
- Multiple phone numbers or emails
- Very long contact names
- International phone numbers

**Most Critical Tests:**
1. Phone Type Support (HomePhone, WorkPhone, etc.)
2. Multi-Location Scenarios (contacts across multiple locations)
3. Location-Only Contacts (linked to location but not customer)