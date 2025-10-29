# Production Deployment Checklist
## Economy Plumbing Services - Next.js Migration

**Status:** Ready for Final Review  
**Date:** October 29, 2025  
**Migration:** Express/Vite → Next.js 15 App Router

---

## ✅ Pre-Deployment Verification

### Application Status
- [x] Next.js server starts without errors
- [x] Worker process starts all 14 background schedulers
- [x] Zero LSP/TypeScript errors
- [x] Zero hydration errors in browser console
- [x] All public pages loading (200 status)
- [x] All API endpoints responding correctly
- [x] Database connection verified (`/api/health`)
- [x] Webhook routes configured (Stripe, Resend, ServiceTitan)
- [ ] Admin OAuth login configured in Replit OAuth app
- [ ] Customer portal login flow tested end-to-end
- [ ] Email sending tested (review requests, referral nurture)

### Environment Variables Required

#### Core Application
```bash
# Required - Already Set
DATABASE_URL=<Neon PostgreSQL connection string>
SESSION_SECRET=<Strong random secret for iron-session>
REPL_ID=<Replit workspace ID>
REPLIT_DEV_DOMAIN=<Replit dev domain>
NODE_ENV=production

# Next.js Public Variables
NEXT_PUBLIC_APP_URL=https://www.plumbersthatcare.com
```

#### OAuth & Authentication
```bash
# Required for Admin Login
ISSUER_URL=https://replit.com/oidc
# Note: Admin OAuth callback must be registered in Replit OAuth app:
# https://<your-domain>/api/auth/callback
```

#### Email Services
```bash
# Required - Check Status
RESEND_API_KEY=<Resend API key>
MAILGUN_API_KEY=<Mailgun API key>
MAILGUN_DOMAIN=<Mailgun sending domain>
```

#### SMS Services
```bash
# Required for SMS Marketing
TWILIO_ACCOUNT_SID=<Twilio account SID>
TWILIO_AUTH_TOKEN=<Twilio auth token>
ZOOM_PHONE_NUMBER=<Zoom Phone number>
```

#### External Integrations
```bash
# ServiceTitan
SERVICETITAN_CLIENT_ID=<ServiceTitan OAuth client ID>
SERVICETITAN_CLIENT_SECRET=<ServiceTitan OAuth secret>
SERVICETITAN_TENANT_ID=<ServiceTitan tenant ID>

# Google Services
GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth secret>
GOOGLE_DRIVE_FOLDER_ID=<Google Drive photos folder>
GOOGLE_PLACES_API_KEY=<Google Places API key>

# Stripe
STRIPE_SECRET_KEY=<Stripe secret key>
STRIPE_WEBHOOK_SECRET=<Stripe webhook signing secret>

# OpenAI
OPENAI_API_KEY=<OpenAI API key for blog generation & chatbot>

# Meta/Facebook
META_ACCESS_TOKEN=<Meta API token for social media>

# DataForSEO
DATAFORSEO_API_USERNAME=<DataForSEO username>
DATAFORSEO_API_PASSWORD=<DataForSEO password>
```

#### Object Storage
```bash
# Required for Photos & Assets
PUBLIC_OBJECT_SEARCH_PATHS=<Object storage bucket path>
# Google Cloud Storage configured via Replit sidecar
```

---

## 🔧 Database Checklist

### Schema Verification
- [x] All tables exist in production database
- [x] Sessions table configured for iron-session
- [ ] Database backup created before deployment
- [ ] Migration rollback plan documented

### Critical Tables
- `sessions` - Session storage (iron-session)
- `users` - OAuth user accounts
- `oauthUsers` - Admin OAuth accounts (whitelisted emails)
- `blogPosts` - Blog content
- `products` - E-commerce products
- `reviews` - Google reviews
- `serviceAreas` - Service coverage areas
- `emailSendLog` - Email tracking & engagement
- `emailSuppressionList` - CAN-SPAM compliance
- `reviewRequests` - Review request campaigns
- `referralNurtureCampaigns` - Referral nurture sequences
- `referrals` - Customer referral management
- `trackingPhoneNumbers` - Marketing attribution

---

## 🚀 Deployment Steps

### 1. Pre-Deployment
```bash
# 1. Create database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify all secrets present
# Check in Replit Secrets panel

# 3. Run build test
npm run build

# 4. Check for TypeScript errors
npx tsc --noEmit
```

### 2. Deploy to Production
```bash
# 1. Update start command in .replit file (if needed)
run = "./start.sh"

# 2. Publish using Replit Deployments
# - Click "Deploy" in Replit UI
# - Select production configuration
# - Monitor deployment logs

# 3. Verify deployment URL
# https://www.plumbersthatcare.com
```

### 3. Post-Deployment Verification
```bash
# 1. Check health endpoint
curl https://www.plumbersthatcare.com/api/health

# 2. Verify public pages
curl https://www.plumbersthatcare.com/
curl https://www.plumbersthatcare.com/services
curl https://www.plumbersthatcare.com/blog

# 3. Test SEO features
curl https://www.plumbersthatcare.com/sitemap.xml
curl https://www.plumbersthatcare.com/robots.txt

# 4. Check background workers
# Monitor logs for scheduler activity

# 5. Test webhooks
# Send test webhook from Stripe, Resend dashboards
```

---

## 🔍 Monitoring & Alerts

### Application Monitoring
- **Logs:** Check Replit deployment logs
- **Errors:** Monitor Next.js error tracking
- **Performance:** Watch response times on critical pages
- **Database:** Monitor connection pool usage

### Background Jobs to Monitor
1. **Membership Sync** (30 seconds) - Stripe membership sync
2. **Review Request Scheduler** (30 min) - Email campaigns
3. **Referral Nurture Scheduler** (30 min) - Email sequences
4. **Quote Follow-up Scheduler** (30 min) - Quote emails
5. **Google Drive Monitor** (5 min) - Photo imports
6. **Photo Cleanup** (Daily 3am) - Unused photo cleanup
7. **Auto Blog Generator** (Weekly) - AI blog generation
8. **GMB Review Fetch** (6 hours) - Google reviews sync
9. **GMB Auto-Reply** (15 min) - Review auto-responses
10. **Referral Processor** (Hourly) - Referral matching
11. **Custom Campaign Processor** (30 min) - Marketing campaigns
12. **ServiceTitan XLSX Sync** (Via Mailgun webhook) - Customer data

### Critical Metrics
- **Uptime:** 99.9% target
- **Response Time:** <500ms for public pages
- **Database Queries:** <100ms average
- **Email Delivery:** >95% success rate
- **Background Job Success:** 100% for critical jobs

---

## 🛡️ Security Checklist

### Headers & Policies
- [x] CSP headers configured
- [x] HSTS enabled (max-age: 1 year)
- [x] X-Content-Type-Options: nosniff
- [x] X-Frame-Options: DENY
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy configured

### Authentication & Authorization
- [x] Admin routes protected by OAuth
- [x] Customer portal uses ServiceTitan OAuth + magic links
- [x] API routes validate authentication
- [x] Sessions stored in database (not memory)
- [x] Secure cookies (httpOnly, secure, sameSite)

### Data Protection
- [x] Environment variables not committed to Git
- [x] Secrets managed via Replit Secrets
- [x] Database connections use SSL
- [x] Email suppression list prevents spam
- [x] CSRF protection via session state

---

## 📊 Performance Optimization

### Next.js Features Enabled
- [x] Server-Side Rendering (SSR)
- [x] Static Site Generation (SSG) for blog
- [x] Automatic code splitting
- [x] Image optimization
- [x] Turbopack for fast builds

### Caching Strategy
- **Public Objects:** 1 year cache for blog images
- **Static Assets:** Served via Next.js static optimization
- **API Responses:** No caching (real-time data)
- **Database Queries:** No query caching (fresh data)

---

## 🔄 Rollback Plan

### If Deployment Fails

1. **Immediate Actions:**
```bash
# 1. Stop current deployment
# Via Replit UI: Stop deployment

# 2. Restore previous deployment
# Via Replit UI: Rollback to previous version

# 3. Verify old version works
curl https://www.plumbersthatcare.com/api/health
```

2. **Database Rollback (if needed):**
```bash
# 1. Restore from backup
psql $DATABASE_URL < backup_<timestamp>.sql

# 2. Verify data integrity
# Check critical tables in database
```

3. **Communication:**
- Notify team of rollback
- Document issue in incident log
- Schedule post-mortem review

---

## 📝 Known Issues & Notes

### Admin Login
- **Status:** OAuth callback configured, needs Replit OAuth app update
- **Action Required:** Add callback URL in Replit OAuth settings:
  ```
  https://www.plumbersthatcare.com/api/auth/callback
  ```
- **Temporary Workaround:** None - must configure OAuth app

### Middleware Deprecation
- **Warning:** Next.js middleware.ts deprecated in Next.js 16
- **Action Required:** Migrate to proxy.ts before Next.js 17
- **Impact:** None currently, plan migration in Q1 2026

### PostCSS Warning
- **Warning:** PostCSS plugin missing `from` option
- **Impact:** None on functionality
- **Action:** Can be safely ignored

---

## ✅ Sign-Off

### Pre-Deployment
- [ ] All environment variables verified
- [ ] Database backup created
- [ ] Build completes successfully
- [ ] All tests passing

### Post-Deployment
- [ ] Health check passing
- [ ] Public pages accessible
- [ ] Admin dashboards loading
- [ ] Background workers running
- [ ] Webhooks receiving events
- [ ] Email delivery working
- [ ] Monitoring configured

### Team Approval
- [ ] Technical Lead: _________________
- [ ] Product Owner: _________________
- [ ] Date Deployed: _________________

---

## 🔗 Quick Links

- **Production URL:** https://www.plumbersthatcare.com
- **Admin Panel:** https://www.plumbersthatcare.com/admin
- **Customer Portal:** https://www.plumbersthatcare.com/customer-portal
- **Health Check:** https://www.plumbersthatcare.com/api/health
- **Sitemap:** https://www.plumbersthatcare.com/sitemap.xml

---

**Last Updated:** October 29, 2025  
**Migration Status:** 90% Complete - Ready for Testing
