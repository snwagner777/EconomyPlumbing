# Route Migration Audit
## Express → Next.js 15 Migration Verification

**Date:** October 29, 2025  
**Status:** IN PROGRESS - Systematic Verification

---

## Audit Process

### Step 1: Extract All Express Routes ✅
- Found 200+ routes in `server/routes.ts`
- Routes include: public pages, API endpoints, admin routes, webhooks

### Step 2: Verify Next.js Routes (IN PROGRESS)

---

## Public Pages Verification

### Core Pages
| Express Route | Next.js Page | Status | Notes |
|--------------|--------------|--------|-------|
| GET / | app/(public)/page.tsx | ✅ | Homepage |
| GET /about | app/about/page.tsx | ✅ | About page |
| GET /services | app/services/page.tsx | ✅ | Services page |
| GET /blog | app/blog/page.tsx | ✅ | Blog listing |
| GET /blog/:slug | app/blog/[slug]/page.tsx | ✅ | Blog post detail |
| GET /contact | app/contact/page.tsx | ✅ | Contact page |
| GET /faq | app/faq/page.tsx | ✅ | FAQ page |
| GET /store | app/store/page.tsx | ✅ | Product store |
| GET /store/checkout/:slug | app/store/checkout/[slug]/page.tsx | ✅ | Checkout |
| GET /store/checkout/success | app/store/checkout/success/page.tsx | ✅ | Success |

### Service Area Pages
| Express Route | Next.js Page | Status | Notes |
|--------------|--------------|--------|-------|
| GET /service-areas | app/service-areas/page.tsx | ✅ | All areas |
| GET /service-areas/:slug | app/service-areas/[slug]/page.tsx | ✅ | Specific area |
| GET /plumber-cedar-park--tx | app/plumber-in-cedar-park--tx/page.tsx | ✅ | Cedar Park |
| GET /plumber-round-rock | app/round-rock-plumber/page.tsx | ✅ | Round Rock |
| GET /plumber-leander | app/plumber-leander/page.tsx | ✅ | Leander |

### Service Pages
| Express Route | Next.js Page | Status | Notes |
|--------------|--------------|--------|-------|
| GET /water-heater-services | app/water-heater-services/page.tsx | ✅ | Water heater |
| GET /drain-cleaning-services | app/drain-cleaning-services/page.tsx | ✅ | Drain cleaning |
| GET /hydro-jetting-services | app/hydro-jetting-services/page.tsx | ✅ | Hydro jetting |
| GET /emergency-plumbing | app/emergency-plumbing/page.tsx | ✅ | Emergency |
| GET /sewer-line-repair | app/sewer-line-repair/page.tsx | ✅ | Sewer line |
| GET /gas-line-services | app/gas-line-services/page.tsx | ✅ | Gas line |

### Commercial Pages
| Express Route | Next.js Page | Status | Notes |
|--------------|--------------|--------|-------|
| GET /commercial-plumbing | app/commercial-plumbing/page.tsx | ✅ | Main commercial |
| GET /commercial/restaurants | app/commercial/restaurants/page.tsx | ✅ | Restaurants |
| GET /commercial/office-buildings | app/commercial/office-buildings/page.tsx | ✅ | Office buildings |
| GET /commercial/retail | app/commercial/retail/page.tsx | ✅ | Retail |
| GET /commercial/property-management | app/commercial/property-management/page.tsx | ✅ | Property mgmt |

### Other Pages
| Express Route | Next.js Page | Status | Notes |
|--------------|--------------|--------|-------|
| GET /membership-benefits | app/membership-benefits/page.tsx | ✅ | VIP membership |
| GET /refer-a-friend | app/refer-a-friend/page.tsx | ✅ | Referral program |
| GET /success-stories | app/success-stories/page.tsx | ✅ | Success stories |
| GET /privacy-policy | app/privacy-policy/page.tsx | ✅ | Privacy |
| GET /terms-of-service | app/terms-of-service/page.tsx | ✅ | Terms |
| GET /customer-portal | app/customer-portal/page.tsx | ✅ | Portal home |
| GET /customer-portal/dashboard | app/customer-portal/dashboard/page.tsx | ✅ | Portal dashboard |

---

## API Routes Verification

### Authentication & Sessions
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| GET /api/oauth/login | app/api/oauth/login/route.ts | ✅ | OAuth initiation |
| GET /api/oauth/callback | app/api/oauth/callback/route.ts | ✅ | OAuth callback |
| GET /api/oauth/logout | app/api/oauth/logout/route.ts | ✅ | Logout |
| GET /api/health | app/api/health/route.ts | ✅ | Health check |

### Blog APIs
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| GET /api/blog | app/api/blog/route.ts | ⚠️ VERIFY | List posts |
| GET /api/blog/:slug | app/api/blog/[slug]/route.ts | ⚠️ VERIFY | Get post |
| POST /api/blog | ❌ MISSING | Create post |
| GET /api/blog/categories | ❌ MISSING | Get categories |
| GET /api/blog/available-photos | ❌ MISSING | Available photos |
| POST /api/blog/generate-historic-by-category | ❌ MISSING | Generate historic |
| POST /api/blog/process-image | ❌ MISSING | Process image |
| GET /api/blog/images/:encodedPath.jpg | ❌ MISSING | Blog image |
| GET /api/success-stories/images/:encodedPath.jpg | ❌ MISSING | Success story image |
| GET /api/blog/image-jpeg | ❌ MISSING | JPEG image |

### Products APIs
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| GET /api/products | app/api/products/route.ts | ⚠️ VERIFY | List products |
| GET /api/products/:slug | app/api/products/[slug]/route.ts | ⚠️ VERIFY | Get product |
| POST /api/products | ❌ MISSING | Create product |
| PATCH /api/products/:id | ❌ MISSING | Update product |

### Reviews APIs
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| GET /api/reviews | app/api/reviews/route.ts | ⚠️ VERIFY | List reviews |
| POST /api/reviews/submit | app/api/reviews/submit/route.ts | ⚠️ VERIFY | Submit review |
| POST /api/reviews/private-feedback | app/api/reviews/private-feedback/route.ts | ⚠️ VERIFY | Private feedback |
| POST /api/review-feedback | app/api/review-feedback/route.ts | ⚠️ VERIFY | Review feedback |

### Referrals APIs
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| POST /api/referrals/submit | app/api/referrals/submit/route.ts | ⚠️ VERIFY | Submit referral |
| GET /api/referrals/referrer/:customerId | app/api/referrals/referrer/[customerId]/route.ts | ⚠️ VERIFY | Get referrer |
| POST /api/referrals/capture-landing | app/api/referrals/capture-landing/route.ts | ⚠️ VERIFY | Capture landing |
| GET /api/referrals/code/:customerId | app/api/referrals/code/[customerId]/route.ts | ⚠️ VERIFY | Get code |
| POST /api/referrals/track-click | app/api/referrals/track-click/route.ts | ⚠️ VERIFY | Track click |
| POST /api/referrals/capture-referee | app/api/referrals/capture-referee/route.ts | ⚠️ VERIFY | Capture referee |
| GET /api/referrals/customer/:customerId | app/api/referrals/customer/[customerId]/route.ts | ⚠️ VERIFY | Get customer referrals |
| GET /api/referrals/leaderboard | app/api/referrals/leaderboard/route.ts | ⚠️ VERIFY | Leaderboard |
| GET /api/customers/leaderboard | ❌ MISSING | Customer leaderboard |

### Contact & Communication
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| POST /api/contact | app/api/contact/route.ts | ⚠️ VERIFY | Contact form |
| POST /api/otp/send | ❌ MISSING | Send OTP |
| POST /api/otp/verify | ❌ MISSING | Verify OTP |

### Service Areas
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| POST /api/service-areas | app/api/service-areas/route.ts | ⚠️ VERIFY | Create service area |

### Customer Portal APIs
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| POST /api/portal/auth/lookup-by-phone | app/api/portal/auth/lookup/route.ts | ⚠️ VERIFY | Lookup customer |
| POST /api/portal/auth/send-phone-magic-link | ❌ MISSING | Send magic link |
| POST /api/portal/auth/verify-account | ❌ MISSING | Verify account |
| GET /api/portal/session | app/api/portal/session/route.ts | ⚠️ VERIFY | Get session |
| POST /api/portal/logout | app/api/portal/auth/logout/route.ts | ⚠️ VERIFY | Logout |
| POST /api/portal/auth/send-code | app/api/portal/auth/send-code/route.ts | ⚠️ VERIFY | Send code |
| POST /api/portal/auth/verify-code | app/api/portal/auth/verify-code/route.ts | ⚠️ VERIFY | Verify code |
| POST /api/portal/switch-account | app/api/portal/switch-account/route.ts | ⚠️ VERIFY | Switch account |
| POST /api/portal/reschedule-appointment | ❌ MISSING | Reschedule |
| POST /api/portal/request-pdf | ❌ MISSING | Request PDF |

### ServiceTitan APIs
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| GET /api/servicetitan/arrival-windows | app/api/servicetitan/arrival-windows/route.ts | ⚠️ VERIFY | Arrival windows |
| GET /api/servicetitan/customer/search | ❌ MISSING | Customer search |
| GET /api/servicetitan/customer/:customerId | ❌ MISSING | Get customer |
| POST /api/servicetitan/sync-customers | ❌ MISSING | Sync customers |

### Admin APIs (Partial List - MANY MISSING)
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| GET /api/admin/sync-status | ❌ MISSING | Sync status |
| POST /api/admin/trigger-sync | ❌ MISSING | Trigger sync |
| POST /api/admin/servicetitan/sync-jobs | ❌ MISSING | Sync jobs |
| POST /api/admin/referrals/record-credit-usage | ❌ MISSING | Record credit |
| PATCH /api/admin/referrals/:referralId | app/api/admin/referrals/[id]/route.ts | ⚠️ VERIFY | Update referral |
| POST /api/admin/referrals/:referralId/issue-credit | ❌ MISSING | Issue credit |
| GET /api/admin/referral-stats | ❌ MISSING | Referral stats |
| GET /api/admin/customer-metrics | ❌ MISSING | Customer metrics |
| GET /api/admin/customer-imports | ❌ MISSING | Customer imports |
| GET /api/admin/top-customers | ❌ MISSING | Top customers |
| POST /api/conversions/track | ❌ MISSING | Track conversion |
| GET /api/admin/conversion-stats | ❌ MISSING | Conversion stats |
| GET /api/admin/customer-segments | ❌ MISSING | Get segments |
| POST /api/admin/customer-segments | ❌ MISSING | Create segment |
| GET /api/admin/customer-segments/:id | ❌ MISSING | Get segment |
| PUT /api/admin/customer-segments/:id | ❌ MISSING | Update segment |
| DELETE /api/admin/customer-segments/:id | ❌ MISSING | Delete segment |
| POST /api/admin/customer-segments/:id/members | ❌ MISSING | Add members |
| GET /api/admin/custom-campaigns | ❌ MISSING | Get campaigns |
| POST /api/admin/custom-campaigns | ❌ MISSING | Create campaign |
| GET /api/admin/custom-campaigns/:id | ❌ MISSING | Get campaign |
| PUT /api/admin/custom-campaigns/:id | ❌ MISSING | Update campaign |
| DELETE /api/admin/custom-campaigns/:id | ❌ MISSING | Delete campaign |
| POST /api/admin/custom-campaigns/:id/emails | ❌ MISSING | Add emails |
| POST /api/admin/generate-blog-post | app/api/admin/ai-blog/generate/route.ts | ⚠️ VERIFY | Generate blog |
| POST /api/admin/blog-posts/manual | ❌ MISSING | Manual blog post |

### Chatbot APIs
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| POST /api/chatbot | app/api/chatbot/route.ts | ⚠️ VERIFY | Chat message |
| GET /api/chatbot/conversation/:conversationId | app/api/chatbot/conversation/[conversationId]/route.ts | ⚠️ VERIFY | Get conversation |
| POST /api/chatbot/feedback | app/api/chatbot/feedback/route.ts | ⚠️ VERIFY | Submit feedback |
| POST /api/chatbot/end-conversation | app/api/chatbot/end-conversation/route.ts | ⚠️ VERIFY | End conversation |
| POST /api/chatbot/upload-image | app/api/chatbot/upload-image/route.ts | ⚠️ VERIFY | Upload image |

### Stripe APIs
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| POST /api/create-payment-intent/test | ❌ MISSING | Test payment |
| POST /api/create-payment-intent | app/api/stripe/create-checkout/route.ts | ⚠️ VERIFY | Create payment |

### Webhooks
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| POST /api/webhooks/stripe | app/api/webhooks/stripe/route.ts | ⚠️ VERIFY | Stripe webhook |
| POST /api/webhooks/resend | app/api/webhooks/resend/route.ts | ⚠️ VERIFY | Resend webhook |
| POST /api/webhooks/mailgun/customer-data | app/api/webhooks/mailgun/customer-data/route.ts | ⚠️ VERIFY | Mailgun webhook |

### Metadata & SEO
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| GET /api/page-metadata | app/api/page-metadata/route.ts | ⚠️ VERIFY | Page metadata |
| GET /sitemap.xml | app/sitemap.xml/route.ts | ❌ WRONG PATH | Should be /api/sitemap |
| GET /robots.txt | public/robots.txt (static) | ✅ | Static file |
| GET /rss.xml | ❌ MISSING | RSS feed |

### Object Storage
| Express Route | Next.js Route | Status | Notes |
|--------------|---------------|--------|-------|
| GET /public-objects/:filePath(*) | app/public-objects/[...filePath]/route.ts | ⚠️ VERIFY | Public objects |
| GET /replit-objstore-:bucketId/public/:filePath(*) | ❌ MISSING | Legacy objstore |
| GET /attached_assets/:filePath(*) | ❌ MISSING | Attached assets |

---

## Critical Issues Found

### 1. ❌ MANY Admin APIs Missing
- Customer segments (CRUD)
- Custom campaigns (CRUD)
- Customer metrics and stats
- ServiceTitan sync endpoints
- Referral management endpoints
- Blog management endpoints
- Conversion tracking

### 2. ❌ Blog APIs Incomplete
- Missing POST /api/blog (create)
- Missing category management
- Missing image processing routes
- Missing historic generation

### 3. ❌ Customer Portal APIs Incomplete
- Missing magic link authentication
- Missing account verification
- Missing appointment rescheduling
- Missing PDF generation

### 4. ❌ OTP/SMS APIs Missing
- Missing /api/otp/send
- Missing /api/otp/verify

### 5. ❌ ServiceTitan APIs Incomplete
- Missing customer search
- Missing customer sync
- Missing customer detail endpoint

### 6. ❌ Wrong Route Paths
- sitemap.xml at wrong location (should be API route, not metadata route)

---

## Next Steps

1. **PRIORITY 1: Verify All Existing Routes**
   - Read each Next.js route file
   - Compare implementation with Express version
   - Ensure identical functionality

2. **PRIORITY 2: Create Missing Admin APIs**
   - Customer segments CRUD
   - Custom campaigns CRUD  
   - All admin stats endpoints

3. **PRIORITY 3: Complete Missing APIs**
   - OTP/SMS endpoints
   - ServiceTitan endpoints
   - Blog management endpoints
   - Portal authentication endpoints

4. **PRIORITY 4: Fix Route Paths**
   - Move sitemap to proper location
   - Add legacy object storage rewrites

---

**Last Updated:** October 29, 2025  
**Status:** Audit in progress - found 50+ missing routes
