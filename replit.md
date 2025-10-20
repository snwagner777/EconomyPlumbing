# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance the online presence of a plumbing business. It provides service information, covered areas, and blog content, alongside an Ecwid-powered online store for maintenance memberships and drop-shipped products. The project aims to improve local SEO, user engagement, and conversion rates, featuring an AI-powered blog generation system and comprehensive SEO tools for optimal visibility and performance. The business vision is to expand market reach, improve customer engagement through an intuitive online platform, and leverage AI for content generation and SEO. The project is also building an AI-powered marketing automation system to replace ServiceTitan Marketing Pro, focusing on hyper-personalized email campaigns and robust attribution tracking.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI is built using Radix UI, Shadcn UI, Tailwind CSS, and Class Variance Authority (CVA).
- **Design System:** Primary blue and secondary teal color scheme, charcoal text, silver accents, Inter and Poppins typography. Supports light/dark modes.
- **SEO & Performance:** Centralized `SEOHead` component for meta tags, OpenGraph, Twitter Cards, and auto-generated canonical URLs. JSON-LD structured data with `@id` references, blog `wordCount`, and `serviceAreaServed`. Includes 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, and dynamic sitemap generation.
- **Accessibility:** WCAG AA Compliant.
- **Key Pages:** Home, About, Contact, Service pages, Service Area pages, Blog (with RSS feed), Ecwid Store, FAQ, Privacy Policy, Refund/Returns, VIP Membership, Water Heater Size Calculator, Plumbing Cost Estimator, Seasonal Landing Pages, Commercial Industry Pages, Refer-a-Friend, Customer Portal (ServiceTitan integration), and conversion-optimized SEO landing pages.
- **Interactive Tools:** Water Heater Size Calculator for lead generation.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot for plumbing questions, pricing estimates, and human handoff.
- **Admin Panels:** Unified admin panel for ServiceTitan sync monitoring, Customer Portal analytics, photo management, metadata management, success stories, and products. Includes a ServiceTitan dashboard with real-time sync status and manual sync trigger.

### Backend
- **Framework & API:** Express.js with TypeScript, providing RESTful API endpoints.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers.
- **E-commerce:** Ecwid platform handles product management, checkout, payment, and inventory, integrated with Printful and Spocket.
- **AI Blog Generation System:** OpenAI GPT-4o for SEO-optimized blog posts, smart topic suggestions, automated weekly creation, and seasonal awareness.
- **Dynamic Phone Number Tracking:** 100% database-driven system via admin panel, zero hardcoded numbers.
- **Security & Type Safety:** OAuth-only admin authentication, rate limiting, httpOnly/secure session cookies, sameSite CSRF protection, SSRF protection, comprehensive CSP headers, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy. 100% type-safe TypeScript. Stripe PaymentIntents for payment security.
- **ServiceTitan Integration:** Incremental job sync system using `modifiedOnOrAfter` watermark, staging tables for deduplication, batch processing, and error tracking. Database-driven customer leaderboard. Admin job sync trigger. Multi-location service address management and self-service customer data updates synchronized with ServiceTitan APIs. Custom review system with admin moderation. Estimate expiration alerts and filtering in Customer Portal.
- **Marketing Automation (Future Roadmap - In Progress):** AI-powered email marketing system to replace ServiceTitan Marketing Pro. Features include a comprehensive database schema for customer segments, campaigns, and email logs; ServiceTitan data enrichment (forms API, extended job sync); email preference management; beautiful email templates using React Email + Resend with dynamic merge tags; and a master email send switch for safety.

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
- **Content:** Curated content for crawlers.

## External Dependencies

- **E-commerce Platform:** Ecwid (Stripe for payments), Printful, Spocket.
- **Database:** Neon (PostgreSQL) via `@neondatabase/serverless` with Drizzle ORM.
- **Online Scheduler:** ServiceTitan.
- **Email Integration:** Resend.
- **SMS Integration:** Twilio (pending approval), NiceJob (reviews/testimonials).
- **AI Services:** OpenAI (GPT-4o Vision for blog generation, photo analysis, success story focal point detection, GPT-4o-mini for chatbot).
- **Photo Management:** CompanyCam, Google Drive, ServiceTitan.
- **Google Services:** Google Places API, Google Maps.
- **SEO Data:** DataForSEO API.
- **Social Media:** Meta Graph API.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple`.
- **Image Processing:** Sharp library.
## AI-Powered Marketing Automation Roadmap

### Vision
Replace ServiceTitan Marketing Pro ($200-500/month) with a superior custom AI-powered email marketing automation system (~$30/month) that analyzes customer data to create hyper-personalized, revenue-driving campaigns with perfect attribution tracking.

### Phase 1: Foundation Infrastructure (IN PROGRESS)
**Goal:** Core email marketing infrastructure with safety controls (emails disabled by default)

**Database Schema (11 Tables):**
- customer_segments: AI-generated customer groups
- segment_membership: Customer tracking with entry/exit
- email_campaigns: Campaign definitions (evergreen + one-time)
- campaign_emails: Drip sequence emails
- email_send_log: Complete send history
- email_preferences: Granular unsubscribe categories
- email_suppression_list: Hard bounces, spam complaints
- review_link_clicks: Review remarketing tracking
- service_titan_job_forms: Technician notes for AI
- audience_movement_logs: Audit trail
- marketing_system_settings: Configuration

**ServiceTitan Data Enrichment:**
- Forms API: Technician notes ("water heater 12 years old - recommend replacement")
- Extended Jobs Sync: job_type, service_category, equipment_installed, customer_satisfaction
- Customer Enhancement: last_service_date, last_service_type, lifetime_value, customer_tags

**MASTER EMAIL SEND SWITCH:** Default OFF - no emails until manually enabled

### Phase 2: ServiceTitan Marketing Integration
**Campaign Creation API:** Auto-create campaigns in ServiceTitan
**Phone Tracking Workflow:** Admin creates FREE tracking numbers → campaign-level attribution
**Call Attribution:** Customer calls → ServiceTitan links → job → revenue tracking

### Phase 3: AI Customer Segmentation
**Daily Analysis Engine (GPT-4o):**
- Unsold Estimates (47 customers)
- Win-Back: 12+ Months Since Service (234 customers)
- High-Value VIP (89 customers, >$5K lifetime)
- Technician Noted Concerns (156 customers)
- Anniversary Reminders (67 customers)

**Segment Types:** Evergreen (run forever) vs One-time (seasonal/limited)

### Phase 4: AI Content Generation
**Hyper-Personalized Emails:** "Hi Sarah, still thinking about that $3,500 tankless water heater? Winter's here - don't risk a freeze! Your tech noted your current unit is 14 years old."

**AI Learning:** Tracks open/click/conversion rates, A/B tests subject lines, optimizes messaging

**Discount Approval:** AI suggests offers → admin approves/modifies before launch

### Phase 5: Smart Audience Management
**Auto-Entry:** New estimate → add to segment
**Auto-Exit:** Job booked → remove from "Unsold Estimates"
**Full Audit Trail:** Every segment move logged with reason and timestamp

### Phase 6: Review Click Tracking & Remarketing
**Track Every Click:** Google/Facebook/Yelp review button clicks
**Automated Remarketing:** Day 3: "We noticed you started leaving a review..."
**Conversion Matching:** Cross-reference clicks with actual reviews submitted

### Phase 7: Admin Control Center
**Active Segments:** Live counts, performance metrics
**Pending Campaigns:** AI-generated campaigns awaiting phone numbers
**Safety Controls:** Master switch, test mode, daily limits, deliverability monitoring
**Analytics Dashboard:** Opens, clicks, calls, jobs, revenue, ROI

### Phase 8: Campaign Execution Workflow
**Nightly AI Process:**
1. Analyze customer data
2. Identify 2-3 campaign opportunities
3. Generate email content
4. Auto-create in ServiceTitan
5. Set status: AWAITING_PHONE_NUMBER

**Morning Admin Workflow:**
1. Review campaign previews
2. Create FREE tracking number (2 min)
3. Click "Approve & Launch"

**Ongoing:** Evergreen campaigns auto-refresh weekly, AI learns and improves

### Cost Savings Analysis
**ServiceTitan Marketing Pro:** ~$300/month
**Custom Solution:**
- Resend (50k emails): $20/month
- OpenAI API: ~$10/month
- ServiceTitan tracking numbers: FREE
**Total: ~$30/month | Annual Savings: $3,240/year**

### Implementation Status
🏗️ Phase 1-8: IN PROGRESS - Building complete infrastructure with MASTER SEND SWITCH OFF. System fully functional for testing, zero emails send until enabled.
