# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application for a plumbing business in Austin and Marble Falls, Texas. It provides service information, covered areas, and blog content. A key feature is an online store for maintenance memberships. The project aims to enhance local SEO, boost user engagement, and improve conversion rates. The system also includes an AI-powered blog generation system and comprehensive SEO features for optimal performance and visibility.

## User Preferences
Preferred communication style: Simple, everyday language.

## Critical SEO & Development Rules

### 1. URL Change Policy (MANDATORY)
**⚠️ RULE: Any time a page URL is changed, we MUST create a 301 redirect from the old URL to the new URL.**

- Prevents 404 errors for users with bookmarks
- Preserves SEO rankings and link equity
- Maintains traffic from external links
- **How:** Add to `redirects` object in `server/index.ts` (line ~46)
- **Test:** Check server logs for "301 Redirect: /old → /new"
- **Monitor:** Use 404 monitoring system to identify missing redirects

### 2. SEO Best Practices for All Pages (MANDATORY)
**⚠️ RULE: Every page and blog post must follow ALL SEO best practices.**

#### Meta Data Optimization - REQUIRED
ALL pages must have optimized title tags and meta descriptions:

**Title Tags (50-60 characters):**
- Include primary keyword + location
- Format: `[Service/Topic] | [Location] | Economy Plumbing`
- Prioritize water heater content when relevant
- **Examples:**
  - ✅ "Water Heater Repair Austin & Marble Falls | Economy Plumbing" (58 chars)
  - ✅ "Austin Water Heater Installation | Economy Plumbing" (52 chars)
  - ❌ "Water Heater Services" (22 chars - too short)
  - ❌ "Professional Water Heater Repair, Installation, and Maintenance Services in Austin and Marble Falls, Texas" (108 chars - too long)

**Meta Descriptions (150-160 characters):**
- Include location (Austin/Marble Falls) in first 100 characters
- Emphasize water heaters when applicable
- Include call-to-action
- **Examples:**
  - ✅ "Austin & Marble Falls water heater repair, installation & replacement. 24/7 emergency service. Expert plumbers. Call (512) 368-9159 for same-day service." (157 chars)
  - ✅ "Economy Plumbing serves Austin and Marble Falls with professional water heater services. Licensed, insured plumbers. Free estimates. Call today!" (148 chars)
  - ❌ "We fix water heaters" (21 chars - too short, no location)
  - ❌ "Professional water heater repair and installation services available throughout the greater Austin metropolitan area including Marble Falls and surrounding communities with 24/7 emergency service available" (207 chars - too long)

**Location Keywords Priority:**
1. Austin (primary market)
2. Marble Falls (secondary market)
3. Specific neighborhoods when relevant

**Water Heater Emphasis:**
- Water heater pages: Prioritize in title and first 50 chars of description
- Other service pages: Include "water heater" if space permits
- Blog posts: Emphasize water heaters in 40% of posts (balanced with other services)
- Service area pages: Mention water heaters in description

**Implementation:**
```tsx
<SEOHead
  title="Water Heater Repair Austin TX | Economy Plumbing Services"  // 58 chars
  description="Expert water heater repair in Austin & Marble Falls. Same-day service, licensed plumbers, all brands. Call (512) 368-9159 for fast repairs." // 151 chars
  canonical="https://www.plumbersthatcare.com/water-heater-repair"
/>
```

#### Schema Markup (JSON-LD) - REQUIRED
All pages must include appropriate structured data:
- **Service Pages:** `Service` schema with provider, areaServed, offers
- **Blog Posts:** `BlogPosting` schema with author, datePublished, image
- **Service Areas:** `LocalBusiness` with address, geo, areaServed
- **Products:** `Product` schema with offers, price, availability
- **Implementation:** Use `SEOHead` component with schema prop

#### Image Optimization - REQUIRED
ALL images must include:
- **Alt text:** Descriptive, keyword-rich (not stuffed)
- **Dimensions:** width/height attributes (prevents CLS)
- **Loading strategy:**
  - Hero images: `fetchpriority="high"` + `loading="eager"`
  - Below-fold: `loading="lazy"`
- **Decoding:** `decoding="async"` on all images
- **Format:** WebP at 85% quality

#### Breadcrumbs - IF APPLICABLE
Include when page has hierarchy:
- Visual navigation AND BreadcrumbList schema
- Examples: Service pages, Service areas, Blog posts
- **Currently:** Not implemented, add when creating new templates

#### Page Speed - REQUIRED
Every page must meet:
- WebP images with proper dimensions
- Lazy loading below-fold content
- Deferred third-party scripts (GA, ServiceTitan)
- Preload critical fonts (Inter woff2)
- DNS prefetch for external domains
- **Target:** 100/100 PageSpeed Insights

#### Accessibility (WCAG AA) - REQUIRED
All pages must be accessible:
- **Color contrast:** 4.5:1 text, 3:1 large text
- **Semantic HTML:** Proper heading hierarchy (single h1, logical h2/h3)
- **ARIA labels:** All interactive elements accessible
- **Keyboard nav:** Full keyboard accessibility, visible focus
- **Images:** Alt text on all (empty alt="" for decorative)
- **Forms:** Labels, error messages, required field indicators

#### Checklist for New Pages:
- [ ] **Title tag:** 50-60 chars, includes location (Austin/Marble Falls), water heater emphasis if relevant
- [ ] **Meta description:** 150-160 chars, location in first 100 chars, water heater emphasis, call-to-action
- [ ] SEOHead with title, description, canonical, schema
- [ ] All images: alt, width/height, loading strategy
- [ ] Breadcrumbs (visual + schema) if applicable
- [ ] Page speed optimized (WebP, lazy load, async)
- [ ] WCAG AA compliant (contrast, semantic, ARIA)
- [ ] Single h1, proper h2/h3 hierarchy
- [ ] Test with PageSpeed Insights (target 100/100)
- [ ] Test with WAVE accessibility tool

#### Reference Examples:
- Service Pages: `client/src/components/ServicePage.tsx`
- SEO Component: `client/src/components/SEOHead.tsx`
- Blog Posts: Auto-generated with proper optimization
- Service Areas: `client/src/pages/ServiceAreaTemplate.tsx`

## System Architecture

### Frontend
- **Framework & UI:** React 18 with TypeScript, Vite, Wouter for routing, and TanStack Query for server state. UI is built with Radix UI, Shadcn UI, Tailwind CSS, and Class Variance Authority (CVA).
- **Design System:** Features a primary blue and secondary teal color scheme, charcoal text, and silver accents, with Inter and Poppins typography. Supports light/dark modes, aiming for a professional aesthetic.
- **SEO & Performance:** Centralized `SEOHead` component for meta tags, OpenGraph, Twitter Cards, canonical URLs, and extensive JSON-LD schema. Includes performance optimizations like resource preconnect, image lazy loading, font optimization, client-side code splitting, and universal WebP image conversion. Dynamic sitemap with auto-updates.
- **Client-Side Routes:** Covers Home, About, Contact, 20+ Service pages, 16 Service Area pages, Blog (with RSS feed), Store, FAQ, Privacy Policy, Refund/Returns, and VIP Membership benefits.
- **Accessibility:** WCAG AA Compliant with focus on contrast ratios, `aria-label` usage, and dynamic Open Graph image construction.
- **Reviews Integration:** Premium visual design for testimonials, strategically placed, auto-categorized by service type, lazy-loaded, and cached.
- **PageSpeed Optimization:** Implements image optimization (width/height attributes, fetchpriority="high", loading="lazy", decoding="async"), resource hints (DNS prefetch, preconnect, font preload), deferred third-party scripts (Google Analytics, ServiceTitan scheduler), and optimized CSS delivery for Core Web Vitals.

### Backend
- **Framework & API:** Express.js with TypeScript, providing RESTful API endpoints.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews.
- **Google Reviews Integration:** Bulk import via DataForSEO API; ongoing updates via Google Places API with deduplication, quality filtering (4+ star), and auto-categorization into 11 service types. Supports multi-source reviews.
- **Performance Optimizations:** Gzip/brotli compression, aggressive API caching with Cache-Control headers, 1-year immutable cache for static assets, and strategic database indexing.
- **AI Blog Generation System:** Uses OpenAI GPT-4o to analyze unused photos and generate SEO-optimized blog posts with smart topic suggestions. Features automated weekly blog creation, future-dated scheduling, and seasonal awareness.
- **404 Error Monitoring:** Automated tracking of 404 errors in the database with immediate email alerts via Resend.
- **Domain Redirect Middleware:** Automatically redirects all traffic from `.replit.app` to `www.plumbersthatcare.com` using a 301 permanent redirect for SEO.

### State Management
- **Client-Side:** TanStack Query for server state; React hooks for local component state.
- **Form Handling:** React Hook Form with Zod validation.

### Analytics & Third-Party Script Management
- Google Analytics 4 integration with deferred loading.
- ServiceTitan Scheduler loads on-demand.

## External Dependencies

- **Payment Processing:** Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`).
- **Database:** Neon (PostgreSQL) via `@neondatabase/serverless` with Drizzle ORM.
- **Online Scheduler:** ServiceTitan for appointment scheduling.
- **Email Integration:** Resend for transactional emails and 404 alerts.
- **Social Media:** Facebook, Instagram, Yelp, Nextdoor.
- **Call Tracking:** Dynamic phone number insertion based on traffic source.
- **UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, class-variance-authority, clsx.
- **Session Management:** `connect-pg-simple` for PostgreSQL session store.
- **Google APIs:** Google Places API for review updates, DataForSEO API for historical review import.
- **AI-Powered Photo Quality System:** OpenAI Vision (GPT-4o) for analyzing job photos for quality, categorization, and filtering.
- **WebP Conversion:** Sharp library for universal WebP conversion of photos from CompanyCam and Google Drive imports.
- **Multi-Source Photo Import:** CompanyCam via Zapier webhook, Google Drive (bulk import), and ServiceTitan.
- **Before/After Photo Composer:** AI (GPT-4o vision) for detecting before/after photo pairs and generating Polaroid-style composite images as WebP with AI-generated captions.
- **Social Media Auto-Posting:** Meta Graph API for automated weekly posting of best before/after composites to Facebook/Instagram.
- **ServiceTitan Integration:** Automated sync of online membership purchases to ServiceTitan CRM, including customer creation, invoice generation, and payment processing, handled via secure Stripe webhooks and background sync jobs.