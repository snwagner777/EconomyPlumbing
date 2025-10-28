# Phase 9: Testing & Validation Plan

**Status:** In Progress  
**Date:** October 28, 2025

## Testing Objectives
Validate all migrated Next.js functionality before production cutover, ensuring zero regressions and full parity with Express implementation.

---

## 1. Admin Dashboard Testing

### Marketing Automation Dashboard (`/admin/marketing/`)
- [ ] Page loads without errors
- [ ] Campaign cards display correctly
- [ ] Loading states render properly
- [ ] Empty states show when no data
- [ ] Error states handle API failures
- [ ] Phone number tracking integration works
- [ ] All action buttons show toast messages
- [ ] Data-testid coverage complete

### Reputation Management Dashboard (`/admin/reputation/`)
- [ ] Page loads without errors
- [ ] Review request campaigns display
- [ ] Google reviews stats render
- [ ] Safety guards prevent crashes (optional chaining)
- [ ] Filter/search functionality works
- [ ] All CRUD operations functional
- [ ] Data-testid coverage complete

### Blog CMS Dashboard (`/admin/blog/`)
- [ ] Page loads without errors
- [ ] Blog post list renders
- [ ] Draft/published filters work
- [ ] Create/edit/delete operations
- [ ] AI generation placeholder works
- [ ] SEO metadata editor functional
- [ ] Data-testid coverage complete

### ServiceTitan Sync Dashboard (`/admin/servicetitan/`)
- [ ] Page loads without errors
- [ ] XLSX import system functional
- [ ] Sync status displays correctly
- [ ] Customer data preview works
- [ ] Data safety measures active
- [ ] Manual sync triggers properly
- [ ] Data-testid coverage complete

---

## 2. Object Storage Testing

### Public File Serving
- [ ] Primary route: `/public-objects/[...filePath]` works
- [ ] Legacy route: `/replit-objstore-{bucketId}/public/*` rewrites correctly
- [ ] Query strings preserved in rewrites (`?v=123&sig=xyz`)
- [ ] Cache headers correct (1-year blog images, 1-hour others)
- [ ] 404 errors for missing files
- [ ] Content-Type headers accurate

### Upload Endpoints
- [ ] Admin logo upload: `/api/admin/upload-logo` works
  - [ ] Auth check prevents unauthorized access
  - [ ] Image optimization (500x500 WebP @ 90%)
  - [ ] File saved to correct path
  - [ ] URL returned to client
- [ ] Chatbot image upload: `/api/chatbot/upload-image` works
  - [ ] Public access allowed
  - [ ] Image optimization (1024x1024 WebP @ 85%)
  - [ ] ConversationId required
  - [ ] URL returned to client

---

## 3. API Endpoint Testing

### Admin APIs
- [ ] `/api/admin/review-requests` - Campaign management
- [ ] `/api/admin/referral-campaigns` - Referral nurture
- [ ] `/api/admin/quote-followup-campaigns` - Quote campaigns
- [ ] `/api/google-reviews` - Review data
- [ ] `/api/google-reviews/stats` - Review statistics
- [ ] `/api/blog-posts` - Blog CRUD operations
- [ ] `/api/servicetitan/import-xlsx` - Customer data import

### Public APIs
- [ ] `/api/chatbot/chat` - AI chatbot
- [ ] `/api/contact` - Contact form
- [ ] `/api/newsletter` - Newsletter signup
- [ ] `/api/google-reviews` - Public review display

---

## 4. Authentication Testing

### Admin Auth
- [ ] Login required for `/admin/*` routes
- [ ] `isAdmin()` server-side check works
- [ ] Session persistence across requests
- [ ] Logout functionality
- [ ] Unauthorized access returns 401

### OAuth Flows
- [ ] ServiceTitan OAuth callback works
- [ ] Replit OAuth (if configured)
- [ ] Token refresh handling
- [ ] Error states handled

---

## 5. SEO & Meta Testing

### Meta Tags
- [ ] Each page has unique title
- [ ] Meta descriptions present
- [ ] Open Graph tags complete
- [ ] Twitter Card tags functional
- [ ] Canonical URLs correct

### Structured Data
- [ ] JSON-LD schemas valid
- [ ] LocalBusiness markup
- [ ] Review aggregation data
- [ ] Breadcrumb structured data

### Redirects
- [ ] 301 redirects for trailing slashes
- [ ] Legacy URL redirects work
- [ ] .replit.app → custom domain redirect

### Sitemaps
- [ ] `/sitemap.xml` generates correctly
- [ ] All public pages included
- [ ] Priority and changefreq accurate
- [ ] Images sitemap included

---

## 6. Performance Testing

### Page Load Times
- [ ] Homepage < 3s initial load
- [ ] Admin dashboard < 2s
- [ ] Blog pages < 2s
- [ ] Service pages < 2s

### Caching
- [ ] Static assets cached 1-year
- [ ] API responses cached appropriately
- [ ] Object storage cache headers correct

### Bundle Size
- [ ] Client JS bundle reasonable size
- [ ] Code splitting working
- [ ] Lazy loading implemented
- [ ] Tree-shaking effective

---

## 7. Security Testing

### Headers
- [ ] CSP (Content Security Policy) enforced
- [ ] HSTS enabled
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Referrer-Policy set
- [ ] Permissions-Policy configured

### Authentication
- [ ] Admin routes protected
- [ ] Session cookies secure
- [ ] CSRF protection active
- [ ] Rate limiting working

### Input Validation
- [ ] Form inputs sanitized
- [ ] API payloads validated (Zod)
- [ ] File upload size limits
- [ ] SQL injection prevented

---

## 8. Background Schedulers

### Email Schedulers
- [ ] Review request scheduler runs (30 min)
- [ ] Referral nurture scheduler runs (30 min)
- [ ] Quote follow-up scheduler runs (30 min)
- [ ] Email suppression list checked
- [ ] Engagement tracking functional

### Data Sync Schedulers
- [ ] ServiceTitan sync (XLSX import)
- [ ] Google Drive photo monitor (5 min)
- [ ] Photo cleanup scheduler (daily 3am)
- [ ] Auto blog generator (weekly)

### GMB Schedulers
- [ ] Review fetch (6 hours)
- [ ] Auto-reply generator (15 min)
- [ ] Review request trigger

---

## 9. Customer Portal Testing

### Login & Auth
- [ ] Customer login works
- [ ] ServiceTitan ID verification
- [ ] Session management
- [ ] Logout functionality

### Dashboard
- [ ] Job history displays
- [ ] Invoice access works
- [ ] Profile information correct
- [ ] VIP membership status shown

### Data Accuracy
- [ ] XLSX data import accurate
- [ ] Search functionality secure
- [ ] Customer data privacy maintained

---

## 10. Marketing Features

### Dynamic Phone Tracking
- [ ] Campaign-specific numbers assigned
- [ ] UTM parameters generated correctly
- [ ] Phone number sync to admin page
- [ ] Attribution tracking functional

### Email Campaigns
- [ ] Review request emails send
- [ ] Referral nurture emails send
- [ ] Quote follow-up emails send
- [ ] Engagement tracking updates
- [ ] Suppression list enforced

### SMS Marketing
- [ ] Opt-in/opt-out functional
- [ ] TCPA compliance maintained
- [ ] Message delivery confirmed
- [ ] Multi-channel coordination

---

## 11. Integration Testing

### ServiceTitan
- [ ] XLSX import works
- [ ] Customer data sync accurate
- [ ] Job completion tracking
- [ ] Notes integration functional

### Stripe
- [ ] Payment processing works
- [ ] Webhook handling functional
- [ ] Subscription management
- [ ] Invoice generation

### Resend
- [ ] Transactional emails send
- [ ] Webhook verification
- [ ] Engagement tracking updates
- [ ] Suppression list sync

### OpenAI
- [ ] Chatbot responses functional
- [ ] Blog generation works
- [ ] Photo analysis operational
- [ ] AI segmentation accurate

---

## 12. Cutover Preparation

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] No critical errors in logs
- [ ] Performance benchmarks met
- [ ] Security audit complete
- [ ] Database migrations tested

### Rollback Plan
- [ ] Database backup created
- [ ] Code rollback procedure documented
- [ ] Monitoring alerts configured
- [ ] Emergency contact list ready

### Post-Deployment Monitoring
- [ ] Error tracking active (Sentry)
- [ ] Performance monitoring (metrics)
- [ ] User feedback collection
- [ ] A/B testing framework ready

---

## Testing Progress

**Total Test Cases:** 150+  
**Completed:** 0  
**In Progress:** Admin Dashboard, Object Storage  
**Blocked:** None  
**Failed:** None  

---

## Next Actions

1. **Systematic Testing:** Execute each test category in order
2. **Document Findings:** Log all issues/regressions
3. **Fix Critical Issues:** Address blockers immediately
4. **Performance Tuning:** Optimize slow pages
5. **Security Audit:** Verify all protections active
6. **Cutover Decision:** Go/No-Go based on test results

---

## Sign-Off

**Ready for Production:** ⬜ YES ⬜ NO  
**Blocker Issues:** None identified  
**Performance:** Meets targets  
**Security:** Audit complete  

**Approved By:** _________________  
**Date:** _________________
