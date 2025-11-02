# Economy Plumbing Services - Project Documentation

## Overview
Economy Plumbing Services is a full-stack web application designed to enhance a plumbing business's online presence. It provides service information, covered areas, blog content, and an Ecwid-powered online store. The project aims to improve local SEO, user engagement, and conversion rates by leveraging AI for content generation, marketing automation, and reputation management. The business vision is to expand market reach and improve customer engagement through an intuitive online platform.

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

### November 2024 SSR Refactoring
**Problem Discovered:** 74 pages had 'use client' breaking SEO despite Next.js migration
**Solution:** Converted all SEO-critical pages to async Server Components
**Pages Fixed:** 39 total (blog posts, 32 service pages, service areas, success stories)
**Result:** Search engines now see full HTML with content, metadata, and JSON-LD schemas on first paint

**Phone Number Tracking:** Server-rendered for crawlers, client-side upgrade for dynamic tracking preserved

## System Architecture

### Frontend
- **Framework & UI:** Next.js 15 App Router (migrated from Express/React), React 18 with TypeScript, Vite, Wouter, TanStack Query. UI uses Radix UI, Shadcn UI, Tailwind CSS, and CVA.
- **Design System:** Blue/teal color scheme, Inter/Poppins typography, light/dark modes, WCAG AA Compliant.
- **SEO & Performance:** Centralized `SEOHead`, JSON-LD, 301 redirects, resource preconnect, image lazy loading, font optimization, code splitting, WebP conversion, dynamic sitemap generation, and server-side dynamic phone tracking based on UTM parameters for crawlers.
- **Key Pages:** Home, About, Contact, Services, Service Areas, Blog, Ecwid Store, FAQ, policy pages, VIP Membership, interactive calculators, seasonal landing pages, commercial industry pages, and a Customer Portal with ServiceTitan integration.
- **AI Chatbot:** Site-wide OpenAI GPT-4o-mini powered chatbot.
- **Admin Panels:** Unified admin dashboard for Marketing Automation (campaign-specific phone numbers, email templates), ServiceTitan sync monitoring, Customer Portal analytics, photo/metadata management, Reputation Management, SMS Marketing, and centralized tracking phone number management.

### Backend
- **Framework & API:** Next.js 15 App Router (API routes) and a separate `worker.ts` process for background jobs.
- **Data Layer:** Drizzle ORM for PostgreSQL with Neon serverless database.
- **Data Models:** Users, Blog Posts, Products, Contact Submissions, Service Areas, Google Reviews, Commercial Customers.
- **Dynamic Phone Number Tracking:** Server-side resolution of tracking numbers based on UTMs during SSR, enhanced client-side with cookies/referrer. Database-driven rules for campaign-specific numbers.
- **Security & Type Safety:** Session-based authentication using `iron-session` for `/admin` routes, rate limiting, secure cookies, CSRF/SSRF protection, comprehensive CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, 100% type-safe TypeScript.
- **ServiceTitan Integration:** XLSX-based customer data management for customer portal and marketing, replacing API-based sync.
- **Marketing Automation:** AI-powered system with comprehensive email engagement tracking for Review Request, Referral Nurture, and Quote Follow-up campaigns. Includes AI customer segmentation, HTML preview/approval, campaign-specific phone tracking, and automatic UTM parameter generation. Schedulers run every 30 minutes, checking suppression lists.
- **SMS Marketing System:** AI-powered campaign generation, behavioral intelligence, TCPA-compliant opt-in/opt-out.
- **Reputation Management System:** AI-powered review request automation with drip campaign engine (GPT-4o), preview/edit/approve interface for email sequences. Automated review fetching via SerpAPI (Google, Yelp) for read-only display, syncing every 6 hours.
- **Referral System:** Database-first management with ServiceTitan integration, hourly processing, and AI-generated emails (referee welcome, referrer thank you, referrer success notifications) with engagement tracking.
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