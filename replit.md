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
- **Dynamic Phone Number Tracking:** 100% database-driven system.
- **Security & Type Safety:** OAuth-only admin authentication, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy. 100% type-safe TypeScript. Stripe PaymentIntents for payment security.
- **ServiceTitan Integration:** Incremental job sync system with staging tables, batch processing, error tracking, and a database-driven customer leaderboard. Includes multi-location service address management, self-service customer data updates, and a custom review system with admin moderation.
- **Marketing Automation:** AI-powered email marketing system with a comprehensive database schema, ServiceTitan data enrichment, email preference management, React Email + Resend templates, and a master email send switch.
- **SMS Marketing System (NEW - ServiceTitan Marketing Pro Replacement):** Complete SMS marketing platform with 5-table database schema (preferences, campaigns, messages, send log, keywords), AI-powered campaign generation (GPT-4o), TCPA-compliant opt-in/opt-out management, multi-channel coordination with email, behavioral intelligence, Twilio/Zoom Phone integration, 15+ API endpoints with authentication, public opt-in form at `/sms-signup`, and comprehensive 4-tab admin dashboard at `/admin/sms-marketing` (Dashboard, Campaigns, Subscribers, Settings). Master SMS switch defaults to OFF for safety.
- **Reputation Management System:** AI-powered review request automation with an 8-table database schema, GPT-4o drip campaign engine with behavioral branching, React Email templates, 12+ API routes, a dedicated master email switch, and a 5-tab admin interface for campaign management and AI response generation. Enhanced with multi-channel review requests (email + SMS) using intelligent channel selection based on customer engagement history.

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
- **Email Integration:** Resend.
- **SMS Providers:** Twilio (primary), Zoom Phone (OAuth-configured).
- **AI Services:** OpenAI (GPT-4o Vision for blog generation, photo analysis, success story focal point detection; GPT-4o-mini for chatbot).
- **Photo Management:** CompanyCam, Google Drive, ServiceTitan.
- **Google Services:** Google Places API, Google Maps.
- **SEO Data:** DataForSEO API.
- **Social Media:** Meta Graph API.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple`.
- **Image Processing:** Sharp library.