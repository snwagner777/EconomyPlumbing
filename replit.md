# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence. It offers service information, covered areas, blog content, and an online store. The project integrates AI for content generation, marketing automation, and reputation management to boost local SEO, user engagement, and conversion rates, ultimately expanding market reach and customer engagement.

## Recent Changes (November 6, 2025)
- **XLSX Import Verification**: Debugged and verified customer import process works correctly
  - ✅ Added comprehensive logging to track data flow through import pipeline
  - ✅ Confirmed phone numbers correctly flow from XLSX → parsing → batch insert → database
  - ✅ Manual import successfully imported 13,021 customers with all contact data intact
  - ✅ Documented `service_titan_contacts` table as deprecated (Oct 23 sync, never maintained)
- **Unified Customer Database**: Migrated ALL customer creation/lookup to `customers_xlsx` table (XLSX import source of truth)
  - ✅ Chatbot, Contact Form, Scheduler, Portal Login now use unified `customers_xlsx` table
  - ✅ ServiceTitan API creates write immediately to `customers_xlsx` for instant portal/scheduler access
  - ✅ PostgreSQL phone search using `regexp_replace('[^0-9]', '', 'g')` for proper normalization
  - ✅ All new customers created via API sync to `customers_xlsx` with ServiceTitan ID
- **Smart Appointment Display**: "We'll be working nearby" only shows when efficiency score > 50 (keeps "Most Efficient" badge)
- **Estimate Acceptance Workflow**: Complete estimate approval system with ServiceTitan API integration, admin/customer email notifications, security validation
- **Enhanced Estimate Filtering**: Excludes sold (soldOn not null), dismissed (dismissedOn not null), and old estimates (>30 days)
- **Phone Number Configuration**: Dynamic configuration from phoneConfig prop and environment variables
- **Security Improvements**: Estimate ownership validation, proper iron-session across all portal API routes
- **Technician Rating System**: 5-star rating interface with flow into review requests or feedback collection
- **Contact Management UI**: Full CRUD for customer contacts and location contacts

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

**Custom Appointment Scheduler - Conversational Design**
- Features truly conversational customer creation wizard (NewCustomerWizard.tsx) - one question at a time, not form-like
- Question flow: First name → Last name → Customer type (Residential/Commercial buttons) → Phone → Email → Billing address (street/unit/city/state/zip) → Service location same? (Yes/No buttons) → (if different) Location details
- NO visible form labels - questions are conversational ("What's your first name?" not "First Name:")
- Smart auto-advance between steps with Enter key support
- Optional fields (unit numbers) can be skipped with "Skip" button
- Supports separate billing address vs service location addresses
- Creates customer immediately in ServiceTitan when wizard completes (atomic operation)
- ServiceTitan V2 API requirement: customers MUST include `locations` array (every customer needs at least one location)
- Force create flag: "Create New Customer" button creates new record even if phone/email matches existing customer
- All data syncs to local database immediately (`customers_xlsx` table - single source of truth)

**Estimate Acceptance Workflow**
- Customer portal displays open estimates (unsold, not dismissed, created within last 30 days)
- Automatic filtering excludes: sold estimates (soldOn not null), dismissed estimates (dismissedOn not null), estimates older than 30 days
- "Accept Estimate" button in estimate detail modal launches confirmation dialog
- Confirmation dialog shows estimate details, terms/conditions checkbox, and "What Happens Next" steps
- Security: API validates estimate belongs to authenticated customer before allowing acceptance
- On acceptance: marks estimate as sold in ServiceTitan via PATCH API, sends notification emails to admin and customer
- Admin email includes estimate details, customer info, and direct link to ServiceTitan estimate
- Customer email confirms acceptance and sets expectation for scheduling callback within 1 business day
- Accepted estimates immediately removed from customer's open estimates list via cache invalidation

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
- **Framework & UI:** Next.js 15 App Router, React 18 with TypeScript, Vite, Wouter, TanStack Query. UI uses Radix UI, Shadcn UI, Tailwind CSS, and CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation, and server-side dynamic phone tracking based on UTM parameters for crawlers.
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and a Customer Portal with ServiceTitan integration.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panels:** Unified admin dashboard for Marketing Automation, ServiceTitan sync monitoring, Customer Portal analytics, photo/metadata management, Reputation Management, SMS Marketing, and centralized tracking phone number management.

### Backend
- **Framework & API:** Next.js 15 App Router (API routes) and a separate `worker.ts` process for background jobs.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers, Vouchers.
- **Dynamic Phone Number Tracking:** Server-side resolution of tracking numbers based on UTMs during SSR, enhanced client-side with cookies/referrer. Database-driven rules for campaign-specific numbers.
- **Security & Type Safety:** Session-based authentication using `iron-session` for `/admin` routes, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, 100% type-safe TypeScript.
- **ServiceTitan Integration:** XLSX-based customer data management for customer portal and marketing, replacing API-based sync. The `customers_xlsx` table (populated by hourly Mailgun XLSX imports) is the single source of truth for all customer data. Also features a custom ServiceTitan scheduler with OAuth authentication, CRM, Jobs, and Settings services, supporting `utm_source` campaign tracking and real job types.
  - **DEPRECATED TABLE:** `service_titan_contacts` - Old API sync from October 23, 2025. Never updated, never maintained. NEVER reference this table in any code. All customer lookups must use `customers_xlsx` table exclusively.
- **Marketing Automation:** AI-powered system with email engagement tracking for Review Request, Referral Nurture, and Quote Follow-up campaigns. Includes AI customer segmentation, HTML preview/approval, campaign-specific phone tracking, and automatic UTM parameter generation.
- **SMS Marketing System:** AI-powered campaign generation, behavioral intelligence, TCPA-compliant opt-in/opt-out.
- **Reputation Management System:** AI-powered review request automation with drip campaign engine, preview/edit/approve interface for email sequences. Automated review fetching.
- **Referral System (QR Voucher-Based):** Instant voucher generation with QR codes replacing complex ServiceTitan job scanning. $25 vouchers for both referee and referrer, $200 minimum job requirement, 6-month expiration. Tech-scannable QR codes in emails and customer portal. Vouchers auto-create reward for referrer when referee's voucher is redeemed. Database-first with AI-generated emails and engagement tracking.
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
- **Photo Management:** CompanyCam, Google Drive.
- **Google Services:** Google Places API, Google Maps.
- **SEO Data:** DataForSEO API.
- **Social Media:** Meta Graph API.
- **Review Fetching:** SerpAPI.