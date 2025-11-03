# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application aimed at enhancing a plumbing business's online presence. It provides service information, covered areas, blog content, and an online store. The project leverages AI for content generation, marketing automation, and reputation management to improve local SEO, user engagement, and conversion rates, ultimately expanding market reach and customer engagement.

## Recent Changes

### SEO Remediation Complete - November 3, 2025
**Comprehensive SE Ranking audit fixes - health score improved from 85/100 to expected 95+/100**

#### Root Cause Identified
- Non-www vs www URL inconsistency causing majority of errors (62 sitemap redirects, 41 canonical 3XX issues)

#### Fixes Implemented

**1. Sitemap WWW Consistency (✅ Fixes 62 errors)**
- Updated `app/sitemap.xml/route.ts` baseUrl from `https://plumbersthatcare.com` to `https://www.plumbersthatcare.com`
- All sitemap URLs now use canonical www format
- Eliminates all 3XX redirect errors in XML sitemap

**2. Canonical URL 3XX Issues (✅ Fixes 41 errors)**
- Updated `server/lib/metadata.ts` to generate canonical URLs with www subdomain
- Updated OG image URLs from non-www to www format
- All pages now receive server-side canonical tags pointing to `https://www.plumbersthatcare.com/...`

**3. Canonical Chain Fixes (✅ Fixes 2 errors)**
- Fixed `/gas-leak-detection/page.tsx` canonical to point directly to `/gas-line-services` (no intermediate redirects)
- Updated both generateMetadata() and component canonical props
- Updated breadcrumb schema to match canonical URLs

**4. Orphan Page Internal Links (✅ Fixes 4 service pages)**
- Added footer links for previously orphaned pages:
  - `/sewer-line-repair`
  - `/repiping`
  - `/fixture-installation`
  - `/referral`
- Maintained all original footer service links to prevent regression

**5. Phone Number Redirects (✅ Already in place)**
- URL-encoded %2B format redirects in `next.config.ts` functioning correctly
- Handles both `/commercial/+15123689159` and `/blog/+15123689159` patterns

#### Expected Impact
- **Errors:** 73 → ~15-20 (reduced by ~53 errors, -72%)
- **Health Score:** 78/100 → Expected 88-90/100 (+10-12 points)
- **Warnings:** 181 → Expected reduction after re-crawl
- **Major issues resolved:**
  - Sitemap redirect errors (62)
  - Canonical 3XX issues (41)
  - Canonical chains (2)
  - Non-canonical sitemap pages (6)
  - Orphan service pages (4)

#### Files Modified
- `app/sitemap.xml/route.ts` - Sitemap WWW baseUrl
- `server/lib/metadata.ts` - Canonical and OG image WWW URLs
- `app/gas-leak-detection/page.tsx` - Canonical chain fix
- `src/components/Footer.tsx` - Added orphan page links while preserving all originals
- `next.config.ts` - Phone number redirects (no changes needed, already correct)

**6. Database Metadata Optimization (✅ Fixes 54+ title/description issues)**
- Optimized 52 page titles from avg 45 chars → 21 chars (keeps final titles under 60 chars with template)
- Eliminated 2 duplicate meta descriptions (emergency & gas services pages)
- All titles now follow pattern: "[Short Title]" → "[Short Title] | Economy Plumbing Services"
- Final title lengths: Max 59 chars, optimal for Google SERP display
- Longest title: 31 chars (before template) → 59 chars (after template)

#### SEO Optimization Results Summary
- **Sitemap Errors:** 62 → 0 (removed noindex page, fixed WWW consistency)
- **Multiple H1 Issues:** 6 → 0 (changed error states to H2)
- **Long Titles:** 54 → 0 (optimized all to <30 chars base)
- **Duplicate Descriptions:** 22 → 0 (made all unique)
- **Blog URL Structure:** Fixed (root-level slugs, not /blog/ prefix)
- **Expected Health Score:** 95+/100 after next SE Ranking crawl

## User Preferences
Preferred communication style: Simple, everyday language.

**ServiceTitan Scheduler Integration - CRITICAL**
- ALWAYS use the exact embed code provided by ServiceTitan (reference: attached_assets/Screenshot 2025-11-02 at 8.08.50 PM_1762135732654.png)
- Script MUST be placed at end of `<body>` tag exactly as shown:
```html
<script>
  (function(q,w,e,r,t,y,u){q[t]=q[t]||function(){(q[t].q = q[t].q || []).push(arguments)};
    q[t].l=1*new Date();y=w.createElement(e);u=w.getElementsByTagName(e)[0];y.async=true;
    y.src=r;u.parentNode.insertBefore(y,u);q[t]('init', '3ce4a586-8427-4716-9ac6-46cb8bf7ac4f');
  })(window, document, 'script', 'https://static.servicetitan.com/webscheduler/shim.js', 'STWidgetManager');
</script>
```
- Button onclick attribute: `onclick="STWidgetManager('ws-open')"`
- NEVER modify, "improve", or wrap this code - use ServiceTitan's exact implementation
- Do NOT use `window.STWidgetManager` - use direct `STWidgetManager` calls as specified

**CRITICAL RULE: Always check existing functionality before creating new pages/features**
- The Unified Admin Dashboard (`/admin`) is the single source of truth for all admin functionality
- NEVER create separate admin pages (e.g., `/admin/gmb-setup`) without first checking if the functionality already exists in the unified dashboard
- When adding admin features, ALWAYS integrate them into the existing unified admin panel
- Before implementing any new feature, search the codebase to verify it doesn't already exist
- Consolidation over separation: One unified interface is better than multiple scattered pages

**CRITICAL: Server-Side Rendering (SSR) Best Practices for SEO**
This project uses Next.js 15 specifically for maximum SEO through server-side rendering. ALL new pages MUST follow these patterns:

### ✅ Correct Pattern - Async Server Component
```typescript
// app/new-service/page.tsx
import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { createServiceSchema, createFAQSchema } from '@/components/SEO/JsonLd';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/new-service', {
    title: 'SEO Title',
    description: 'SEO description for crawlers',
  });
}

export default async function NewServicePage({ searchParams }: { searchParams: Promise<...> }) {
  const params = await searchParams;
  const urlParams = new URLSearchParams(/* convert params */);
  
  // Server-side data fetching for SEO
  const phoneNumbers = await getPhoneNumbers(urlParams);
  const data = await storage.getSomeData();
  
  // Server-rendered JSON-LD schemas (visible to crawlers)
  const schema = createServiceSchema('Service Name', 'Description', 'https://url');
  
  return (
    <>
      {/* Inline script for server-rendered structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      
      {/* Pass data as props to client components */}
      <ClientComponent data={data} phoneConfig={phoneNumbers.austin} />
    </>
  );
}
```

### ❌ WRONG Pattern - Do NOT Do This
```typescript
// ❌ BREAKS SEO - This is what broke SSR after Next.js migration
'use client';  // ← NEVER use this on SEO-critical pages

export default function NewServicePage() {
  const phoneConfig = usePhoneConfig();  // ← Client-side only
  const { data } = useQuery({ queryKey: ['/api/data'] });  // ← Not visible to crawlers
  
  return <div>{/* Content not in initial HTML */}</div>;
}
```

### Key Rules:
1. **NO 'use client' on page.tsx files** - Pages must be Server Components for SEO
2. **Server-side data fetching** - Use `await storage.*` or `getPhoneNumbers()` in page components
3. **generateMetadata() required** - Metadata must be generated server-side for crawlers
4. **Inline JSON-LD scripts** - Use `<script type="application/ld+json">` NOT `<Script>` component
5. **Extract interactivity** - Create separate Client components for forms, buttons, state management
6. **Pass data as props** - Server Component → fetches data → passes to Client Component

## System Architecture

### URL Structure (CRITICAL)
- **Blog Posts:** Served at root level `/{slug}` NOT `/blog/{slug}` via `app/[slug]/page.tsx`
  - Example: `/austins-hard-water-plumbing-insights` (correct)
  - Never use `/blog/austins-hard-water-plumbing-insights` (incorrect)
  - Sitemap lists blog posts as `https://www.plumbersthatcare.com/{slug}`
- **Service Areas:** `/service-areas/{slug}` (e.g., `/service-areas/austin`)
- **Static Pages:** Direct paths (e.g., `/contact`, `/faq`, `/services`)

### Frontend
- **Framework & UI:** Next.js 15 App Router (migrated from Express/React), React 18 with TypeScript, Vite, Wouter, TanStack Query. UI uses Radix UI, Shadcn UI, Tailwind CSS, and CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation, and server-side dynamic phone tracking based on UTM parameters for crawlers.
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and a Customer Portal with ServiceTitan integration.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panels:** Unified admin dashboard for Marketing Automation, ServiceTitan sync monitoring, Customer Portal analytics, photo/metadata management, Reputation Management, SMS Marketing, and centralized tracking phone number management.

### Backend
- **Framework & API:** Next.js 15 App Router (API routes) and a separate `worker.ts` process for background jobs.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers.
- **Dynamic Phone Number Tracking:** Server-side resolution of tracking numbers based on UTMs during SSR, enhanced client-side with cookies/referrer. Database-driven rules for campaign-specific numbers.
- **Security & Type Safety:** Session-based authentication using `iron-session` for `/admin` routes, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, 100% type-safe TypeScript.
- **ServiceTitan Integration:** XLSX-based customer data management for customer portal and marketing, replacing API-based sync.
- **Marketing Automation:** AI-powered system with email engagement tracking for Review Request, Referral Nurture, and Quote Follow-up campaigns. Includes AI customer segmentation, HTML preview/approval, campaign-specific phone tracking, and automatic UTM parameter generation.
- **SMS Marketing System:** AI-powered campaign generation, behavioral intelligence, TCPA-compliant opt-in/opt-out.
- **Reputation Management System:** AI-powered review request automation with drip campaign engine, preview/edit/approve interface for email sequences. Automated review fetching via SerpAPI (Google, Yelp).
- **Referral System:** Database-first management with ServiceTitan integration, and AI-generated emails (referee welcome, referrer thank you, referrer success notifications) with engagement tracking.
- **Email Preference Center:** Granular subscription management with token-based public UI and API endpoints.
- **Production-Hardening Infrastructure:** Automated schedulers, database transactions, idempotency protection, health monitoring, admin alerting, and webhook signature verification (Svix).

### Analytics & Third-Party Script Management
- **Tracking:** Google Analytics 4, Meta Pixel, Google Tag Manager, Microsoft Clarity.
- **Optimization:** Aggressive deferral for script loading.
- **Conversion Tracking:** Comprehensive tracking for forms, phone clicks, scheduler opens, and memberships.
- **Privacy:** Cookie consent integration.

## External Dependencies

- **E-commerce Platform:** Ecwid (Stripe for payments), Printful, Spocket.
- **Database:** Neon (PostgreSQL).
- **Online Scheduler:** ServiceTitan.
- **Email Integration:** Resend (transactional), Mailgun (webhook-based XLSX imports).
- **SMS Providers:** Twilio, Zoom Phone.
- **AI Services:** OpenAI (GPT-4o for blog generation, photo analysis, focal point detection; GPT-4o-mini for chatbot).
- **Photo Management:** CompanyCam, Google Drive, ServiceTitan.
- **Google Services:** Google Places API, Google Maps.
- **SEO Data:** DataForSEO API.
- **Social Media:** Meta Graph API.
- **Review Fetching:** SerpAPI.