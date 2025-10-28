# Testing Next.js Migration Guide

## Current Setup (Dual-Mode Operation)

✅ **Production (Published):** Running Express on `plumbersthatcare.com`  
🧪 **Testing (Dev):** Run Next.js locally for testing

---

## How to Test Next.js Without Affecting Production

### **Option 1: Run in Shell (Simplest)**

1. **Stop the current workflow** (if running)
2. **In the Shell, run:**
   ```bash
   NODE_ENV=development npx next dev -p 3000
   ```
3. **Open the webview** - it will show Next.js on port 3000
4. **Your published site** at plumbersthatcare.com stays on Express

### **Option 2: Create a New Workflow in Replit UI**

1. Click **"+ Create Workflow"** in the Tools panel
2. **Name:** `Test Next.js Migration`
3. **Command:** `NODE_ENV=development npx next dev -p 3000`
4. **Port:** 3000
5. Click **Create**

Now you can switch between:
- **"Start application"** workflow → Express (production-safe)
- **"Test Next.js Migration"** workflow → Next.js (testing)

### **Option 3: Side-by-Side Testing Script**

Run this command to see both servers simultaneously:
```bash
npx concurrently \
  "npm run dev" \
  "NODE_ENV=development npx next dev -p 3000"
```

- Express: `http://localhost:5000`
- Next.js: `http://localhost:3000`

---

## What You Can Test on Next.js (Port 3000)

### ✅ **Fully Migrated Pages (Ready for Testing)**
- Home: `/`
- About: `/about/`
- Contact: `/contact/`
- Services: `/services/`
- Blog: `/blog/`, `/blog/[slug]/`
- Service Areas: `/service-areas/`, `/service-areas/[slug]/`
- VIP Membership: `/vip-membership/`
- FAQ: `/faq/`
- Emergency: `/emergency/`
- All service pages (leak repair, water heater, etc.)
- Seasonal pages (summer prep, winter freeze protection)
- Commercial pages: `/commercial-plumbing/`, `/commercial/retail/`, etc.
- Store: `/store/`
- Referral: `/referral/`
- SMS Signup: `/sms-signup/`
- Review Request: `/review-request/`
- Email Preferences: `/email-preferences/`
- Privacy & Terms: `/privacy-policy/`, `/terms-of-service/`

### ✅ **Admin Dashboard (4 Dashboards Complete)**
- Login: `/admin/oauth-login/`
- Marketing Automation: `/admin/marketing/`
- Reputation Management: `/admin/reputation/`
- Blog CMS: `/admin/blog/`
- ServiceTitan Sync: `/admin/servicetitan/`
- Stub pages for other sections: Photos, Chatbot, Contacts, etc.

### ✅ **Customer Portal**
- Login: `/customer-portal/`
- Dashboard: `/customer-portal/dashboard/`

### ✅ **Object Storage (Phase 8)**
- Public files: `/public-objects/[...path]`
- Legacy URLs: `/replit-objstore-{id}/public/[...path]` (middleware rewrite)
- Admin logo upload: `/api/admin/upload-logo`
- Chatbot image upload: `/api/chatbot/upload-image`

### ✅ **API Endpoints**
- Google reviews: `/api/google-reviews`, `/api/google-reviews/stats`
- Blog: `/api/blog`, `/api/blog/[slug]`
- Contact: `/api/contact`
- Service areas: `/api/service-areas`
- Email preferences: `/api/email-preferences`
- Referrals: `/api/referrals/submit`
- SMS: `/api/sms/subscribe`
- Admin APIs: stats, customers, blog, photos, settings, etc.
- Webhooks: `/api/webhooks/mailgun/customer-data`, `/api/webhooks/resend`

### ⚠️ **Still on Express (Coexist for Now)**
- Chatbot main endpoint: `/api/chatbot` (Express)
- Some niche APIs (review platforms, leaderboard, etc.)
- Legacy `/attached_assets/*` serving

---

## Testing Checklist

### **Visual/UX Testing**
- [ ] Pages load correctly
- [ ] Navigation works
- [ ] Forms submit properly
- [ ] Images display
- [ ] Dark mode toggles
- [ ] Mobile responsive

### **Admin Dashboard Testing**
- [ ] Login works
- [ ] Marketing dashboard displays campaigns
- [ ] Reputation dashboard shows reviews
- [ ] Blog CMS loads posts
- [ ] ServiceTitan sync interface works
- [ ] All buttons/actions trigger correctly

### **API Testing**
- [ ] Contact form sends emails
- [ ] Blog posts fetch correctly
- [ ] Reviews display properly
- [ ] Upload endpoints work (admin logo, chatbot images)

### **Object Storage Testing**
- [ ] Public files serve correctly
- [ ] Legacy URLs redirect properly
- [ ] Query strings preserved (e.g., `?v=123`)
- [ ] Cache headers correct

---

## Switching Back to Production Mode

**To return to Express (production-safe):**
1. Stop Next.js (Ctrl+C in Shell)
2. Run: `npm run dev` (starts Express on port 5000)
3. Or restart the **"Start application"** workflow

---

## Production Cutover Plan

When ready to deploy Next.js to production:

1. **Run final tests** on Next.js (port 3000)
2. **Update deployment config** (build: `next build`, start: `next start`)
3. **Deploy to production**
4. **Monitor for issues**
5. **Rollback available** (revert to Express if needed)

---

## Quick Reference

| Environment | Command | Port | URL |
|-------------|---------|------|-----|
| **Express (Production)** | `npm run dev` | 5000 | Published domain |
| **Next.js (Testing)** | `npx next dev -p 3000` | 3000 | Dev webview |
| **Both (Side-by-side)** | See Option 3 | 5000 & 3000 | Both URLs |

---

## Need Help?

- **Issue:** Next.js won't start → Check for port conflicts, try `pkill -9 node` first
- **Issue:** Page shows 404 → Verify the route exists in `app/` directory
- **Issue:** API errors → Check logs, verify database connection
- **Issue:** Production affected → Restart Express workflow immediately

---

**Current Status:** ✅ Safe to test Next.js without production risk
