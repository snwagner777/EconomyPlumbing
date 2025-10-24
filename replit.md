# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence. It provides service information, covered areas, blog content, and an Ecwid-powered online store for memberships and products. The project aims to improve local SEO, user engagement, and conversion rates, featuring an AI-powered blog generation system and comprehensive SEO tools. The business vision is to expand market reach, improve customer engagement through an intuitive online platform, and leverage AI for content generation and SEO. It also includes an AI-powered marketing automation system to replace ServiceTitan Marketing Pro, focusing on personalized email campaigns and robust attribution tracking, and a custom AI-powered reputation management system to replace NiceJob.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter, and TanStack Query. UI is built using Radix UI, Shadcn UI, Tailwind CSS, and CVA.
- **Design System:** Primary blue and secondary teal color scheme, Inter and Poppins typography, supporting light/dark modes.
- **SEO & Performance:** Centralized `SEOHead` component, JSON-LD structured data, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, and dynamic sitemap generation. WCAG AA Compliant.
- **Key Pages:** Comprehensive set of pages including Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, various policy pages, VIP Membership, interactive calculators (Water Heater Size, Plumbing Cost Estimator), seasonal landing pages, commercial industry pages, and a Customer Portal with ServiceTitan integration.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panels:** Unified admin panel for ServiceTitan sync monitoring, Customer Portal analytics, photo and metadata management, a comprehensive Reputation Management admin at `/admin/reviews`, and SMS Marketing admin at `/admin/sms-marketing` with AI-powered campaign management, subscriber tracking, and TCPA compliance monitoring.

### Backend
- **Framework & API:** Express.js with TypeScript, providing RESTful API endpoints.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers.
- **E-commerce:** Ecwid platform integrated with Printful and Spocket.
- **AI Blog Generation System:** OpenAI GPT-4o for SEO-optimized, automated, and seasonally aware blog posts.
- **Dynamic Phone Number Tracking:** 100% database-driven system with automatic UTM parameter generation for marketing campaigns. When phone numbers are entered in email/SMS campaigns, the system automatically creates tracking number entries with campaign-specific UTM parameters (utm_source, utm_medium, utm_campaign) and detection rules.
- **Security & Type Safety:** OAuth-only admin authentication, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy. 100% type-safe TypeScript. Stripe PaymentIntents for payment security.
- **ServiceTitan Integration:** 
  - **XLSX-Based Customer Data Management (Oct 2024):** Complete migration from broken ServiceTitan API pagination to XLSX-based customer imports. System architecture:
    - **Primary Tables:** `customers_xlsx` and `contacts_xlsx` serve all customer data to application (Customer Portal, referrals, search, memberships, marketing automation)
    - **Automated Imports:** Mailgun webhook (`/api/webhooks/mailgun/customer-data`) processes hourly XLSX email attachments with HMAC signature verification (5-minute replay window)
    - **Data Safety:** Atomic transactions with staging tables (`ON COMMIT DROP`), automatic rollback on error, parameterized queries preventing SQL injection
    - **Legacy Tables:** `service_titan_customers` and `service_titan_contacts` remain in database but are **no longer queried by application** - the uncontrollable ServiceTitan API sync continues writing to these abandoned tables
    - **Technical Details:** Supports 11,443+ customers, batch processing (500 records/batch), proper PostgreSQL array handling, numeric zero preservation (no NULL conversion bug), comma-separated contact value search (handles XLSX multi-value fields), proper Excel serial date conversion
    - **Date Handling (Oct 24, 2024):** Excel serial dates properly converted using formula `(excelSerial - 25569) * 86400 * 1000`. Empty "Last Job Completed" cells default to Jan 1, 2012. Applied to both `xlsxCustomerImporter.ts` (webhook) and `importCustomersFromXLSX.ts` (manual script)
    - **Customer Portal Search Fix (Oct 24, 2024):** Fixed `searchLocalCustomer()` and `searchAllMatchingCustomers()` to handle comma-separated email/phone values in `contacts_xlsx.normalized_value` using SQL LIKE pattern matching alongside exact matches - resolves "account not found" errors for valid customers
    - **Customer Hall of Fame Filter (Oct 24, 2024):** `/api/customers/leaderboard` endpoint filters to only show customers with service in last 6 years, excluding inactive customers from Success Stories page
    - **Integration Points:** All features updated to use XLSX tables: `serviceTitan.ts`, `routes.ts`, `storage.ts`, `referralProcessor.ts`, membership purchasing, customer portal authentication
  - **Legacy Features (Deprecated):** Incremental job sync system with staging tables, batch processing, error tracking. Multi-location service address management and self-service customer data updates now read from XLSX tables.
- **Marketing Automation (Enhanced Dec 2024):** Complete AI-powered marketing automation system replacing ServiceTitan Marketing Pro ($3,240/year):
  - **AI Customer Segmentation (`/admin/customer-segments`):** GPT-4o analyzes ServiceTitan data to identify marketing opportunities, creates targeted segments with revenue potential, full approval workflow for AI-generated content, inline editing of AI reasoning, performance tracking (revenue, jobs booked, ROI).
  - **Automated Remarketing Engine:** Scans unsold estimates daily, creates targeted follow-up campaigns with multiple strategies (discount, urgency, value, trust, seasonal), multi-channel sequences (email + SMS), automatic conversion tracking.
  - **Unified Marketing Dashboard (`/admin/marketing-dashboard`):** Central command center showing all campaigns across channels, real-time metrics and ROI tracking, automation rules management, quick actions for common tasks, comprehensive overview of marketing performance.
  - **AI Campaign Generator:** Creates personalized email/SMS/newsletter content for each segment, multiple messaging strategies, seasonal awareness, phone number tracking integration.
  - **Email Campaign Admin (`/admin/email-campaigns`):** Visual HTML preview/approval workflow for AI-generated campaigns, manual email blast functionality with customer segmentation, comprehensive template library with CRUD operations, categories, and usage tracking. Features 3-tab preview (Visual/HTML/Plain Text) with inline editing before approval.
  - **Safety & Compliance:** Master switches for email/SMS, phone number requirement gates campaigns, full approval required for all AI content, TCPA compliance for SMS, comprehensive audit logging.
- **SMS Marketing System (ServiceTitan Marketing Pro Replacement):** Complete SMS marketing platform with:
  - **Infrastructure:** 5-table database schema (preferences, campaigns, messages, send log, keywords)
  - **AI Features:** GPT-4o campaign generation, behavioral intelligence for targeting
  - **Compliance:** TCPA-compliant opt-in/opt-out management, public opt-in form at `/sms-signup`
  - **SMS Opt-In Widgets:** Deployed on homepage (inline variant) and customer portal (card variant with elevated styling)
  - **Integration:** Multi-channel coordination with email, Twilio/Zoom Phone integration
  - **Admin Dashboard (`/admin/sms-marketing`):** 4-tab interface (Dashboard, Campaigns, Subscribers, Settings), 15+ API endpoints with OAuth authentication, Master SMS switch defaults to OFF for safety.
- **Reputation Management System (NiceJob Replacement):** AI-powered review request automation with:
  - **Infrastructure:** 8-table database schema, GPT-4o drip campaign engine with behavioral branching
  - **Drip Email Workflow:** Preview/edit/approve interface for entire email sequences, navigation between emails with Previous/Next buttons, ability to approve individual emails or entire campaigns
  - **Admin Interface (`/admin/reviews`):** 5-tab interface for campaign management and AI response generation, visual preview of drip emails with subject lines and messaging tactics
  - **Multi-Channel:** Email + SMS review requests with intelligent channel selection based on customer engagement history
  - **Integration:** React Email templates, 12+ API routes, dedicated master email switch for safety.
- **Production-Hardening Infrastructure (COMPLETE):** Comprehensive production-ready infrastructure including automated schedulers (segment refresh every 12h, webhook retry processor with exponential backoff, count reconciliation, health alerter), database transactions for all critical operations, idempotency protection for campaign sends, health monitoring with system_health_checks table tracking all services, admin alerting via email with retry logic, and webhook signature verification using Svix. All 16 production-hardening features fully implemented and code-reviewed. Services confirmed operational: segment_refresh and webhook_retry_processor both running healthy with 0 consecutive failures. Note: Comprehensive e2e testing blocked by OAuth authentication requirement (mandatory security constraint).

### State Management
- **Client-Side:** TanStack Query for server state; React hooks for local component state.
- **Form Handling:** React Hook Form with Zod validation.

### Analytics & Third-Party Script Management
- **Tracking:** Google Analytics 4, Meta Pixel, Google Tag Manager, Microsoft Clarity.
- **Optimization:** Aggressive deferral for script loading.
- **Conversion Tracking:** Comprehensive tracking for forms, phone clicks, scheduler opens, and memberships.
- **Privacy:** Cookie consent integration.

### Development Standards
- **Rendering:** Client-Side Rendering (CSR) with server-side metadata injection.
- **URL Normalization:** 301 redirects for trailing-slash URLs.
- **Security:** `/src/*` files blocked with 403 Forbidden.

## External Dependencies

- **E-commerce Platform:** Ecwid (Stripe for payments), Printful, Spocket.
- **Database:** Neon (PostgreSQL) via `@neondatabase/serverless` with Drizzle ORM.
- **Online Scheduler:** ServiceTitan.
- **Email Integration:** Resend (transactional), Mailgun (webhook-based XLSX imports).
- **SMS Providers:** Twilio (primary), Zoom Phone (OAuth-configured).
- **AI Services:** OpenAI (GPT-4o Vision for blog generation, photo analysis, success story focal point detection; GPT-4o-mini for chatbot).
- **Photo Management:** CompanyCam, Google Drive, ServiceTitan.
- **Google Services:** Google Places API, Google Maps.
- **SEO Data:** DataForSEO API.
- **Social Media:** Meta Graph API.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple`.
- **Image Processing:** Sharp library.