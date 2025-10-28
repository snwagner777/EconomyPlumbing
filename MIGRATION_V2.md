# Complete Next.js 15 Migration Roadmap (REVISED)
## Economy Plumbing Services

**Migration Goal:** Replace Express/Vite entirely with Next.js 15 App Router while preserving ALL functionality.

**Status:** Comprehensive architectural plan with deployment strategy

**REALISTIC TIMELINE:** 40-60 hours (1-2 weeks of focused engineering work)

---

## Critical Architect Feedback Addressed

### Original Issues Found
1. ✅ **Timeline unrealistic** - Now 40-60 hours (was 15-20)
2. ✅ **Missing worker orchestration details** - Added deployment topology
3. ✅ **Missing webhook implementation specifics** - Added Mailgun/Stripe/Resend details
4. ✅ **Wrong phase ordering** - APIs/webhooks now before admin pages
5. ✅ **No testing strategy** - Added comprehensive QA plan
6. ✅ **Missing environment migration** - Added secrets/config parity
7. ✅ **No incremental cutover plan** - Added staged deployment approach
8. ✅ **Missing AI tooling details** - Added OpenAI integration specifics

---

## Executive Summary

### Current Architecture (Express/Vite/React)
```
┌─────────────────────────────────────────────────┐
│         Express Server (Port 5000)              │
├─────────────────────────────────────────────────┤
│ • 10,837 lines of API routes                    │
│ • 14 background schedulers (setInterval)        │
│ • Vite dev server integration                   │
│ • 3 webhooks (Mailgun, Resend, ServiceTitan)    │
│ • Session management (connect-pg-simple)        │
│ • File uploads (multer)                         │
│ • Security headers middleware                   │
│ • 301 redirect middleware (60+ rules)           │
│ • Metadata injection SSR                        │
│ • Object storage serving                        │
└─────────────────────────────────────────────────┘
```

### Target Architecture (Next.js 15 + Worker)
```
┌────────────────────┐     ┌──────────────────────┐
│  Next.js App       │     │   worker.ts          │
│  (Port 5000)       │     │   (background)       │
├────────────────────┤     ├──────────────────────┤
│ • Pages (RSC)      │     │ • 14 schedulers      │
│ • API routes       │     │ • Health monitoring  │
│ • Server Actions   │     │ • Shared DB access   │
│ • Webhooks         │     │ • Error alerting     │
│ • Middleware       │     │ • Graceful shutdown  │
│ • Edge functions   │     │ • Lock coordination  │
└────────────────────┘     └──────────────────────┘
         │                           │
         └────── Shared Database ────┘
              (Drizzle + Neon)
```

### Deployment Topology (Replit)
```yaml
# .replit or Procfile
web: NODE_ENV=production npm run start:next
worker: NODE_ENV=production npm run start:worker

# package.json scripts
{
  "start:next": "next start -p 5000",
  "start:worker": "tsx server/worker.ts",
  "dev:next": "next dev -p 5000",
  "dev:worker": "tsx watch server/worker.ts"
}
```

**Process Coordination:**
- Both processes share DATABASE_URL
- Worker writes health pings to DB every 30s
- Next.js API reads worker health status
- Graceful shutdown via SIGTERM handlers
- Lock table prevents double-scheduling
- Shared logging via Pino to stdout

---

## Complete Inventory

### 1. Frontend Pages (52 pages total)

#### Public Marketing (18 pages)
- [ ] `/` - Homepage with hero, services, testimonials, reviews, contact
- [ ] `/services` - Services overview
- [ ] `/services/water-heater-services`
- [ ] `/services/drain-cleaning`
- [ ] `/services/leak-detection`
- [ ] `/services/gas-line-services`
- [ ] `/services/sewer-repair`
- [ ] `/services/repiping`
- [ ] `/services/hydro-jetting-services`
- [ ] `/services/emergency-plumbing`
- [ ] `/about`
- [ ] `/contact`
- [ ] `/faq`
- [ ] `/privacy-policy`
- [ ] `/terms-of-service`
- [ ] `/membership-benefits`
- [ ] `/water-heater-cost-calculator`
- [ ] `/water-heater-guide`

#### Service Areas (16 pages)
- [ ] `/service-areas` + 15 city pages

#### Blog (2 dynamic pages)
- [ ] `/blog` - Listing with pagination
- [ ] `/blog/[slug]` - Individual posts

#### Commercial (6 pages)
- [ ] `/commercial-plumbing` + 5 industry pages

#### E-commerce (2 pages)
- [ ] `/store` - Ecwid embed
- [ ] `/store/[slug]` - Product pages

#### Seasonal (2 pages)
- [ ] `/winter-plumbing-tips`
- [ ] `/summer-plumbing-tips`

#### Customer Portal (3 pages)
- [ ] `/customer-portal` - Dashboard
- [ ] `/customer-portal/login` - Verification
- [ ] `/customer-portal/jobs` - Job history

#### Admin Dashboard (10+ pages)
- [ ] `/admin` - Unified dashboard
- [ ] `/admin/marketing` - Campaigns
- [ ] `/admin/phone-tracking` - Tracking numbers
- [ ] `/admin/metadata` - SEO management
- [ ] `/admin/commercial-customers` - Photos
- [ ] `/admin/reviews` - Review system
- [ ] `/admin/referrals` - Referral management
- [ ] `/admin/blog` - Blog CMS
- [ ] `/admin/servicetitan-sync` - Sync monitoring
- [ ] `/admin/sms` - SMS campaigns
- [ ] `/admin/reputation` - Reputation mgmt

### 2. API Routes (120+ endpoints)

**Critical Next.js Implementation Notes:**

#### Raw Body Routes (Stripe, Resend)
```typescript
// app/api/webhooks/stripe/route.ts
// Note: Next.js App Router doesn't support `export const config`
// We must read the raw body directly from the request

import { Readable } from 'stream';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  // Get raw body for signature verification
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  
  if (!sig) {
    return Response.json({ error: 'No signature' }, { status: 400 });
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }
  
  // Handle event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    // Process payment...
  }
  
  return Response.json({ received: true });
}
```

#### Multipart Form Data (Mailgun, Blog Images)
```typescript
// app/api/webhooks/mailgun/customer-data/route.ts
import Busboy from 'busboy';
import { Readable } from 'stream';
import { createHmac } from 'crypto';
import xlsx from 'xlsx';

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type');
  
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return Response.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
  }
  
  const busboy = Busboy({ headers: { 'content-type': contentType } });
  
  const files: Array<{
    fieldname: string;
    buffer: Buffer;
    filename: string;
    mimetype: string;
  }> = [];
  
  const fields: Record<string, string> = {};
  
  busboy.on('file', (fieldname, file, info) => {
    const { filename, mimeType } = info;
    const chunks: Buffer[] = [];
    
    file.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    file.on('end', () => {
      files.push({
        fieldname,
        buffer: Buffer.concat(chunks),
        filename,
        mimetype: mimeType,
      });
    });
  });
  
  busboy.on('field', (fieldname, value) => {
    fields[fieldname] = value;
  });
  
  // Read request body and pipe to busboy
  const arrayBuffer = await req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  await new Promise<void>((resolve, reject) => {
    busboy.on('finish', () => resolve());
    busboy.on('error', (err) => reject(err));
    
    // Pipe buffer to busboy as a readable stream
    Readable.from(buffer).pipe(busboy);
  });
  
  // Verify Mailgun signature
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!signingKey) {
    return Response.json({ error: 'Signing key not configured' }, { status: 500 });
  }
  
  const timestamp = fields.timestamp;
  const token = fields.token;
  const signature = fields.signature;
  
  if (!timestamp || !token || !signature) {
    return Response.json({ error: 'Missing signature components' }, { status: 401 });
  }
  
  // Verify timestamp (prevent replay attacks)
  const currentTime = Math.floor(Date.now() / 1000);
  const timestampAge = currentTime - parseInt(timestamp);
  
  if (timestampAge > 300) { // 5 minutes
    return Response.json({ error: 'Timestamp too old' }, { status: 401 });
  }
  
  // Verify signature
  const computedSignature = createHmac('sha256', signingKey)
    .update(timestamp + token)
    .digest('hex');
  
  if (computedSignature !== signature) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Find XLSX attachment
  const xlsxFile = files.find(f => 
    f.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  
  if (!xlsxFile) {
    return Response.json({ error: 'No XLSX attachment found' }, { status: 400 });
  }
  
  // Process XLSX file...
  const workbook = xlsx.read(xlsxFile.buffer, { type: 'buffer' });
  // ... import customer data ...
  
  return Response.json({ success: true });
}
```

#### Route Organization
```
app/api/
├── contact/route.ts
├── google-reviews/
│   ├── route.ts (GET /api/google-reviews)
│   ├── random/route.ts
│   ├── refresh/route.ts
│   └── stats/route.ts
├── gmb/
│   ├── auth/route.ts
│   ├── reviews/route.ts
│   └── automation/
│       ├── start/route.ts
│       ├── stop/route.ts
│       └── status/route.ts
├── blog/
│   ├── posts/route.ts
│   ├── posts/[id]/route.ts
│   ├── generate/route.ts
│   └── upload-image/route.ts
├── products/[...endpoints]
├── stripe/
│   ├── create-checkout-session/route.ts
│   └── webhook/route.ts
├── servicetitan/
│   ├── oauth/
│   │   ├── authorize/route.ts
│   │   ├── callback/route.ts
│   │   └── refresh/route.ts
│   ├── customers/[id]/jobs/route.ts
│   └── sync/route.ts
├── customer-portal/[...endpoints]
├── marketing/[...endpoints]
├── review-requests/[...endpoints]
├── referrals/[...endpoints]
├── sms/[...endpoints]
├── metadata/[...endpoints]
├── commercial-customers/[...endpoints]
├── chatbot/[...endpoints]
└── webhooks/
    ├── mailgun/customer-data/route.ts
    ├── resend/route.ts
    └── servicetitan/route.ts
```

### 3. Background Schedulers (14 jobs → worker.ts)

**Worker Architecture:**
```typescript
// server/worker.ts
import { createSchedulerRegistry } from './lib/schedulerRegistry';
import { db } from './db';
import pino from 'pino';

const logger = pino({ name: 'worker' });

async function main() {
  logger.info('Worker starting...');
  
  const registry = createSchedulerRegistry({
    db,
    logger,
    onError: async (job, error) => {
      // Log to database + send admin alert
      await db.insert(schedulerErrors).values({
        jobName: job.name,
        error: error.message,
        timestamp: new Date(),
      });
    },
  });
  
  // Register all schedulers
  registry.register({
    name: 'reviewRequestScheduler',
    interval: 30 * 60 * 1000, // 30 minutes
    handler: async () => {
      const scheduler = getReviewRequestScheduler();
      await scheduler.processQueue();
    },
  });
  
  // ... register 13 more schedulers ...
  
  // Start all jobs
  await registry.start();
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await registry.stop();
    process.exit(0);
  });
  
  // Health ping every 30s
  setInterval(async () => {
    await db.insert(workerHealthPings).values({
      timestamp: new Date(),
      activeJobs: registry.getActiveJobs(),
    });
  }, 30000);
}

main().catch((error) => {
  logger.error(error, 'Worker fatal error');
  process.exit(1);
});
```

**Scheduler Registry (Prevents Double-Run):**
```typescript
// server/lib/schedulerRegistry.ts
import { db } from '../db';
import { schedulerLocks } from '@shared/schema';

export class SchedulerRegistry {
  private jobs = new Map<string, NodeJS.Timeout>();
  
  async acquireLock(jobName: string): Promise<boolean> {
    try {
      await db.insert(schedulerLocks).values({
        jobName,
        workerId: process.env.DYNO || 'worker-1',
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      });
      return true;
    } catch (e) {
      // Lock already held
      return false;
    }
  }
  
  async releaseLock(jobName: string): Promise<void> {
    await db.delete(schedulerLocks).where(eq(schedulerLocks.jobName, jobName));
  }
  
  register(job: SchedulerJob): void {
    const timer = setInterval(async () => {
      if (await this.acquireLock(job.name)) {
        try {
          await job.handler();
        } finally {
          await this.releaseLock(job.name);
        }
      }
    }, job.interval);
    
    this.jobs.set(job.name, timer);
  }
  
  async stop(): Promise<void> {
    for (const [name, timer] of this.jobs) {
      clearInterval(timer);
      await this.releaseLock(name);
    }
  }
}
```

**All 14 Schedulers:**
1. reviewRequestScheduler (30 min) - Review request emails
2. referralNurtureScheduler (30 min) - Referral nurture emails
3. customCampaignScheduler (30 min) - Custom marketing campaigns
4. membershipSyncJob (60 min) - Stripe membership sync
5. photoCleanupJob (24 hours) - Old photo cleanup
6. dailyCompositeJob (24 hours) - Daily aggregations
7. autoBlogGenerator (7 days) - AI blog generation
8. googleDriveMonitor (10 min) - New photo detection
9. gmbAutomation (60 min) - GMB automation
10. serviceTitanSync (60 min) - Customer sync
11. referralProcessor (60 min) - Process referrals
12. healthAlerterScheduler (5 min) - System health monitoring
13. webhookRetryProcessor (5 min) - Retry failed webhooks
14. weeklyPostScheduler (7 days) - Social media (currently disabled)

### 4. Middleware Migration

**Next.js middleware.ts:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // 1. Security Headers (CSP, HSTS, etc.)
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.google-analytics.com *.googletagmanager.com *.facebook.com *.clarity.ms servicetitan.com; ...`
  );
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 2. Domain Redirect (.replit.app → custom domain)
  const host = request.headers.get('host');
  if (host?.includes('.replit.app')) {
    return NextResponse.redirect(`https://www.plumbersthatcare.com${request.nextUrl.pathname}`);
  }
  
  // 3. 301 Redirects (60+ rules)
  const redirects: Record<string, string> = {
    '/b2b': '/commercial-plumbing',
    '/shop/products': '/store',
    // ... 58 more ...
  };
  
  const redirect = redirects[request.nextUrl.pathname];
  if (redirect) {
    return NextResponse.redirect(new URL(redirect, request.url), 301);
  }
  
  // 4. Trailing Slash Normalization
  if (request.nextUrl.pathname !== '/' && request.nextUrl.pathname.endsWith('/')) {
    return NextResponse.redirect(
      new URL(request.nextUrl.pathname.slice(0, -1), request.url),
      301
    );
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 5. Static Assets & CDN Strategy

**Current State:**
- `attached_assets/` directory (1GB+ of images, PDFs, etc.)
- Legacy Express route: `GET /attached_assets/:filePath(*)`
- Object storage via Replit (public/ directory)
- Legacy route: `GET /public-objects/:filePath(*)`

**Migration Strategy:**

#### Option A: Next.js Public Directory (Recommended for <100MB)
```
Move to public/assets/
├── images/
│   ├── services/
│   ├── blog/
│   ├── commercial/
│   └── hero/
├── pdfs/
└── documents/

Access via: /assets/images/hero/hero-bg.jpg
```

**Pros:**
- Automatic optimization via Next.js Image
- Built-in cache headers
- Simple deployment

**Cons:**
- Increases deployment bundle size
- Not ideal for >100MB assets

#### Option B: Object Storage (Recommended for Current Setup)
```
Keep in Replit Object Storage
Access via Next.js API route proxy:
  app/api/assets/[...path]/route.ts
```

**Implementation:**
```typescript
// app/api/assets/[...path]/route.ts
import { ObjectStorageService } from '@/lib/objectStorage';

export async function GET(
  req: Request,
  { params }: { params: { path: string[] } }
) {
  const filePath = params.path.join('/');
  const objectStorageService = new ObjectStorageService();
  
  try {
    const file = await objectStorageService.searchPublicObject(filePath);
    
    if (!file) {
      return new Response('Not found', { status: 404 });
    }
    
    const fileBuffer = await objectStorageService.downloadObjectBuffer(file);
    
    // Determine cache TTL
    const cacheTtl = filePath.startsWith('blog_images/') ? 31536000 : 3600;
    
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Cache-Control': `public, max-age=${cacheTtl}, immutable`,
        'ETag': file.etag || '',
      },
    });
  } catch (error) {
    console.error('Error serving asset:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
```

#### Option C: Hybrid Approach (RECOMMENDED)
```
Critical assets → public/
├── favicon.ico
├── robots.txt
├── og-image.jpg
└── logo.png

Large/dynamic assets → Object Storage
├── blog_images/ (via /api/assets/blog_images/[...])
├── commercial_photos/ (via /api/assets/commercial_photos/[...])
└── user_uploads/ (via /api/assets/user_uploads/[...])

Legacy route preservation:
/attached_assets/* → Redirect 301 to /api/assets/*
```

**Asset Migration Checklist:**
- [ ] Audit attached_assets/ size and contents
- [ ] Identify critical assets (<10MB) → move to public/
- [ ] Large assets stay in object storage
- [ ] Create /api/assets/[...path]/route.ts proxy
- [ ] Set up cache headers (1 year for immutable, 1 hour for dynamic)
- [ ] Test all image URLs
- [ ] Update image references in code
- [ ] Set up 301 redirects for old /attached_assets/ URLs

### 6. Environment & Secrets Migration

**Current Environment Variables (Express):**
```bash
# Database
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ServiceTitan
SERVICETITAN_CLIENT_ID=...
SERVICETITAN_CLIENT_SECRET=...
SERVICETITAN_TENANT_ID=...

# Email
RESEND_API_KEY=re_...
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=mg.plumbersthatcare.com
MAILGUN_WEBHOOK_SIGNING_KEY=...

# Google
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_PLACES_API_KEY=...

# OpenAI
OPENAI_API_KEY=sk-...

# SMS
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
ZOOM_PHONE_API_KEY=...

# Auth
REPLIT_OAUTH_CLIENT_ID=...
REPLIT_OAUTH_CLIENT_SECRET=...
SESSION_SECRET=...

# Analytics
GOOGLE_ANALYTICS_ID=G-...
META_PIXEL_ID=...
CLARITY_PROJECT_ID=...

# Object Storage
REPL_ID=...
PUBLIC_OBJECT_SEARCH_PATHS=public
PRIVATE_OBJECT_DIR=.private
```

**Next.js Environment Handling:**
- Server-only vars: No prefix needed
- Client-exposed vars: Must use `NEXT_PUBLIC_` prefix

**Migration Checklist:**

#### Phase 1: Environment Audit (Before Migration)
- [ ] List all current env vars in production Replit
- [ ] Document which vars are used where
- [ ] Identify client-side vs server-side usage
- [ ] Check for hard-coded values that should be env vars

#### Phase 2: Create .env.local Template
```bash
# .env.local (Development)
# Copy all existing vars from production

# Database (no change)
DATABASE_URL=postgresql://...

# Stripe (no change)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ServiceTitan (no change)
SERVICETITAN_CLIENT_ID=...
SERVICETITAN_CLIENT_SECRET=...
SERVICETITAN_TENANT_ID=...

# Email (no change)
RESEND_API_KEY=re_...
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=mg.plumbersthatcare.com
MAILGUN_WEBHOOK_SIGNING_KEY=...

# Google (no change)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_PLACES_API_KEY=...

# OpenAI (no change)
OPENAI_API_KEY=sk-...

# SMS (no change)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
ZOOM_PHONE_API_KEY=...

# Auth (no change)
REPLIT_OAUTH_CLIENT_ID=...
REPLIT_OAUTH_CLIENT_SECRET=...
SESSION_SECRET=...

# Analytics (CLIENT-SIDE - NEW PREFIXES)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-...
NEXT_PUBLIC_META_PIXEL_ID=...
NEXT_PUBLIC_CLARITY_PROJECT_ID=...

# Object Storage (no change)
REPL_ID=...
PUBLIC_OBJECT_SEARCH_PATHS=public
PRIVATE_OBJECT_DIR=.private

# Next.js specific
NODE_ENV=production
```

#### Phase 3: OAuth Callback URL Migration

**Critical: ServiceTitan OAuth Callbacks**

Current callback URL (Express):
```
https://www.plumbersthatcare.com/api/servicetitan/oauth/callback
```

Next.js callback URL (SAME - no change needed):
```
https://www.plumbersthatcare.com/api/servicetitan/oauth/callback
```

**Action Items:**
- [ ] Verify ServiceTitan app still has correct callback URL
- [ ] Test OAuth flow in development first
- [ ] Ensure token storage works identically
- [ ] Test token refresh mechanism
- [ ] Have ServiceTitan support contact ready if issues

**Replit OAuth Callbacks**

Current callback URL (Express):
```
https://www.plumbersthatcare.com/api/auth/replit/callback
```

Next.js callback URL (SAME):
```
https://www.plumbersthatcare.com/api/auth/replit/callback
```

**Action Items:**
- [ ] No changes needed (URL stays same)
- [ ] Test admin login flow
- [ ] Verify session management works

#### Phase 4: Secrets Rotation Safety

**Do NOT rotate these secrets during migration:**
- ❌ STRIPE_WEBHOOK_SECRET (breaks webhook verification)
- ❌ SERVICETITAN_CLIENT_SECRET (breaks OAuth)
- ❌ SESSION_SECRET (logs out all users)
- ❌ MAILGUN_WEBHOOK_SIGNING_KEY (breaks data imports)

**These can be rotated if needed:**
- ✅ RESEND_API_KEY (graceful, just update env var)
- ✅ OPENAI_API_KEY (graceful, just update env var)
- ✅ GOOGLE_PLACES_API_KEY (graceful)

#### Phase 5: Staged Environment Migration

**Stage 1: Development (Replit)**
```bash
# Test everything locally first
- Use development database
- Use test API keys where possible
- Stripe test mode
- ServiceTitan test tenant
```

**Stage 2: Staging Cutover**
```bash
# Deploy Next.js to port 3000 first
- Express still on port 5000 (production)
- Next.js on port 3000 (testing)
- Internal team testing
- No public traffic yet
```

**Stage 3: Production Cutover**
```bash
# Swap ports
- Stop Express
- Start Next.js on port 5000
- Start worker.ts
- Monitor for 24 hours
- Keep Express code for emergency rollback
```

**Environment Variable Checklist Per Stage:**

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| DATABASE_URL | Test DB | Prod DB | Prod DB |
| STRIPE_SECRET_KEY | Test key | Live key | Live key |
| SERVICETITAN_CLIENT_ID | Test | Test | Live |
| RESEND_API_KEY | Live | Live | Live |
| OPENAI_API_KEY | Live | Live | Live |
| NODE_ENV | development | production | production |

### 6. Critical Feature Preservation Checklist

#### Dynamic Phone Number Tracking
- [ ] Database tables: trackingNumbers, trackingCalls
- [ ] API: GET /api/tracking-numbers
- [ ] Client context: PhoneConfigProvider
- [ ] Cookie: trafficSource (90 days)
- [ ] UTM parameter detection
- [ ] Campaign-specific numbers
- [ ] Fallback gracefully

#### ServiceTitan Integration
- [ ] OAuth 2.0 flow (authorization, callback, refresh)
- [ ] Customer search API
- [ ] Job history API
- [ ] Invoice download API
- [ ] Scheduler widget (on-demand script loading)
- [ ] Customer portal verification
- [ ] Token expiry handling

#### SEO Features
- [ ] Metadata API (Next.js 15 generateMetadata)
- [ ] OpenGraph (og:title, og:description, og:image)
- [ ] JSON-LD schemas (LocalBusiness, Service, FAQ, Article)
- [ ] Dynamic sitemap.xml (app/sitemap.ts)
- [ ] Robots.txt (app/robots.ts)
- [ ] Canonical URLs
- [ ] Structured breadcrumbs

#### Image Optimization
- [ ] Next.js Image component for all images
- [ ] CompanyCam API integration
- [ ] Google Drive monitoring (new photos)
- [ ] Sharp processing (resize, WebP conversion)
- [ ] Focal point detection (OpenAI GPT-4o Vision)
- [ ] EXIF metadata extraction
- [ ] Object storage caching
- [ ] Commercial customer photo management

#### Marketing Automation
- [ ] AI customer segmentation (GPT-4o)
- [ ] Email template generation (GPT-4o)
- [ ] Campaign preview/approval workflow
- [ ] Suppression list (emailSuppressionList table)
- [ ] Engagement tracking (emailSendLog)
- [ ] Auto-pause on 2 consecutive unopened
- [ ] Campaign-specific tracking numbers
- [ ] UTM parameter generation

#### Referral System
- [ ] Database: referrals, referralCredits
- [ ] ServiceTitan pre-submission validation
- [ ] Hourly processing job
- [ ] Job completion tracking
- [ ] ServiceTitan notes integration
- [ ] Credit management
- [ ] AI-generated emails (referee welcome, referrer thank you, success notification)
- [ ] Admin-configurable AI prompts
- [ ] Template preview API

#### Email Preference Center
- [ ] Token-based public UI (/preferences/[token])
- [ ] Category opt-outs (marketing, reviews, referrals, account)
- [ ] One-click unsubscribe
- [ ] CAN-SPAM compliance
- [ ] Database: customerEmailPreferences

---

## Revised Migration Plan (9 Phases)

### Phase 1: Infrastructure & Worker Setup (6-8 hours)

**Goals:**
- Create worker.ts architecture
- Set up deployment topology
- Migrate environment variables
- Create scheduler registry

**Tasks:**
- [ ] Create worker.ts entry point
- [ ] Create scheduler registry with lock coordination
- [ ] Create Procfile for dual-process deployment
- [ ] Update package.json scripts
- [ ] Audit all environment variables
- [ ] Create .env.local template
- [ ] Set up Pino logging (shared between Next.js and worker)
- [ ] Create health monitoring tables (workerHealthPings, schedulerErrors, schedulerLocks)
- [ ] Test worker starts and stops correctly
- [ ] Test graceful shutdown (SIGTERM)

**Deliverables:**
- ✅ worker.ts running independently
- ✅ Procfile configured
- ✅ All environment variables documented
- ✅ Health monitoring working

---

### Phase 2: Next.js Middleware & Global Behavior (4-5 hours)

**Goals:**
- Security headers matching Express
- 301 redirects preserved
- Domain redirects working

**Tasks:**
- [ ] Create middleware.ts with CSP headers
- [ ] Implement all 60+ redirect rules
- [ ] Implement domain redirect (.replit.app → custom)
- [ ] Implement trailing slash normalization
- [ ] Create not-found.tsx (404 page)
- [ ] Create error.tsx (500 page)
- [ ] Create loading.tsx states
- [ ] Test all redirects
- [ ] Test security headers (use securityheaders.com)

**Deliverables:**
- ✅ All redirects working
- ✅ Security headers matching production
- ✅ Error pages styled

---

### Phase 3: Core API Routes (10-12 hours)

**Priority: Migrate APIs BEFORE pages to avoid broken functionality**

#### High Priority APIs (Must come first)
- [ ] GET /api/tracking-numbers (phone tracking)
- [ ] GET /api/google-reviews (homepage)
- [ ] POST /api/contact (contact forms)
- [ ] GET /api/metadata/:page (SEO)
- [ ] GET /api/blog/posts (blog)
- [ ] GET /api/products (store)
- [ ] GET /api/chatbot/* (chatbot)

#### Webhook APIs (Critical - Test Thoroughly)
- [ ] POST /api/webhooks/mailgun/customer-data (Busboy multipart)
- [ ] POST /api/webhooks/resend (email engagement)
- [ ] POST /api/webhooks/servicetitan (job notifications)
- [ ] POST /api/webhooks/stripe (payment events - raw body)

#### ServiceTitan OAuth
- [ ] GET /api/servicetitan/oauth/authorize
- [ ] GET /api/servicetitan/oauth/callback
- [ ] POST /api/servicetitan/oauth/refresh
- [ ] GET /api/servicetitan/customers/:id/jobs

#### Marketing Automation APIs
- [ ] GET /api/marketing/campaigns
- [ ] POST /api/marketing/campaigns
- [ ] POST /api/marketing/campaigns/:id/preview
- [ ] POST /api/marketing/campaigns/:id/approve
- [ ] GET /api/marketing/tracking-numbers

#### Review Request APIs
- [ ] GET /api/review-requests
- [ ] POST /api/review-requests
- [ ] GET /api/review-requests/stats

#### Referral APIs
- [ ] GET /api/referrals
- [ ] POST /api/referrals
- [ ] PUT /api/referrals/:id
- [ ] POST /api/referrals/:id/validate (ServiceTitan check)

#### SMS Marketing APIs
- [ ] GET /api/sms/campaigns
- [ ] POST /api/sms/campaigns
- [ ] POST /api/sms/campaigns/:id/send
- [ ] POST /api/sms/opt-out

#### Remaining APIs
- [ ] All Google My Business APIs
- [ ] All blog management APIs
- [ ] All commercial customer APIs
- [ ] All customer portal APIs
- [ ] All metadata management APIs

**Testing Strategy:**
- Unit tests for each route
- Integration tests with database
- Webhook signature verification tests
- ServiceTitan OAuth flow test
- Load testing (100 req/s)

**Deliverables:**
- ✅ 120+ API routes migrated
- ✅ All webhooks verified with test payloads
- ✅ ServiceTitan OAuth working
- ✅ Test suite passing

---

### Phase 4: Background Schedulers Migration (6-8 hours)

**Goals:**
- Move all 14 schedulers to worker.ts
- Ensure no double-running
- Implement health monitoring

**Tasks:**
- [ ] Create scheduler modules (refactor from Express)
- [ ] Register reviewRequestScheduler (30 min)
- [ ] Register referralNurtureScheduler (30 min)
- [ ] Register customCampaignScheduler (30 min)
- [ ] Register membershipSyncJob (60 min)
- [ ] Register photoCleanupJob (24 hours)
- [ ] Register dailyCompositeJob (24 hours)
- [ ] Register autoBlogGenerator (7 days)
- [ ] Register googleDriveMonitor (10 min)
- [ ] Register gmbAutomation (60 min)
- [ ] Register serviceTitanSync (60 min)
- [ ] Register referralProcessor (60 min)
- [ ] Register healthAlerterScheduler (5 min)
- [ ] Register webhookRetryProcessor (5 min)
- [ ] Create admin dashboard for worker health
- [ ] Test all schedulers run correctly
- [ ] Test lock coordination (simulate multi-instance)
- [ ] Run for 48 hours continuous

**Deliverables:**
- ✅ All 14 schedulers in worker.ts
- ✅ Health dashboard showing status
- ✅ 48-hour stability test passed

---

### Phase 5: Public Pages & SEO (8-10 hours)

**Goals:**
- All marketing pages live
- SEO metadata working
- Fast page loads

#### Homepage
- [ ] Hero with background image
- [ ] 7 service cards with Next.js Image
- [ ] Testimonials section
- [ ] Google reviews display
- [ ] Contact form
- [ ] "Why Choose Us" section
- [ ] Service areas footer
- [ ] SMS widget (Twilio)
- [ ] ServiceTitan scheduler button

#### Service Pages (9 pages)
- [ ] /services layout
- [ ] Water heater services
- [ ] Drain cleaning
- [ ] Leak detection
- [ ] Gas line services
- [ ] Sewer repair
- [ ] Repiping
- [ ] Hydro jetting
- [ ] Emergency plumbing

#### Service Area Pages (16 pages)
- [ ] Create dynamic route [city]/page.tsx
- [ ] Migrate all city data

#### Static Pages
- [ ] About
- [ ] Contact
- [ ] FAQ
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Membership Benefits

#### Blog
- [ ] /blog page with pagination
- [ ] /blog/[slug] dynamic route
- [ ] Related posts
- [ ] Social sharing

#### Commercial Pages (6 pages)
- [ ] Commercial overview
- [ ] 5 industry pages

#### Interactive Tools
- [ ] Water heater cost calculator
- [ ] Water heater guide

#### Seasonal
- [ ] Winter tips
- [ ] Summer tips

#### E-commerce
- [ ] /store Ecwid embed
- [ ] Product pages

**SEO Implementation:**
```typescript
// app/(public)/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata('/');
  
  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    openGraph: {
      title: metadata.ogTitle,
      description: metadata.ogDescription,
      images: [metadata.ogImage],
      type: 'website',
      locale: 'en_US',
      siteName: 'Economy Plumbing Services',
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.ogTitle,
      description: metadata.ogDescription,
      images: [metadata.ogImage],
    },
  };
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Economy Plumbing Services",
            "image": "https://www.plumbersthatcare.com/og-image.jpg",
            "@id": "https://www.plumbersthatcare.com",
            "url": "https://www.plumbersthatcare.com",
            "telephone": "(512) 859-5700",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "16200 Ranch Rd 12 N",
              "addressLocality": "Wimberley",
              "addressRegion": "TX",
              "postalCode": "78676",
              "addressCountry": "US"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 30.1091,
              "longitude": -98.0825
            },
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              "opens": "08:00",
              "closes": "17:00"
            },
            "sameAs": [
              "https://www.facebook.com/plumbersthatcare"
            ]
          }),
        }}
      />
      {/* Page content */}
    </>
  );
}
```

**Dynamic Sitemap:**
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.plumbersthatcare.com';
  
  const [posts, products, areas] = await Promise.all([
    db.query.blogPosts.findMany({ where: eq(blogPosts.published, true) }),
    db.query.products.findMany(),
    db.query.serviceAreas.findMany(),
  ]);
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...posts.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    // ... more routes ...
  ];
}
```

**Deliverables:**
- ✅ All 52 pages live
- ✅ SEO metadata working
- ✅ Lighthouse score > 90
- ✅ Mobile responsive

---

### Phase 6: Customer Portal (4-5 hours)

**Goals:**
- ServiceTitan OAuth working
- Customer can view jobs/invoices
- Phone/email verification secure

**Tasks:**
- [ ] Create (customer) route group
- [ ] Create login page with phone/email input
- [ ] Implement OTP verification
- [ ] Create dashboard layout
- [ ] Fetch customer data from ServiceTitan
- [ ] Display job history
- [ ] Implement invoice download
- [ ] Test OAuth token refresh
- [ ] Test with real ServiceTitan account

**Deliverables:**
- ✅ Customer portal functional
- ✅ ServiceTitan integration verified

---

### Phase 7: Admin Dashboard (10-12 hours)

**Goals:**
- Unified admin accessible
- All management features working
- OAuth authentication secure

**Tasks:**
- [ ] Create (admin) route group
- [ ] Implement Replit OAuth (app/api/auth/[...nextauth]/route.ts)
- [ ] Create admin layout (sidebar navigation)
- [ ] Migrate UnifiedAdminDashboard.tsx (9,000 lines)
  - Break into domain modules
  - Marketing automation section
  - Phone tracking management
  - Metadata editor
  - Commercial customer photos
  - Review management
  - Referral management
  - Blog CMS
  - ServiceTitan sync monitoring
  - SMS campaigns
  - Reputation management
- [ ] Create admin APIs (POST/PUT/DELETE)
- [ ] Test all admin workflows
- [ ] Test photo uploads
- [ ] Test email preview system

**Deliverables:**
- ✅ Admin dashboard fully functional
- ✅ All management features working
- ✅ OAuth authentication secure

---

### Phase 8: Object Storage & Image Processing (4-5 hours)

**Goals:**
- Object storage serving working
- Image optimization working
- AI features operational

**Tasks:**
- [ ] Migrate object storage routes
  - GET /public-objects/:filePath(*)
  - GET /replit-objstore-:bucketId/public/:filePath(*)
- [ ] Set up Next.js Image loader
- [ ] Migrate image upload handlers
- [ ] Implement sharp processing
- [ ] Implement WebP conversion
- [ ] Migrate AI photo analysis (focal points)
- [ ] Migrate CompanyCam integration
- [ ] Migrate Google Drive monitoring
- [ ] Test commercial customer photo workflow
- [ ] Test blog image uploads

**AI Features:**
- [ ] Blog generation (GPT-4o)
- [ ] Email template generation (GPT-4o)
- [ ] Photo focal point detection (GPT-4o Vision)
- [ ] Photo metadata extraction (GPT-4o Vision)
- [ ] Customer segmentation (GPT-4o)
- [ ] Chatbot (GPT-4o-mini)

**Deliverables:**
- ✅ All images serving correctly
- ✅ AI features working
- ✅ Image optimization verified

---

### Phase 9: Analytics, Testing & Cutover (6-8 hours)

**Goals:**
- Analytics working
- All features tested
- Express removed

**Analytics Reintegration:**
```typescript
// app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google';
import { FacebookPixel } from '@/components/FacebookPixel';
import { MicrosoftClarity } from '@/components/MicrosoftClarity';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID!} />
      </head>
      <body>
        {children}
        <FacebookPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID!} />
        <MicrosoftClarity projectId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID!} />
      </body>
    </html>
  );
}
```

**Testing Checklist:**
- [ ] All 52 pages load correctly
- [ ] All 120+ API routes respond
- [ ] All 14 schedulers running
- [ ] All 3 webhooks verified
- [ ] Phone tracking working
- [ ] ServiceTitan OAuth working
- [ ] Customer portal working
- [ ] Admin dashboard working
- [ ] Contact forms submitting
- [ ] Blog posts displaying
- [ ] Store (Ecwid) embedded
- [ ] SEO metadata correct
- [ ] Analytics firing
- [ ] Page speed > 90
- [ ] Mobile responsive
- [ ] Cross-browser (Chrome, Safari, Firefox)
- [ ] No console errors
- [ ] No TypeScript errors

**Load Testing:**
- [ ] Homepage: 100 req/s sustained
- [ ] API routes: < 500ms response
- [ ] Database queries optimized
- [ ] Image serving cached

**48-Hour Monitoring:**
- [ ] All schedulers executing
- [ ] No errors in worker logs
- [ ] No errors in Next.js logs
- [ ] Email sends working
- [ ] SMS sends working
- [ ] Webhooks processing

**Cutover Plan:**
1. Set up Procfile
2. Deploy Next.js + worker.ts to Replit
3. Switch port 5000 to Next.js
4. Monitor for 24 hours
5. Remove Express code

**Deliverables:**
- ✅ All tests passing
- ✅ 48-hour stability verified
- ✅ Express removed
- ✅ Production launched

---

## Testing Strategy

### Unit Tests
```typescript
// __tests__/api/contact.test.ts
import { POST } from '@/app/api/contact/route';

describe('POST /api/contact', () => {
  it('should submit contact form', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        phone: '512-555-1234',
        message: 'Test message',
      }),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
```

### Integration Tests
```typescript
// __tests__/integration/phone-tracking.test.ts
describe('Phone Tracking Integration', () => {
  it('should track UTM source and display correct number', async () => {
    const response = await fetch('/api/tracking-numbers?utm_source=google&utm_medium=cpc');
    const data = await response.json();
    expect(data.displayNumber).toBe('(512) 859-5701'); // Google Ads number
  });
});
```

### E2E Tests (Playwright)
```typescript
// e2e/contact-form.spec.ts
import { test, expect } from '@playwright/test';

test('contact form submission', async ({ page }) => {
  await page.goto('/contact');
  await page.fill('[data-testid="input-name"]', 'Test User');
  await page.fill('[data-testid="input-email"]', 'test@example.com');
  await page.fill('[data-testid="input-phone"]', '512-555-1234');
  await page.fill('[data-testid="input-message"]', 'Test message');
  await page.click('[data-testid="button-submit"]');
  
  await expect(page.locator('[data-testid="text-success"]')).toBeVisible();
});
```

### Performance Tests
```bash
# Lighthouse CI
npx lhci autorun --collect.url=https://www.plumbersthatcare.com --assert.assertions.categories:performance=0.9

# Load testing with autocannon
npx autocannon -c 100 -d 30 https://www.plumbersthatcare.com
```

---

## Risk Mitigation

### High Risk Items

#### 1. Scheduler Reliability
**Risk:** Worker.ts crashes and schedulers stop
**Mitigation:**
- Health monitoring with database pings
- Admin alert on worker failure
- Graceful restart via PM2 or Replit's process management
- Comprehensive error handling in every job
- Dead letter queue for failed jobs

#### 2. Webhook Compatibility
**Risk:** Next.js handles webhooks differently than Express
**Mitigation:**
- Test with actual webhook payloads
- Signature verification tests
- Mailgun multipart tested with real emails
- Stripe raw body tested with test mode
- Resend webhooks tested with test events
- Logging every webhook attempt

#### 3. ServiceTitan OAuth
**Risk:** Token refresh fails during migration
**Mitigation:**
- Store tokens in database (already done)
- Test refresh flow before cutover
- Implement retry logic
- Alert on OAuth failures

#### 4. SEO Disruption
**Risk:** URL changes or metadata loss
**Mitigation:**
- Preserve all URLs exactly
- Test all 60+ redirects
- Verify metadata on every page
- Submit new sitemap to Google
- Monitor Search Console

#### 5. Data Loss During Migration
**Risk:** Database changes cause data loss
**Mitigation:**
- NO schema changes during migration
- Use existing database as-is
- Database backup before cutover
- Rollback plan ready

### Medium Risk Items

#### 6. Image Serving
**Risk:** Object storage paths break
**Mitigation:**
- Test all image URLs
- Preserve legacy /attached_assets routes
- Verify object storage routes
- Test CompanyCam integration

#### 7. Analytics Tracking
**Risk:** Conversion tracking breaks
**Mitigation:**
- Test GA4 events
- Test Meta Pixel events
- Test form submissions
- Test phone click tracking

---

## Rollback Plan

### If Critical Issues Arise

**Scenario 1: Worker.ts fails to start**
- Keep Express running on port 5001
- Proxy scheduler health checks
- Fix worker and redeploy
- Time to recover: 1 hour

**Scenario 2: API routes have bugs**
- Deploy fixes incrementally
- Route-by-route testing
- Use feature flags
- Time to recover: 2-4 hours

**Scenario 3: Complete failure**
- Revert to Express entirely
- Next.js stays on port 3000 (development)
- Fix issues offline
- Redeploy when ready
- Time to recover: 24 hours

### Incremental Cutover Strategy

**Week 1: Soft Launch**
- Deploy Next.js to port 3000
- Express stays on port 5000 (production)
- Internal team tests Next.js
- Fix bugs

**Week 2: Admin First**
- Move admin dashboard to Next.js
- Public site still Express
- Test admin workflows

**Week 3: Public Beta**
- Next.js on port 5000
- Express on port 5001 (backup)
- Monitor errors
- Rollback if needed

**Week 4: Full Cutover**
- Next.js primary
- Worker.ts running
- Express removed

---

## Success Criteria

### Performance Metrics
- [ ] Homepage loads in < 2 seconds
- [ ] Lighthouse score > 90
- [ ] API response time < 500ms
- [ ] No layout shift (CLS < 0.1)
- [ ] All images WebP optimized
- [ ] Bundle size < 200KB (first load)

### SEO Metrics
- [ ] All meta tags preserved
- [ ] OpenGraph working
- [ ] JSON-LD valid
- [ ] Sitemap generates
- [ ] No broken redirects
- [ ] Google Search Console clean

### Functionality Metrics
- [ ] 52 pages working
- [ ] 120+ API routes working
- [ ] 14 schedulers running
- [ ] 3 webhooks verified
- [ ] Phone tracking accurate
- [ ] ServiceTitan OAuth working
- [ ] Customer portal working
- [ ] Admin dashboard working

### Quality Metrics
- [ ] 0 TypeScript errors
- [ ] 0 console errors
- [ ] Mobile responsive
- [ ] Cross-browser compatible
- [ ] WCAG AA accessible
- [ ] Test coverage > 80%

---

## Timeline Summary (REVISED)

| Phase | Description | Hours | Dependencies |
|-------|-------------|-------|--------------|
| 1 | Infrastructure & Worker | 6-8 | None |
| 2 | Middleware & Global | 4-5 | Phase 1 |
| 3 | Core API Routes | 10-12 | Phase 1, 2 |
| 4 | Background Schedulers | 6-8 | Phase 1, 3 |
| 5 | Public Pages & SEO | 8-10 | Phase 3 |
| 6 | Customer Portal | 4-5 | Phase 3 |
| 7 | Admin Dashboard | 10-12 | Phase 3 |
| 8 | Object Storage & AI | 4-5 | Phase 3 |
| 9 | Analytics & Cutover | 6-8 | All |
| **TOTAL** | **Full Migration** | **~60 hours** | **2 weeks** |

**Note:** 60 hours = 1.5 weeks at 40 hours/week OR 2 weeks with testing buffer

---

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set
- [ ] Database backup created
- [ ] Procfile configured
- [ ] Package.json scripts updated
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint errors

### Deployment Steps
1. [ ] Push code to Replit
2. [ ] Run `npm install`
3. [ ] Run `npm run build`
4. [ ] Set up Procfile processes
5. [ ] Start worker.ts
6. [ ] Start Next.js
7. [ ] Verify both processes running
8. [ ] Test homepage loads
9. [ ] Test API routes
10. [ ] Test webhooks
11. [ ] Monitor logs

### Post-Deployment
- [ ] Monitor worker health (24 hours)
- [ ] Monitor API errors (24 hours)
- [ ] Verify schedulers running (48 hours)
- [ ] Check email sends
- [ ] Check SMS sends
- [ ] Verify analytics firing
- [ ] Test customer portal
- [ ] Test admin dashboard

---

## Questions to Resolve

Before starting, we need to clarify:

1. **Secrets:** Do we have all API keys ready?
   - [ ] RESEND_API_KEY
   - [ ] OPENAI_API_KEY
   - [ ] GOOGLE_CLIENT_ID
   - [ ] GOOGLE_CLIENT_SECRET

2. **Testing:** Can you help test features as completed?
   - [ ] Customer portal (need ServiceTitan access)
   - [ ] Admin dashboard (need admin login)
   - [ ] Webhooks (need test events)

3. **Downtime:** Can we have brief downtime during final cutover?
   - [ ] Estimated: 15-30 minutes

4. **Timeline:** Full sprint (2 weeks) or phased (1 phase per week)?
   - [ ] Option A: Full sprint (60 hours over 2 weeks)
   - [ ] Option B: Phased (8 hours per week over 7-8 weeks)

---

## Conclusion

This is a **substantial but achievable migration** requiring **60 hours** of focused engineering work.

**Key Success Factors:**
1. Worker.ts for reliable background jobs
2. Comprehensive testing at every phase
3. Incremental cutover with rollback plan
4. API routes before pages
5. Thorough webhook testing

**Ready to begin!** Let me know your preferred timeline and I'll start with Phase 1.
