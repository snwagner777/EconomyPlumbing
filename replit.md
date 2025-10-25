# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence. It provides service information, covered areas, blog content, and an Ecwid-powered online store. The project aims to improve local SEO, user engagement, and conversion rates. It features an AI-powered blog generation system, comprehensive SEO tools, an AI-powered marketing automation system for personalized email campaigns and attribution tracking, and a custom AI-powered reputation management system. The business vision is to expand market reach, improve customer engagement through an intuitive online platform, and leverage AI for content generation and SEO.

## User Preferences
Preferred communication style: Simple, everyday language.

## Development Principles
**CRITICAL RULE: Always check existing functionality before creating new pages/features**
- The Unified Admin Dashboard (`/admin`) is the single source of truth for all admin functionality
- NEVER create separate admin pages (e.g., `/admin/gmb-setup`) without first checking if the functionality already exists in the unified dashboard
- When adding admin features, ALWAYS integrate them into the existing unified admin panel
- Before implementing any new feature, search the codebase to verify it doesn't already exist
- Consolidation over separation: One unified interface is better than multiple scattered pages

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter, TanStack Query. UI uses Radix UI, Shadcn UI, Tailwind CSS, and CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation.
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and a Customer Portal with ServiceTitan integration.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panels:** Unified admin with Marketing Automation section (campaign-specific phone numbers, email templates, settings), ServiceTitan sync monitoring, Customer Portal analytics, photo/metadata management, Reputation Management, SMS Marketing, and centralized tracking phone number management.

### Backend
- **Framework & API:** Express.js with TypeScript, RESTful API.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers.
- **E-commerce:** Ecwid integration with Printful and Spocket.
- **AI Blog Generation System:** OpenAI GPT-4o for SEO-optimized and seasonally aware blog posts.
- **Dynamic Phone Number Tracking:** Database-driven system with automatic UTM parameter generation for marketing campaigns. Each email campaign type (review requests, referral nurture, quote follow-up) has its own dedicated tracking phone number. All email links include proper UTM parameters for attribution tracking. Phone numbers sync automatically to centralized tracking number management page.
- **Security & Type Safety:** OAuth-only admin authentication, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, 100% type-safe TypeScript, Stripe PaymentIntents.
- **ServiceTitan Integration:** XLSX-based customer data management for customer portal and marketing, replacing API-based sync. Includes automated imports, data safety measures, and specific fixes for search and login security.
- **Marketing Automation:** AI-powered system with three campaign types, each with dedicated tracking phone numbers and UTM parameters:
  - **Review Request Campaign:** 4 emails over 21 days with campaign-specific tracking phone number
  - **Referral Nurture Campaign:** 4 emails over 6 months with campaign-specific tracking phone number
  - **Quote Follow-up Campaign:** 4 emails over 21 days for $0 jobs with campaign-specific tracking phone number
  - Features: AI customer segmentation (GPT-4o), visual HTML preview/approval workflow, campaign-specific phone tracking, automatic UTM parameter generation for all email links
- **SMS Marketing System:** Complete platform with AI-powered campaign generation, behavioral intelligence, TCPA-compliant opt-in/opt-out, and multi-channel coordination.
- **Reputation Management System:** AI-powered review request automation with drip campaign engine (GPT-4o), preview/edit/approve interface for email sequences, and multi-channel requests.
- **Referral System:** Database-first referral management with ServiceTitan integration for pre-submission validation, hourly processing, job completion tracking, ServiceTitan notes integration, AI-generated referee welcome emails, and credit management.
- **Email Preference Center:** Granular subscription management for CAN-SPAM compliance, with token-based public UI and API endpoints for category-specific opt-outs and one-click unsubscribe.
- **Production-Hardening Infrastructure:** Automated schedulers, database transactions, idempotency protection, health monitoring, admin alerting, and webhook signature verification (Svix).

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
- **SMS Providers:** Twilio, Zoom Phone.
- **AI Services:** OpenAI (GPT-4o for blog generation, photo analysis, focal point detection; GPT-4o-mini for chatbot).
- **Photo Management:** CompanyCam, Google Drive, ServiceTitan.
- **Google Services:** Google Places API, Google Maps.
- **SEO Data:** DataForSEO API.
- **Social Media:** Meta Graph API.