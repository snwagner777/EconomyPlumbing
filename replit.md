# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence, manage operations, and drive growth. It provides service information, covered areas, blog content, and an online store. The project integrates AI for content generation, marketing automation, and reputation management to boost local SEO, user engagement, and conversion rates, ultimately expanding market reach and customer engagement. Key ambitions include becoming a leading service provider by leveraging technology, increasing customer lifetime value through personalized engagement, and optimizing operational efficiency with intelligent automation.

## User Preferences
Preferred communication style: Simple, everyday language.

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

### SSR Priority Guidelines - Which Pages MUST Be Server-Rendered:

**HIGH PRIORITY (Critical for SEO) - MUST be Server Components:**
- ✅ All public-facing content pages (services, areas, blog posts, about, contact)
- ✅ Landing pages with UTM tracking (schedule-appointment, referral offers)
- ✅ Payment success/confirmation pages (for proper analytics tracking)
- ✅ All pages that appear in sitemap.xml
- ✅ Pages with structured data (JSON-LD schemas)
- ✅ Dynamic routes with SEO value ([slug] pages for blog, services, areas)

**MEDIUM PRIORITY (Good for performance) - Should be Server Components:**
- ⚠️ Public forms with minimal client interaction
- ⚠️ Static informational pages
- ⚠️ Pages with server-fetched data that doesn't update frequently

**LOW PRIORITY (Can remain Client Components) - CSR Acceptable:**
- ❌ Admin dashboards (not public, not SEO-critical)
- ❌ Authenticated portals (customer portal, behind login)
- ❌ Real-time interactive tools (calculators with constant state updates)
- ❌ Internal-only pages (unsubscribe, email preferences with tokens)

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
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and a Customer Portal with ServiceTitan integration. Customer Portal supports phone-based login with automatic email selection UI when multiple emails are found.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panels:** Unified admin dashboard for Marketing Automation, ServiceTitan sync monitoring, Customer Portal analytics, photo/metadata management, Reputation Management, SMS Marketing, and centralized tracking phone number management.

### Backend
- **Framework & API:** Next.js 15 App Router (API routes) and a separate `worker.ts` process for background jobs.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers, Vouchers, Quote Follow-up Campaigns, Customer Data Imports.
- **Dynamic Phone Number Tracking:** Server-side resolution of tracking numbers based on UTMs during SSR, enhanced client-side with cookies/referrer. Database-driven rules for campaign-specific numbers.
- **Security & Type Safety:** Session-based authentication using `iron-session` for `/admin` routes, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, 100% type-safe TypeScript.
- **ServiceTitan Integration:**
  - **Customer Contact Database (`customers_xlsx`):** Tracks customer phone numbers and email addresses to match them to ServiceTitan customer IDs for fast API lookups without repeatedly querying ServiceTitan. Also enables remarketing campaigns via email and SMS. Primary data source is hourly Mailgun XLSX imports. Bi-directional sync ensures instant portal/scheduler access for new customers created via ServiceTitan API.
  - **DEPRECATED TABLE:** `service_titan_contacts` - Never reference this table in any code. All customer lookups must use `customers_xlsx` table exclusively.
  - **API Services:** Custom ServiceTitan scheduler with OAuth authentication, CRM, Jobs, and Settings services, supporting `utm_source` campaign tracking and real job types.
  - **Scheduler Availability (CRITICAL):** Uses ServiceTitan Capacity API (`dispatch/v2/tenant/{tenant}/capacity`) as source of truth for availability. This correctly accounts for:
    - Regular job appointments
    - Non-job appointments (lunch breaks, meetings, PTO, etc.)
    - Technician availability and skills matching
    - Business unit capacity constraints
    - Returns `isAvailable` boolean and `openAvailability` hours for each time slot
    - Replaced manual appointment overlap checking which caused false positives (e.g., Monday 8-12 showing available when fully booked)
  - **DEPRECATED:** Old `checkAvailability()` method and manual slot generation functions - all replaced by Capacity API integration
- **Marketing Automation:** AI-powered system with email engagement tracking for Review Request, Referral Nurture, and Quote Follow-up campaigns. Includes AI customer segmentation, HTML preview/approval, campaign-specific phone tracking, and automatic UTM parameter generation. Campaign triggers: Review requests auto-created from invoice PDFs (4 emails over 21 days), Quote follow-ups auto-created from estimate PDFs (3 emails over 14 days), both check for existing campaigns to prevent duplicates.
- **SMS Marketing System:** AI-powered campaign generation, behavioral intelligence, TCPA-compliant opt-in/opt-out.
- **Reputation Management System:** AI-powered review request automation with drip campaign engine, preview/edit/approve interface for email sequences. Automated review fetching.
- **Referral System (QR Voucher-Based):** Instant voucher generation with QR codes. $25 vouchers for both referee and referrer, $200 minimum job requirement, 6-month expiration. Tech-scannable QR codes. Vouchers auto-create reward for referrer when referee's voucher is redeemed. Referral page includes Header/Footer navigation and requires both phone numbers AND email addresses for referrer and friend.
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
- **AI Services:** OpenAI (GPT-4o, GPT-4o-mini).
- **Photo Management:** CompanyCam, Google Drive.
- **Google Services:** Google Places API, Google Maps.
- **SEO Data:** DataForSEO API.
- **Social Media:** Meta Graph API.
- **Review Fetching:** SerpAPI.