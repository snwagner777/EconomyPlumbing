# Complete Next.js 15 Migration Roadmap
## Economy Plumbing Services

**Migration Goal:** Replace Express/Vite entirely with Next.js 15 App Router while preserving ALL functionality.

**Status:** Architectural planning complete, ready for implementation

---

## Executive Summary

### Current Architecture (Express/Vite/React)
- **Backend:** Express.js server with 10,837 lines in routes.ts
- **Frontend:** React 18 + Vite with 50+ pages
- **Background Jobs:** 14 schedulers running via `setInterval`
- **Webhooks:** Mailgun, Resend, ServiceTitan
- **Port:** 5000 (single process)

### Target Architecture (Next.js 15)
- **Web Server:** Next.js 15 App Router (pages + API routes)
- **Background Jobs:** Separate `worker.ts` process (runs alongside Next.js)
- **Deployment:** Dual-process via Procfile or PM2
- **Port:** Next.js on 5000, worker runs independently

### Why This Matters
- **Performance:** Next.js App Router with React Server Components
- **SEO:** Built-in metadata API, better static optimization
- **DX:** Type-safe Server Actions, simplified data fetching
- **Reliability:** Decoupled workers ensure schedulers survive Next.js restarts

### Realistic Timeline
**Estimated Total:** 15-20 hours of focused development work

---

## Complete Inventory

### 1. Frontend Pages (50+ pages)

#### Public Marketing Pages
- [x] Homepage (placeholder exists)
- [ ] Homepage - **NEEDS REAL CONTENT**: Hero image, 7 service cards with images, testimonials section, Google reviews, contact form, "Why Choose Us", service areas, SMS widget
- [ ] `/services` - Main services listing
- [ ] `/services/water-heater-services` - Water heater repairs & installation
- [ ] `/services/drain-cleaning` - Drain cleaning & hydro jetting
- [ ] `/services/leak-detection` - Leak detection services
- [ ] `/services/gas-line-services` - Gas line repairs
- [ ] `/services/sewer-repair` - Sewer line services
- [ ] `/services/repiping` - Whole home repiping
- [ ] `/services/hydro-jetting-services` - Hydro jetting
- [ ] `/services/emergency-plumbing` - 24/7 emergency services
- [ ] `/about` - About the company
- [ ] `/contact` - Contact page with form
- [ ] `/faq` - Frequently asked questions
- [ ] `/privacy-policy` - Privacy policy
- [ ] `/terms-of-service` - Terms of service
- [ ] `/membership-benefits` - VIP membership info

#### Service Area Pages (15+ cities)
- [ ] `/service-areas` - All service areas listing
- [ ] `/service-areas/austin-tx` - Austin
- [ ] `/service-areas/marble-falls-tx` - Marble Falls
- [ ] `/service-areas/lakeway-tx` - Lakeway
- [ ] `/service-areas/bee-cave-tx` - Bee Cave
- [ ] `/service-areas/dripping-springs-tx` - Dripping Springs
- [ ] `/service-areas/spicewood-tx` - Spicewood
- [ ] `/service-areas/horseshoe-bay-tx` - Horseshoe Bay
- [ ] `/service-areas/burnet-tx` - Burnet
- [ ] `/service-areas/bertram-tx` - Bertram
- [ ] `/service-areas/kingsland-tx` - Kingsland
- [ ] `/service-areas/round-mountain-tx` - Round Mountain
- [ ] `/service-areas/buchanan-dam-tx` - Buchanan Dam
- [ ] `/service-areas/tow-tx` - Tow
- [ ] `/service-areas/llano-tx` - Llano
- [ ] `/service-areas/fredericksburg-tx` - Fredericksburg

#### Blog Pages
- [ ] `/blog` - Blog listing with pagination
- [ ] `/blog/[slug]` - Individual blog posts (dynamic route)
- [ ] Blog admin (create, edit, publish, AI generation)

#### Commercial Pages
- [ ] `/commercial-plumbing` - Commercial services overview
- [ ] `/commercial-plumbing/restaurants` - Restaurant plumbing
- [ ] `/commercial-plumbing/retail` - Retail plumbing
- [ ] `/commercial-plumbing/offices` - Office building plumbing
- [ ] `/commercial-plumbing/healthcare` - Healthcare facility plumbing
- [ ] `/commercial-plumbing/hospitality` - Hotel/hospitality plumbing

#### E-commerce
- [ ] `/store` - Ecwid integration (embedded)
- [ ] `/store/[product-slug]` - Individual products

#### Interactive Tools
- [ ] `/water-heater-cost-calculator` - Cost calculator
- [ ] `/water-heater-guide` - Interactive guide

#### Seasonal Landing Pages
- [ ] `/winter-plumbing-tips` - Winter prep
- [ ] `/summer-plumbing-tips` - Summer prep

#### Customer Portal (ServiceTitan Integration)
- [ ] `/customer-portal` - Dashboard
- [ ] `/customer-portal/login` - Phone/email verification
- [ ] `/customer-portal/jobs` - Job history
- [ ] `/customer-portal/invoices` - Invoice downloads

#### Admin Dashboard
- [ ] `/admin` - Unified admin dashboard (9,000+ lines)
- [ ] `/admin/marketing` - Marketing automation control
- [ ] `/admin/phone-tracking` - Campaign phone numbers
- [ ] `/admin/metadata` - SEO metadata management
- [ ] `/admin/commercial-customers` - Commercial customer photos
- [ ] `/admin/reviews` - Review management
- [ ] `/admin/referrals` - Referral system
- [ ] `/admin/blog` - Blog management
- [ ] `/admin/servicetitan-sync` - ServiceTitan sync monitoring
- [ ] `/admin/sms` - SMS marketing campaigns
- [ ] `/admin/reputation` - Reputation management

### 2. API Routes (100+ endpoints)

#### Contact & Forms
- `POST /api/contact` - Contact form submission
- `POST /api/success-stories` - Customer story submission

#### Google Reviews
- `GET /api/google-reviews` - Fetch reviews
- `GET /api/google-reviews/random` - Random review
- `POST /api/google-reviews/refresh` - Manual refresh
- `GET /api/google-reviews/stats` - Review statistics

#### Google My Business
- `POST /api/gmb/auth` - OAuth authorization
- `GET /api/gmb/reviews` - Fetch GMB reviews
- `POST /api/gmb/automation/start` - Start automation
- `POST /api/gmb/automation/stop` - Stop automation
- `GET /api/gmb/automation/status` - Check status

#### Facebook Reviews
- `POST /api/facebook/reviews/refresh` - Refresh reviews

#### Blog Management
- `GET /api/blog/posts` - List blog posts
- `GET /api/blog/posts/:id` - Get single post
- `POST /api/blog/posts` - Create post
- `PUT /api/blog/posts/:id` - Update post
- `DELETE /api/blog/posts/:id` - Delete post
- `POST /api/blog/generate` - AI blog generation
- `POST /api/blog/regenerate/:id` - Regenerate post
- `POST /api/blog/upload-image` - Upload blog image

#### Products/Store
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Stripe Integration
- `POST /api/stripe/create-checkout-session` - Create checkout
- `POST /api/stripe/webhook` - Stripe webhooks

#### ServiceTitan Integration
- `GET /api/servicetitan/oauth/authorize` - OAuth start
- `GET /api/servicetitan/oauth/callback` - OAuth callback
- `POST /api/servicetitan/oauth/refresh` - Refresh token
- `GET /api/servicetitan/customers/:id/jobs` - Customer jobs
- `POST /api/servicetitan/sync` - Manual sync

#### Customer Portal
- `POST /api/customer-portal/login` - Send verification code
- `POST /api/customer-portal/verify` - Verify code
- `GET /api/customer-portal/customer` - Get customer data
- `GET /api/customer-portal/jobs` - Get job history
- `GET /api/customer-portal/invoices/:id` - Download invoice

#### Marketing Automation
- `GET /api/marketing/campaigns` - List campaigns
- `POST /api/marketing/campaigns` - Create campaign
- `PUT /api/marketing/campaigns/:id` - Update campaign
- `DELETE /api/marketing/campaigns/:id` - Delete campaign
- `POST /api/marketing/campaigns/:id/preview` - Preview email
- `POST /api/marketing/campaigns/:id/approve` - Approve campaign
- `GET /api/marketing/tracking-numbers` - Get tracking numbers

#### Review Requests
- `GET /api/review-requests` - List review requests
- `POST /api/review-requests` - Create request
- `GET /api/review-requests/stats` - Statistics

#### Referral System
- `GET /api/referrals` - List referrals
- `POST /api/referrals` - Submit referral
- `PUT /api/referrals/:id` - Update referral
- `GET /api/referrals/stats` - Statistics
- `POST /api/referrals/:id/validate` - Validate with ServiceTitan

#### SMS Marketing
- `GET /api/sms/campaigns` - List campaigns
- `POST /api/sms/campaigns` - Create campaign
- `POST /api/sms/campaigns/:id/send` - Send campaign
- `POST /api/sms/opt-out` - Handle opt-out

#### Metadata Management
- `GET /api/metadata` - Get all metadata
- `GET /api/metadata/:page` - Get page metadata
- `PUT /api/metadata/:page` - Update metadata

#### Commercial Customers
- `GET /api/commercial-customers` - List customers
- `GET /api/commercial-customers/:id` - Get customer
- `POST /api/commercial-customers/:id/photos` - Upload photos
- `GET /api/commercial-customers/:id/photos` - Get photos

#### Chatbot
- `POST /api/chatbot/message` - Send message
- `GET /api/chatbot/conversations` - List conversations
- `GET /api/chatbot/analytics` - Analytics

#### Object Storage
- `GET /public-objects/:filePath(*)` - Serve public files
- `GET /replit-objstore-:bucketId/public/:filePath(*)` - Object storage files

#### Dynamic Assets
- `GET /sitemap.xml` - Dynamic sitemap
- `GET /robots.txt` - Robots file

### 3. Background Schedulers (14 jobs)

All these need to move to `worker.ts`:

1. **reviewRequestScheduler** - Sends review request emails (every 30 min)
2. **referralNurtureScheduler** - Sends referral nurture emails (every 30 min)
3. **customCampaignScheduler** - Sends custom marketing campaigns (every 30 min)
4. **membershipSyncJob** - Syncs VIP memberships with Stripe (hourly)
5. **photoCleanupJob** - Cleans up old temporary photos (daily)
6. **dailyCompositeJob** - Daily aggregations and cleanup
7. **weeklyPostScheduler** - Social media posting (disabled currently)
8. **autoBlogGenerator** - AI blog generation (weekly)
9. **googleDriveMonitor** - Monitors for new photos (every 10 min)
10. **gmbAutomation** - Google My Business automation (hourly)
11. **serviceTitanSync** - ServiceTitan customer sync (hourly)
12. **referralProcessor** - Processes pending referrals (hourly)
13. **healthAlerterScheduler** - Health monitoring (every 5 min)
14. **webhookRetryProcessor** - Retries failed webhooks (every 5 min)

### 4. Webhooks (3 critical integrations)

#### Mailgun Webhook
- `POST /api/webhooks/mailgun/customer-data` - XLSX customer imports
- Critical: Must handle multipart/form-data with file attachments
- Security: Webhook signature verification

#### Resend Webhooks
- `POST /api/webhooks/resend` - Email engagement tracking
- Events: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
- Updates: emailSendLog, reviewRequests, referralNurtureCampaigns

#### ServiceTitan Webhook
- `POST /api/webhooks/servicetitan` - Job completion notifications
- Updates referral system when jobs complete

### 5. Middleware & Special Handling

#### Security Headers (CSP, HSTS, etc.)
```typescript
// Next.js middleware.ts
- Content-Security-Policy with Google/Meta/ServiceTitan domains
- HSTS: max-age=31536000
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy
```

#### 301 Redirects (60+ rules)
```typescript
// All old WordPress URLs, shop URLs, malformed URLs
// Must preserve for SEO
```

#### Domain Redirects
```typescript
// .replit.app → www.plumbersthatcare.com
```

#### Trailing Slash Normalization
```typescript
// /page/ → /page (301 redirect)
```

#### Metadata Injection (SSR)
```typescript
// Dynamic OpenGraph, JSON-LD schema
// Per-page metadata from database
```

### 6. Critical Features to Preserve

#### Dynamic Phone Number Tracking
- PhoneConfigProvider context
- Cookie-based source tracking (90 days)
- UTM parameter detection
- Campaign-specific numbers
- Email campaign tracking
- Falls back gracefully

#### ServiceTitan Integration
- OAuth 2.0 flow
- Token refresh
- Customer lookup
- Job history
- Invoice downloads
- Scheduler widget integration

#### SEO Features
- Per-page metadata (title, description, keywords)
- OpenGraph tags (og:title, og:description, og:image)
- JSON-LD schema (LocalBusiness, Service, FAQ, etc.)
- Dynamic sitemap.xml
- Canonical URLs
- Breadcrumbs

#### Image Optimization
- CompanyCam integration
- Google Drive monitoring
- Sharp image processing
- WebP conversion
- Focal point detection (AI)
- Metadata extraction
- Object storage caching

#### Marketing Automation
- AI customer segmentation (GPT-4o)
- Email template generation
- Campaign preview/approval workflow
- Suppression list (CAN-SPAM)
- Engagement tracking
- Auto-pause on unopened emails

#### Email Preference Center
- Granular subscription management
- Token-based public UI
- Category-specific opt-outs
- One-click unsubscribe

---

## Migration Strategy

### Architectural Decision: Dual-Process Model

**Why not keep schedulers in Next.js?**
- Next.js is serverless-first; processes can restart anytime
- `setInterval` jobs would be unreliable
- Replit's infrastructure works best with dedicated worker processes

**Solution:**
```
┌─────────────────┐     ┌─────────────────┐
│   Next.js       │     │   worker.ts     │
│   (Port 5000)   │     │   (background)  │
├─────────────────┤     ├─────────────────┤
│ - Pages         │     │ - 14 schedulers │
│ - API routes    │     │ - Health checks │
│ - Webhooks      │     │ - Shared DB     │
│ - Server Actions│     │ - Error alerts  │
└─────────────────┘     └─────────────────┘
```

### Deployment via Procfile
```
web: npm run start:next
worker: npm run start:worker
```

---

## Phased Migration Plan

### Phase 1: Foundations (2-3 hours)
**Goal:** Set up shared infrastructure

- [x] Next.js 15 project structure ✅
- [x] Tailwind + shadcn/ui ✅
- [x] Database connection ✅
- [ ] Audit shared schema types
- [ ] Create worker.ts bootstrap
- [ ] Asset migration strategy (attached_assets → public/)
- [ ] Set up environment variables
- [ ] Database migration safety checks

**Deliverables:**
- `worker.ts` running alongside Next.js
- Shared utilities in `/lib`
- Asset strategy documented

---

### Phase 2: Platform Setup (1-2 hours)
**Goal:** Middleware and global behavior

- [ ] Next.js middleware.ts
  - Security headers (CSP, HSTS, etc.)
  - 301 redirects (60+ rules)
  - Domain redirects
  - Trailing slash normalization
- [ ] Root layout improvements
- [ ] Error pages (404, 500)
- [ ] Loading states

**Deliverables:**
- All redirects working
- Security headers matching Express
- Error handling

---

### Phase 3: Core Public Pages & SEO (3-4 hours)
**Goal:** Marketing site visible and SEO-optimized

#### Homepage
- [ ] Hero with real background image
- [ ] 7 service cards with images
- [ ] Testimonials section
- [ ] Google reviews display
- [ ] Contact form
- [ ] "Why Choose Us" section
- [ ] Service areas footer
- [ ] SMS widget integration

#### Other Public Pages
- [ ] Services pages (9 services)
- [ ] Service area pages (15 cities)
- [ ] About, Contact, FAQ
- [ ] Privacy Policy, Terms
- [ ] Membership Benefits

#### SEO Implementation
- [ ] Metadata API (app router)
- [ ] OpenGraph tags
- [ ] JSON-LD schemas
- [ ] Dynamic sitemap.xml
- [ ] Robots.txt

**Deliverables:**
- All public pages live
- SEO metadata working
- Page speed targets met

---

### Phase 4: Essential API Routes (2-3 hours)
**Goal:** Critical functionality working

- [ ] Contact form submission
- [ ] Google Reviews API
- [ ] Phone tracking numbers API
- [ ] Metadata management API
- [ ] Blog posts API
- [ ] Products API
- [ ] Health check endpoints

**Deliverables:**
- Contact forms working
- Phone tracking functional
- Review display working

---

### Phase 5: Admin Areas (3-4 hours)
**Goal:** Admin dashboard operational

- [ ] Admin authentication (OAuth)
- [ ] Unified admin shell/layout
- [ ] Phone tracking management
- [ ] Metadata editor
- [ ] Blog admin
- [ ] Commercial customer photos
- [ ] Review management
- [ ] Referral management

**Deliverables:**
- Admin can manage content
- All admin features preserved

---

### Phase 6: Integrations & Webhooks (2-3 hours)
**Goal:** External integrations working

#### Webhooks
- [ ] Mailgun webhook (multipart/form-data)
- [ ] Resend webhooks (email tracking)
- [ ] ServiceTitan webhook
- [ ] Stripe webhook

#### ServiceTitan OAuth
- [ ] Authorization flow
- [ ] Token refresh
- [ ] Customer portal integration

**Deliverables:**
- All webhooks verified
- Customer portal working
- ServiceTitan integration live

---

### Phase 7: Background Automation (2-3 hours)
**Goal:** All schedulers running in worker.ts

- [ ] Worker bootstrap architecture
- [ ] Health monitoring system
- [ ] Review request scheduler
- [ ] Referral nurture scheduler
- [ ] Custom campaign scheduler
- [ ] Membership sync
- [ ] Photo cleanup
- [ ] Google Drive monitor
- [ ] GMB automation
- [ ] ServiceTitan sync
- [ ] Blog automation
- [ ] Webhook retry processor

**Deliverables:**
- worker.ts running all 14 jobs
- Health dashboard showing status
- Logs and alerts working

---

### Phase 8: Advanced Features (2-3 hours)
**Goal:** Premium features operational

- [ ] Object storage serving
- [ ] Image processing (sharp)
- [ ] AI blog generation (OpenAI)
- [ ] AI photo analysis
- [ ] AI email generation
- [ ] Marketing automation system
- [ ] SMS marketing
- [ ] Reputation management

**Deliverables:**
- All AI features working
- Image optimization working
- Marketing automation functional

---

### Phase 9: QA & Cutover (1-2 hours)
**Goal:** Production ready

- [ ] End-to-end testing
- [ ] Load testing
- [ ] Page speed verification
- [ ] SEO audit
- [ ] Mobile testing
- [ ] Cross-browser testing
- [ ] 48-hour scheduler monitoring
- [ ] Remove Express entirely
- [ ] Deploy Next.js + worker.ts

**Deliverables:**
- Express removed
- Next.js on port 5000
- All features verified
- Performance targets met

---

## Testing Strategy

### Unit Tests
- Critical utilities
- Phone tracking logic
- Email template generation

### Integration Tests
- API route parity
- Webhook handling
- Database operations

### E2E Tests
- Contact form submission
- Customer portal flow
- Admin workflows
- Review request flow

### Performance Tests
- Page load times (< 2s)
- API response times (< 500ms)
- Image optimization
- Bundle size analysis

### Scheduler Tests
- Run for 48 hours
- Verify all jobs execute
- Check error handling
- Validate email sends

---

## Risk Assessment

### High Risk
1. **Scheduler reliability** - New worker.ts architecture
   - Mitigation: Health monitoring, alerting, 48-hour test
2. **Webhook compatibility** - Different framework
   - Mitigation: Signature verification, thorough testing
3. **SEO disruption** - URL changes
   - Mitigation: Preserve all URLs, test redirects

### Medium Risk
1. **ServiceTitan OAuth** - Token handling
   - Mitigation: Test refresh flow
2. **Data migration** - Schema changes
   - Mitigation: Use existing DB, no schema changes
3. **Image serving** - Object storage paths
   - Mitigation: Test all image URLs

### Low Risk
1. **UI components** - Already using React
2. **Database** - Same Neon/Drizzle setup
3. **Styling** - Tailwind works identically

---

## Success Criteria

### Performance
- [ ] Homepage loads in < 2 seconds
- [ ] Lighthouse score > 90
- [ ] All images optimized (WebP)
- [ ] No layout shift (CLS < 0.1)

### SEO
- [ ] All meta tags preserved
- [ ] OpenGraph working
- [ ] JSON-LD schemas valid
- [ ] Sitemap generates correctly
- [ ] No broken redirects

### Functionality
- [ ] All 50+ pages working
- [ ] All 100+ API endpoints working
- [ ] All 14 schedulers running
- [ ] All 3 webhooks verified
- [ ] Admin dashboard fully functional
- [ ] Customer portal working
- [ ] Phone tracking accurate

### Quality
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Cross-browser compatible
- [ ] Accessibility (WCAG AA)

---

## Rollback Plan

### If Issues Arise
1. Keep Express running on different port
2. Use Nginx/reverse proxy to route selectively
3. Gradual cutover (admin first, then public)
4. Monitor error rates
5. Rollback capability within 1 hour

### Emergency Contacts
- Replit support for infrastructure
- ServiceTitan support for API issues
- Resend support for email delivery

---

## Timeline Summary

| Phase | Description | Hours | Priority |
|-------|-------------|-------|----------|
| 1 | Foundations | 2-3 | CRITICAL |
| 2 | Platform Setup | 1-2 | CRITICAL |
| 3 | Public Pages & SEO | 3-4 | HIGH |
| 4 | Essential APIs | 2-3 | HIGH |
| 5 | Admin Areas | 3-4 | MEDIUM |
| 6 | Integrations | 2-3 | HIGH |
| 7 | Schedulers | 2-3 | CRITICAL |
| 8 | Advanced Features | 2-3 | MEDIUM |
| 9 | QA & Cutover | 1-2 | CRITICAL |
| **TOTAL** | **Full Migration** | **15-20** | - |

---

## Next Steps

### Option A: Full Sprint (15-20 hours)
Commit to full migration. Estimated completion: 2-3 work days.

### Option B: Phased Approach (2-4 hours per phase)
Migrate one phase at a time. Get approval between phases.

### Option C: High-Priority Features First
Focus on visible improvements:
1. Homepage with real content (1 hour)
2. Essential API routes (2 hours)
3. Admin dashboard (3 hours)

---

## Questions for You

Before starting, I need clarity on:

1. **Urgency:** Do you want this done ASAP or phased over weeks?
2. **Priority:** What's most important - public site, admin, or automation?
3. **Testing:** Can you help test features as I complete them?
4. **Downtime:** Can we have brief downtime during cutover?

---

## Current State vs Target

### Express (Current)
```
server/index.ts (582 lines)
  ├── 14 schedulers via setInterval
  ├── Middleware stack
  └── Routes registration

server/routes.ts (10,837 lines)
  ├── 100+ API endpoints
  ├── File uploads
  ├── Webhooks
  └── Public file serving

client/src/ (React/Vite)
  ├── 50+ pages
  └── Vite dev server
```

### Next.js (Target)
```
app/
  ├── (public)/[50 pages]
  ├── (admin)/[admin pages]
  ├── (customer)/portal pages
  └── api/[100+ routes]

worker.ts
  ├── 14 schedulers
  ├── Health monitoring
  └── Shared DB access

next.config.ts
  ├── Rewrites
  ├── Redirects
  └── Headers
```

---

## Dependencies Checklist

### External Services (Already Configured)
- [x] Neon PostgreSQL
- [x] Resend (email)
- [x] OpenAI (AI)
- [x] Stripe (payments)
- [x] ServiceTitan (scheduling)
- [x] Google Drive (photos)
- [x] CompanyCam (photos)
- [x] Mailgun (webhooks)
- [x] Twilio (SMS)
- [x] Google Analytics
- [x] Meta Pixel

### Secrets Required
- [x] DATABASE_URL
- [ ] RESEND_API_KEY (needs setup)
- [ ] OPENAI_API_KEY (needs setup)
- [x] STRIPE_SECRET_KEY
- [x] SERVICETITAN_CLIENT_ID
- [x] SERVICETITAN_CLIENT_SECRET
- [ ] GOOGLE_CLIENT_ID (needs setup)
- [ ] GOOGLE_CLIENT_SECRET (needs setup)
- [x] TWILIO credentials
- [x] MAILGUN credentials

---

## File Structure Comparison

### Before (Express)
```
server/
  ├── index.ts (main server)
  ├── routes.ts (all routes)
  ├── storage.ts (database)
  ├── lib/
  │   ├── [14 scheduler files]
  │   ├── [integration files]
  │   └── [utility files]
  └── webhooks/

client/
  └── src/
      ├── pages/[50+ pages]
      ├── components/
      └── lib/
```

### After (Next.js)
```
app/
  ├── (public)/
  │   ├── page.tsx (home)
  │   ├── services/
  │   ├── blog/
  │   └── [more pages]
  ├── (admin)/
  │   ├── layout.tsx
  │   └── [admin pages]
  ├── (customer)/
  │   └── [portal pages]
  └── api/
      ├── contact/route.ts
      ├── reviews/route.ts
      └── [100+ routes]

worker.ts (background jobs)

src/
  ├── components/
  ├── lib/
  │   ├── db.ts
  │   ├── schedulers/
  │   └── integrations/
  └── middleware.ts
```

---

## Conclusion

This is a substantial but achievable migration. The dual-process architecture (Next.js + worker.ts) ensures we preserve all functionality while modernizing the stack.

**Recommended Approach:** Phased migration with testing between each phase.

**Ready when you are!** Let me know which option you prefer and I'll begin.
