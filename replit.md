# Economy Plumbing Services

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance the online presence, streamline operations, and drive efficiency and scalability for plumbing businesses. It offers comprehensive service management, local SEO, content publishing, e-commerce integration, AI-powered content and marketing automation, and robust reputation management. The project aims to provide a significant competitive advantage in the plumbing industry through a modern, integrated digital platform.

## Recent Changes (November 23, 2025)
- **Image-Rich Document Viewers**: Estimates and invoices now display product/service images from ServiceTitan Pricebook API for professional visual customer experience
  - New `/api/pricebook/items` endpoint with batch fetching, deduplication, and 30-minute caching
  - `DocumentLineItem` component displays product thumbnails with loading states and error handling
  - `EstimateDetailModal` and `InvoiceDetailModal` fetch pricebook data on mount with visible error alerts
  - Image lightbox for viewing full-size product images (unique dialog IDs prevent focus conflicts)
  - Types updated: `InvoiceItem` and `EstimateItem` have `skuId` and typed `type` field for pricebook lookups
  - Clean architecture: modals manage their own pricebook state, no prop drilling
- **Customer Portal Migration Complete**: Removed all legacy AuthenticatedPortal code (169KB file deleted), USE_COMPACT_PORTAL feature flag removed
- **Massive CustomerPortalClient Cleanup**: Reduced from 1353 lines to ~200 lines by removing 60+ unused state variables and callback handlers
- **Clean Architecture**: CompactPortal now manages all internal dialogs (ContactManagementDialog, AddLocationDialog, AddAccountDialog, ReferralModal), CustomerPortalClient is minimal wrapper managing only SchedulerDialog
- **Type System Fixes**: Fixed PortalLocationDetails interface (contacts → contactMethods), proper ServiceTitanCustomer → CustomerInfo mapping for scheduler
- **Dead Code Removal**: Removed legacy appointments fallback, unused callback props (onRescheduleAppointment, onCancelAppointment, onViewEstimate, onAcceptEstimate, onEditContacts, onAddLocation, onEditLocation, onShareReferral)
- **Verified Working**: Customer portal loads successfully (HTTP 200), no LSP errors, metadata properly server-rendered

## User Preferences
- CRITICAL RULE: Single Module Pattern - DRY (Don't Repeat Yourself)
- CRITICAL RULE: Modular, Reusable API Architecture
- CRITICAL RULE: NEVER Auto-Generate or Hardcode Phone Numbers
- CRITICAL RULE: Always check existing functionality before creating new components/pages/features
- CRITICAL RULE: Every new public page MUST have Header, Footer, and SEO optimization
- CRITICAL RULE: ServiceTitan API Implementation - ALWAYS Verify Before Writing
- CRITICAL RULE: ServiceTitan Campaign ID Tracking
- CRITICAL RULE: Next.js Server-Side Rendering (SSR) - NEVER Break It
- CRITICAL RULE: ServiceTitan API Testing Protocol
- CRITICAL RULE: Automated Testing with Playwright
- CRITICAL RULE: Resend Email Integration - ALWAYS Use Replit Native Connector
- CRITICAL RULE: Google Drive Integration - ALWAYS Use Replit Native Connector
- CRITICAL RULE: Database Lazy Initialization (Production Fix)
- CRITICAL RULE: Phone Number Architecture - UTM-Driven Tracking System
- CRITICAL RULE: Business Metadata - Static for SEO Performance
- CRITICAL RULE: Scheduler Address Validation - NO DEFAULTS
- CRITICAL RULE: Hardcoded Values - Centralized Sources Only
- CRITICAL RULE: Customer Portal API - Single Source of Truth

## System Architecture

### Frontend
- **Framework & UI:** Next.js 15 App Router, React 18, TypeScript, Radix UI, Shadcn UI, Tailwind CSS, CVA. Features a blue/teal color scheme, Inter/Poppins typography, light/dark modes, and WCAG AA Compliance.
- **SEO & Performance:** Implements `SEOHead`, JSON-LD, 301 redirects, lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap, and server-side dynamic phone tracking.
- **Key Features:** Marketing pages, Ecwid Store integration, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and an OpenAI GPT-4o-mini powered chatbot.
- **Customer Portal:** A secure, ServiceTitan-integrated portal with 2FA, appointment management, memberships, vouchers, service history with image-rich estimate/invoice viewers, billing, and a 4-step scheduler with SMS verification.
- **Admin Panel:** A comprehensive dashboard for managing AI & Marketing, Communications, Content, Customers, Operations, and Settings.

### Backend
- **Framework & API:** Next.js 15 App Router with API routes and `worker.ts` for background processing.
- **Data Layer:** Drizzle ORM for PostgreSQL (Neon-hosted).
- **Security & Type Safety:** Session-based authentication (`iron-session`), rate limiting, secure cookies, CSRF/SSRF protection, CSP, HSTS, 100% type-safe TypeScript with Drizzle Zod schemas, and audit logging.
- **ServiceTitan Integration:** Modular API wrappers for CRM, Jobs, Scheduler, Memberships, Estimates, Invoices (v2 API), Pricebook (with image fetching), OAuth, customer/contact management, job/appointment tracking, estimate/invoice webhooks, and membership management.
- **Automation:** AI-powered personalized email campaigns, custom campaign scheduler, review request automation, referral nurture emails, and SMS marketing.
- **Reputation Management System:** Utilizes webhook-triggered review requests and multi-platform review tracking.
- **Referral System:** Modular form architecture, instant voucher generation, ServiceTitan customer lookup, hybrid data storage, and background processing.
- **Email Preference Center:** Offers granular subscription management with token-based unsubscribe.
- **ServiceTitan Photo Fetch System:** Event-driven system for photo retrieval, AI quality analysis, Google Drive upload, and metadata storage.
- **Background Worker Schedulers:** Manages automated tasks such as blog generation, photo cleanup, ServiceTitan photo fetch queue, review requests, referral nurturing, custom campaigns, ServiceTitan zone synchronization, and SEO audit processing.
- **SEO Audit System:** Conducts local performance and SEO testing using Lighthouse, site-audit-seo, and seo-analyzer.
- **Production Infrastructure:** Features database transactions with idempotency, health monitoring, webhook signature verification, CRON job endpoints, and error tracking.

## External Dependencies
- ServiceTitan: CRM, Jobs, Scheduler, Memberships, Estimates, Invoices APIs
- Stripe: Payment processing
- OpenAI: GPT-4o and GPT-4o-mini
- SimpleTexting: SMS marketing
- Resend: Email delivery
- Late API: Social media scheduling
- Google Drive: Photo storage
- SerpAPI: Google review fetching
- Ecwid: E-commerce platform
- Google Analytics 4 (GA4): Website analytics
- Meta Pixel: Ad tracking
- Google Tag Manager (GTM): Tag management
- Google Places API: Location services
- Google Maps: Mapping