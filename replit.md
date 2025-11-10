# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence, manage operations, and drive growth. It provides service information, covered areas, blog content, and an online store. The project integrates AI for content generation, marketing automation, and reputation management to boost local SEO, user engagement, and conversion rates, ultimately expanding market reach and customer engagement. Key ambitions include becoming a leading service provider by leveraging technology, increasing customer lifetime value through personalized engagement, and optimizing operational efficiency with intelligent automation.

## User Preferences
Preferred communication style: Simple, everyday language.

**Owner Contact Information:**
- Personal phone number: 512-755-5037 (for testing SMS, OTP, and other features)

**CRITICAL RULE: NEVER Auto-Generate or Hardcode Phone Numbers**
- **If you need a phone number, ASK the user for it**
- Never use placeholder phone numbers in production code
- Never hardcode phone numbers (e.g., (512) 877-8234, (512) 368-9159, etc.)
- Fallback/default phones in server code MUST be real business numbers provided by user via environment variables
- All phone numbers displayed to users must come from:
  1. Database tracking_numbers table (preferred - allows dynamic tracking)
  2. Environment variables (NEXT_PUBLIC_DEFAULT_AUSTIN_PHONE, NEXT_PUBLIC_DEFAULT_MARBLE_FALLS_PHONE)
  3. User input via admin panel
- Server-side ultimate fallbacks: `server/lib/phoneNumbers.ts` uses environment variables, logs errors if not set
- Client components: Should receive phone config from server via props; use "Loading..." fallback if not provided
- Exception: Test data and documentation can use (512) 555-XXXX format ONLY

**CRITICAL RULE: Always check existing functionality before creating new pages/features**
- The Admin Panel uses a modular architecture with shared sidebar navigation (`src/components/admin-sidebar.tsx`)
- Main dashboard at `/admin` shows DashboardOverviewClient (metrics, stats, system health)
- Specialized sections have dedicated routes: `/admin/photos`, `/admin/email-marketing`, `/admin/sms`, etc.
- NEVER create duplicate admin pages without first checking AdminSidebar to see if route already exists
- When adding new admin features, add route to AdminSidebar menu sections
- Before implementing any new feature, search the codebase to verify it doesn't already exist
- Consolidation over duplication: One implementation per feature, accessible via sidebar navigation

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

### Frontend
- **Framework & UI:** Next.js 15 App Router, React 18 with TypeScript, Radix UI, Shadcn UI, Tailwind CSS, CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation, and server-side dynamic phone tracking based on UTM parameters for crawlers.
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and a Customer Portal with ServiceTitan integration. Customer Portal supports phone-based login with automatic email selection UI when multiple emails are found.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panel (21 Routes):** Modular architecture with shared sidebar navigation (`src/components/admin-sidebar.tsx`). All pages wrapped in `app/admin/layout.tsx` with AdminSidebar. Main sections include Overview, AI Marketing, Communications, Content, Customers, and Site Configuration. Features consolidated tabbed interfaces for Email Marketing (includes Custom Campaigns tab) and Reputation (includes GMB Reviews and Profiles tabs). GMB Setup accessible via sidebar for Google OAuth connection setup.
- **URL Structure:** Blog Posts at root level `/{slug}`, Service Areas at `/service-areas/{slug}`, Static Pages at direct paths (e.g., `/contact`).

### Backend
- **Framework & API:** Next.js 15 App Router (API routes) and a separate `worker.ts` process for background jobs.
- **Data Layer:** Drizzle ORM for PostgreSQL.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers, Vouchers, Quote Follow-up Campaigns, Customer Data Imports.
- **Dynamic Phone Number Tracking:** Server-side resolution of tracking numbers based on UTMs during SSR, enhanced client-side with cookies/referrer. Database-driven rules for campaign-specific numbers.
- **Security & Type Safety:** Session-based authentication using `iron-session` for `/admin` routes, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, 100% type-safe TypeScript.
- **ServiceTitan Integration:**
  - **Customer Contact Database (`customers_xlsx`):** Tracks customer phone numbers and email addresses to match them to ServiceTitan customer IDs for fast API lookups.
  - **API Services:** Custom ServiceTitan scheduler with OAuth, CRM, Jobs, and Settings services, supporting `utm_source` tracking and real job types.
  - **Smart Scheduler Architecture:** Utilizes parallel capacity requests, dynamic arrival windows, 2-hour appointment slot generation, smart proximity scoring, and Hill Country filtering. Includes 5-minute response caching.
  - **Arrival Windows vs Booking Times:** Customers select 4-hour arrival windows, while the system internally books optimal 2-hour appointments.
  - **Unified Scheduler System:** The smart scheduler (`/api/scheduler/smart-availability`) is used across frontend scheduler, customer portal reschedule flow, and AI chatbot booking.
- **Marketing Automation:** AI-powered personalized email campaigns using OpenAI GPT-4o, with admin approval for templates.
- **SMS Marketing System:** Integration with SimpleTexting API for contact/list management, campaign creation/scheduling, and messaging.
- **Reputation Management System:** AI-powered review request automation.
- **Referral System:** Instant voucher generation with QR codes for discounts.
- **Email Preference Center:** Granular subscription management.
- **Production-Hardening Infrastructure:** Automated schedulers, database transactions, idempotency protection, health monitoring, admin alerting, and webhook signature verification.

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
- **SMS Providers:** SimpleTexting, Twilio, Zoom Phone.
- **AI Services:** OpenAI (GPT-4o, GPT-4o-mini).
- **Photo Management:** CompanyCam, Google Drive.
- **Google Services:** Google Places API, Google Maps.
- **SEO Data:** DataForSEO API.
- **Social Media:** Meta Graph API.
- **Review Fetching:** SerpAPI.