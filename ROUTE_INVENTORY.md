# Express to Next.js Route Inventory

**Generated:** October 28, 2025  
**Total Express Routes:** 212  
**Total Next.js Routes:** 85+  

---

## ✅ FULLY MIGRATED TO NEXT.JS

### Public User-Facing APIs
| Route | Status | Notes |
|-------|--------|-------|
| `/api/contact` (POST) | ✅ Migrated | Contact form submission with rate limiting |
| `/api/blog` (GET) | ✅ Migrated | Blog listing with pagination |
| `/api/blog/:slug` (GET) | ✅ Migrated | Individual blog posts |
| `/api/products` (GET) | ✅ Migrated | Product listing |
| `/api/products/:slug` (GET) | ✅ Migrated | Individual products |
| `/api/service-areas` (GET) | ✅ Migrated | Service area listing |
| `/api/service-areas/:slug` (GET) | ✅ Migrated | Individual service areas |
| `/api/reviews/feedback` (POST) | ✅ Migrated | Review submission |
| `/api/reviews/google` (GET) | ✅ Migrated | Google reviews fetching |
| `/api/reviews/google/stats` (GET) | ✅ Migrated | Google review statistics |
| `/api/referrals/submit` (POST) | ✅ Migrated | Referral submission |
| `/api/email-preferences` (GET/PUT) | ✅ Migrated | Email subscription management |
| `/api/email-preferences/unsubscribe` (POST) | ✅ Migrated | One-click unsubscribe |
| `/api/sms/subscribe` (POST) | ✅ Migrated | SMS signup |
| `/api/stripe/create-checkout` (POST) | ✅ Migrated | Stripe checkout sessions |
| `/api/sitemap.xml` (GET) | ✅ Migrated | Dynamic sitemap |
| `/robots.txt` (GET) | ✅ Migrated | Robots.txt |

### Customer Portal
| Route | Status | Notes |
|-------|--------|-------|
| `/api/customer-portal/account` (GET) | ✅ Migrated | Customer account info |
| `/api/customer-portal/jobs` (GET) | ✅ Migrated | Job history |
| `/api/customer-portal/memberships` (GET) | ✅ Migrated | Membership status |
| `/api/portal/auth/lookup` (POST) | ✅ Migrated | Customer lookup |
| `/api/portal/auth/verify-code` (POST) | ✅ Migrated | OTP verification |
| `/api/portal/auth/logout` (POST) | ✅ Migrated | Session logout |
| `/api/portal/customer/:id` (GET) | ✅ Migrated | Customer details |
| `/api/portal/session` (GET) | ✅ Migrated | Session check |

### Admin Dashboard
| Route | Status | Notes |
|-------|--------|-------|
| `/api/admin/stats` (GET) | ✅ Migrated | Dashboard statistics |
| `/api/admin/blog` (GET/POST) | ✅ Migrated | Blog management |
| `/api/admin/blog/:slug` (PATCH/DELETE) | ✅ Migrated | Blog CRUD |
| `/api/admin/photos` (GET) | ✅ Migrated | Photo management |
| `/api/admin/products` (GET/POST/PATCH) | ✅ Migrated | Product management |
| `/api/admin/review-requests` (GET) | ✅ Migrated | Review campaigns |
| `/api/admin/tracking-numbers` (GET/POST) | ✅ Migrated | Phone tracking |
| `/api/admin/email-templates` (GET/POST) | ✅ Migrated | Template management |
| `/api/admin/referral-campaigns` (GET) | ✅ Migrated | Referral nurture |
| `/api/admin/sms-campaigns` (GET/POST) | ✅ Migrated | SMS marketing |
| `/api/admin/google-reviews/sync` (POST) | ✅ Migrated | Manual review sync |
| `/api/admin/ai-blog/generate` (POST) | ✅ Migrated | AI blog generation |
| `/api/admin/email-campaigns/preview` (POST) | ✅ Migrated | Email preview |
| `/api/admin/contact-submissions` (GET) | ✅ Migrated | Contact form data |
| `/api/admin/upload-logo` (POST) | ✅ Migrated | Logo uploads |
| `/api/admin/settings` (GET/PUT) | ✅ Migrated | System settings |
| `/api/admin/service-areas` (GET/POST) | ✅ Migrated | Service area management |
| `/api/admin/customers` (GET) | ✅ Migrated | Customer list |
| `/api/admin/referrals` (GET) | ✅ Migrated | Referral management |

### Auth & OAuth
| Route | Status | Notes |
|-------|--------|-------|
| `/api/servicetitan/auth` (GET) | ✅ Migrated | ServiceTitan OAuth init |
| `/api/servicetitan/callback` (GET) | ✅ Migrated | ServiceTitan OAuth callback |
| `/api/auth/login` (GET) | ✅ Migrated | Replit admin OAuth |
| `/api/auth/callback` (GET) | ✅ Migrated | Replit OAuth callback |
| `/api/auth/logout` (POST) | ✅ Migrated | Admin logout |

### Object Storage
| Route | Status | Notes |
|-------|--------|-------|
| `/public-objects/*` (GET) | ✅ Migrated | Public file serving |
| `/replit-objstore-*/public/*` (GET) | ✅ Migrated | Legacy URL support (via middleware) |
| `/api/admin/upload-logo` (POST) | ✅ Migrated | Logo upload |
| `/api/chatbot/upload-image` (POST) | ✅ Migrated | Chatbot image upload |

### Webhooks
| Route | Status | Notes |
|-------|--------|-------|
| `/api/webhooks/resend` (POST) | ✅ Migrated | Email engagement tracking |
| `/api/webhooks/stripe` (POST) | ✅ Migrated | Stripe events |
| `/api/webhooks/mailgun/customer-data` (POST) | ✅ Migrated | XLSX customer imports |

---

## ⚠️ STILL ON EXPRESS (Needs Migration Decision)

### Chatbot APIs (User-Facing)
| Route | Status | Decision |
|-------|--------|----------|
| `/api/chatbot` (POST) | 🔴 Express | **MIGRATE** - Main chatbot endpoint |
| `/api/chatbot/conversation/:id` (GET) | 🔴 Express | **MIGRATE** - Conversation history |
| `/api/chatbot/feedback` (POST) | 🔴 Express | **MIGRATE** - Message feedback |
| `/api/chatbot/end-conversation` (POST) | 🔴 Express | **MIGRATE** - End conversation |

### Referral System
| Route | Status | Decision |
|-------|--------|----------|
| `/api/referrals/leaderboard` (GET) | 🔴 Express | **MIGRATE** - Referral rankings |
| `/api/referrals/customer/:customerId` (GET) | 🔴 Express | **MIGRATE** - Customer referrals |
| `/api/referrals/code/:customerId` (GET) | 🔴 Express | **MIGRATE** - Referral code generation |
| `/api/referrals/track-click` (POST) | 🔴 Express | **MIGRATE** - Click tracking |
| `/api/referrals/capture-landing` (POST) | 🔴 Express | **MIGRATE** - Landing page capture |
| `/api/referrals/capture-referee` (POST) | 🔴 Express | **MIGRATE** - Referee capture |
| `/api/referrals/referrer/:customerId` (GET) | 🔴 Express | **MIGRATE** - Referrer info |

### Reviews (Partial Migration)
| Route | Status | Decision |
|-------|--------|----------|
| `/api/reviews` (GET) | 🔴 Express | **MIGRATE** - Combined reviews |
| `/api/reviews/submit` (POST) | 🔴 Express | **MIGRATE** - Custom review submission |
| `/api/reviews/private-feedback` (POST) | 🔴 Express | **MIGRATE** - Negative feedback |
| `/api/review-feedback` (POST) | 🔴 Express | **MIGRATE** - Rating-first flow |

### Photo Management (User-Facing)
| Route | Status | Decision |
|-------|--------|----------|
| `/api/photos` (GET) | 🔴 Express | **MIGRATE** - Photo gallery |
| `/api/photos/analyze` (POST) | 🔴 Express | **KEEP EXPRESS** - Heavy AI processing |
| `/api/photos/import` (POST) | 🔴 Express | **KEEP EXPRESS** - ServiceTitan integration |
| `/api/photos/import-google-drive` (POST) | 🔴 Express | **KEEP EXPRESS** - OAuth flow |

### Success Stories
| Route | Status | Decision |
|-------|--------|----------|
| `/api/customer-success-stories` (GET) | 🔴 Express | **MIGRATE** - Success story listing |
| `/api/success-stories/rss.xml` (GET) | 🔴 Express | **MIGRATE** - RSS feed |
| `/api/before-after-composites` (GET) | 🔴 Express | **MIGRATE** - Composite images |
| `/api/before-after-composites/:id/download` (GET) | 🔴 Express | **MIGRATE** - Image downloads |

### Tracking & Analytics
| Route | Status | Decision |
|-------|--------|----------|
| `/api/tracking-numbers` (GET) | 🔴 Express | **MIGRATE** - Dynamic phone display |
| `/api/commercial-customers` (GET) | 🔴 Express | **MIGRATE** - Trust signals |

### Metadata & SEO
| Route | Status | Decision |
|-------|--------|----------|
| `/api/page-metadata` (GET) | 🔴 Express | **MIGRATE** - Page metadata |
| `/api/review-platforms` (GET) | 🔴 Express | **MIGRATE** - Platform list |

### E-commerce (Partial)
| Route | Status | Decision |
|-------|--------|----------|
| `/api/blog/categories` (GET) | 🔴 Express | **MIGRATE** - Category listing |
| `/api/blog/available-photos` (GET) | 🔴 Express | **MIGRATE** - Photo availability |
| `/api/blog/image-jpeg` (GET) | 🔴 Express | **MIGRATE** - Image conversion |
| `/api/success-stories/image-jpeg` (GET) | 🔴 Express | **MIGRATE** - Image conversion |

---

## 🟢 INTENTIONALLY STAYING ON EXPRESS (Worker Process)

### Background Schedulers (14 total)
| Scheduler | Frequency | Notes |
|-----------|-----------|-------|
| Review request emails | 30 min | Drip campaign automation |
| Referral nurture emails | 30 min | 6-month nurture sequence |
| Quote follow-up emails | 30 min | $0 job follow-ups |
| Google Drive photo monitor | 5 min | Auto-import new photos |
| Photo cleanup | Daily 3am | Remove unused photos |
| Auto blog generator | Weekly | AI blog automation |
| GMB review fetch | 6 hours | Google review sync |
| GMB auto-reply | 15 min | Auto-respond to reviews |
| Referral processor | Hourly | Process pending referrals |
| Custom campaign processor | 30 min | Custom email campaigns |
| Membership sync | 30 seconds | ServiceTitan membership sync |
| SMS campaign processor | 30 min | SMS automation |
| Email campaign processor | 30 min | Custom email automation |

### Heavy Integrations
| Route | Reason |
|-------|--------|
| ServiceTitan XLSX sync | Webhook-driven, complex data processing |
| Photo AI analysis | Heavy AI processing, better on dedicated process |
| Google Drive OAuth flows | Complex OAuth, existing implementation stable |
| Social media automation | Heavy image processing + API calls |

### Admin APIs for Schedulers
| Route | Notes |
|-------|-------|
| `/api/admin/chatbot/conversations` | Scheduler management |
| `/api/admin/chatbot/conversation/:id` | Scheduler details |
| `/api/admin/custom-campaigns/*` | Campaign scheduler config |
| `/api/admin/sms-campaigns/:id/send` | Manual SMS trigger |

---

## 📊 MIGRATION STATISTICS

| Category | Total | Migrated | Remaining | % Complete |
|----------|-------|----------|-----------|------------|
| **Public APIs** | 35 | 17 | 18 | 49% |
| **Customer Portal** | 8 | 8 | 0 | 100% |
| **Admin APIs** | 60+ | 20 | 40+ | 33% |
| **Auth/OAuth** | 5 | 5 | 0 | 100% |
| **Object Storage** | 4 | 4 | 0 | 100% |
| **Webhooks** | 3 | 3 | 0 | 100% |
| **Background Jobs** | 14 | 0 | 14 (intentional) | N/A |
| **TOTAL USER-FACING** | 115 | 57 | 58 | 50% |

---

## 🎯 PRIORITY MIGRATION PLAN

### Phase 1: Critical User-Facing APIs (High Priority)
1. **Chatbot Suite** (4 endpoints) - User interaction
2. **Reviews Complete** (4 endpoints) - Social proof
3. **Referral System** (7 endpoints) - Growth engine
4. **Tracking Numbers** (1 endpoint) - Attribution
5. **Page Metadata** (1 endpoint) - SEO

**Estimated Impact:** 17 endpoints, ~40% increase in coverage

### Phase 2: Content & Display APIs (Medium Priority)
1. **Success Stories** (4 endpoints) - Trust building
2. **Photo Gallery** (1 endpoint) - Visual content
3. **Blog Utilities** (3 endpoints) - Content management
4. **Commercial Customers** (1 endpoint) - Trust signals
5. **Review Platforms** (1 endpoint) - Display logic

**Estimated Impact:** 10 endpoints, ~20% increase

### Phase 3: Admin Dashboard Enhancement (Low Priority)
1. Complete admin CRUD operations
2. Advanced filtering/search
3. Bulk operations
4. Export functionality

**Estimated Impact:** Remaining admin endpoints

### Phase 4: Worker Separation (Infrastructure)
1. Confirm all schedulers isolated in separate process
2. Document worker architecture
3. Create deployment topology
4. Prepare monitoring/alerts

---

## 🚀 NEXT ACTIONS

### Immediate (This Session)
1. ✅ **Create this inventory** (DONE)
2. ⏳ **Migrate Phase 1 Critical APIs:**
   - Chatbot endpoints (4)
   - Reviews endpoints (4)
   - Referral endpoints (7)
   - Tracking numbers (1)
   - Page metadata (1)

### Post-Migration
3. Execute Phase 9 testing plan
4. Validate dual-mode operation
5. Create cutover runbook
6. Deploy to production

---

## 📝 NOTES

**Key Insights:**
- ~50% of user-facing APIs already migrated
- Customer Portal 100% complete ✅
- Admin dashboard foundation solid (core dashboards done)
- Background schedulers correctly isolated
- Main gaps: Chatbot, complete reviews, referral system

**Deployment Strategy:**
- Next.js handles all user-facing traffic
- Express worker handles background jobs
- Both share same PostgreSQL database
- Zero downtime cutover possible

**Rollback Safety:**
- Express still has all routes
- Can switch back instantly
- Database unchanged
- No breaking changes
