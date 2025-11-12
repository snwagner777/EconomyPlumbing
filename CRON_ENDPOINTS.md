# 🕒 Cron Endpoint Configuration Guide

This document provides the complete configuration for your external cron service to trigger background workers in production.

## 🔒 Authentication

All cron endpoints require Bearer token authentication using the `CRON_SECRET` environment variable.

**Headers Required:**
```
Authorization: Bearer YOUR_CRON_SECRET_HERE
Content-Type: application/json
```

**Base URL (Production):**
```
https://your-site.replit.app
```

---

## 📋 Cron Endpoints & Schedules

### 1. Google Reviews Refresh
**Endpoint:** `POST /api/cron/google-reviews`  
**Schedule:** Daily at 3:00 AM  
**Cron Expression:** `0 3 * * *`  
**Description:** Fetches latest Google reviews via SerpAPI and saves new 4-5 star reviews to database.

**Example cURL:**
```bash
curl -X POST https://your-site.replit.app/api/cron/google-reviews \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 2. Membership Sync
**Endpoint:** `POST /api/cron/membership-sync`  
**Schedule:** Every 5 minutes  
**Cron Expression:** `*/5 * * * *`  
**Description:** Syncs VIP membership data from ServiceTitan (event-driven fallback sweep).

**Example cURL:**
```bash
curl -X POST https://your-site.replit.app/api/cron/membership-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 3. Auto Blog Generation
**Endpoint:** `POST /api/cron/auto-blog`  
**Schedule:** Weekly on Mondays at 9:00 AM  
**Cron Expression:** `0 9 * * 1`  
**Description:** Generates new blog posts using AI based on trending topics and service areas.

**Example cURL:**
```bash
curl -X POST https://your-site.replit.app/api/cron/auto-blog \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 4. Google Drive Photo Monitoring
**Endpoint:** `POST /api/cron/google-drive`  
**Schedule:** Every 5 minutes  
**Cron Expression:** `*/5 * * * *`  
**Description:** Monitors Google Drive for new before/after photos and syncs to database.

**Example cURL:**
```bash
curl -X POST https://your-site.replit.app/api/cron/google-drive \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 5. Photo Cleanup (Combined)
**Endpoint:** `POST /api/cron/photo-cleanup`  
**Schedule:** Daily at 3:00 AM  
**Cron Expression:** `0 3 * * *`  
**Description:** Runs both automated photo cleanup and quality analysis jobs.

**Example cURL:**
```bash
curl -X POST https://your-site.replit.app/api/cron/photo-cleanup \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 6. GMB Automation (Placeholder)
**Endpoint:** `POST /api/cron/gmb-automation`  
**Schedule:** Every 30 minutes  
**Cron Expression:** `*/30 * * * *`  
**Description:** ⚠️ Not yet implemented - placeholder for Google My Business review automation.

**Example cURL:**
```bash
curl -X POST https://your-site.replit.app/api/cron/gmb-automation \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 7. Review Request Emails
**Endpoint:** `POST /api/cron/review-requests`  
**Schedule:** Every 30 minutes  
**Cron Expression:** `*/30 * * * *`  
**Description:** Processes pending review request emails to customers after completed jobs.

**Example cURL:**
```bash
curl -X POST https://your-site.replit.app/api/cron/review-requests \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 8. Referral Nurture Campaigns
**Endpoint:** `POST /api/cron/referral-nurture`  
**Schedule:** Every 30 minutes  
**Cron Expression:** `*/30 * * * *`  
**Description:** Sends automated follow-up emails to referred customers.

**Example cURL:**
```bash
curl -X POST https://your-site.replit.app/api/cron/referral-nurture \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 9. Custom Marketing Campaigns
**Endpoint:** `POST /api/cron/custom-campaigns`  
**Schedule:** Every 30 minutes  
**Cron Expression:** `*/30 * * * *`  
**Description:** Processes AI-generated personalized marketing campaign emails.

**Example cURL:**
```bash
curl -X POST https://your-site.replit.app/api/cron/custom-campaigns \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

### 10. Health Monitoring & Alerts
**Endpoint:** `POST /api/cron/health-alerter`  
**Schedule:** Every 5 minutes  
**Cron Expression:** `*/5 * * * *`  
**Description:** Monitors system health and sends admin alerts if issues detected.

**Example cURL:**
```bash
curl -X POST https://your-site.replit.app/api/cron/health-alerter \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## 🛠️ External Cron Service Configuration

### Recommended Services (Free Tier):
- **cron-job.org** (free, up to 50 jobs)
- **EasyCron** (free, limited jobs)
- **UptimeRobot** (free, can trigger webhooks)

### Setup Steps (cron-job.org example):

1. **Sign up** at https://cron-job.org
2. **Create new cron job** for each endpoint
3. **Configure each job:**
   - URL: `https://your-site.replit.app/api/cron/[endpoint]`
   - Schedule: Use cron expression from above
   - HTTP Method: POST
   - Custom Headers: `Authorization: Bearer YOUR_CRON_SECRET`
   - Custom Headers: `Content-Type: application/json`
4. **Enable job** and test

---

## ✅ Testing Endpoints

Test each endpoint manually before configuring cron:

```bash
# Test Google Reviews endpoint
curl -X POST https://your-site.replit.app/api/cron/google-reviews \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# Expected response:
{
  "success": true,
  "message": "Processed X reviews, added Y new",
  "newReviews": Y
}
```

---

## 🔐 Security Notes

1. **Never expose CRON_SECRET** in logs or client-side code
2. **Rotate CRON_SECRET** if compromised
3. **Monitor failed auth attempts** in server logs
4. **Use HTTPS only** for production endpoints
5. **Set rate limits** on external cron service (prevent abuse)

---

## 📊 Quick Reference Table

| Endpoint | Schedule | Frequency | Critical? |
|----------|----------|-----------|-----------|
| `/api/cron/google-reviews` | `0 3 * * *` | Daily 3AM | Medium |
| `/api/cron/membership-sync` | `*/5 * * * *` | Every 5min | High |
| `/api/cron/auto-blog` | `0 9 * * 1` | Mon 9AM | Low |
| `/api/cron/google-drive` | `*/5 * * * *` | Every 5min | Medium |
| `/api/cron/photo-cleanup` | `0 3 * * *` | Daily 3AM | Low |
| `/api/cron/gmb-automation` | `*/30 * * * *` | Every 30min | ⚠️ Not Implemented |
| `/api/cron/review-requests` | `*/30 * * * *` | Every 30min | High |
| `/api/cron/referral-nurture` | `*/30 * * * *` | Every 30min | Medium |
| `/api/cron/custom-campaigns` | `*/30 * * * *` | Every 30min | Medium |
| `/api/cron/health-alerter` | `*/5 * * * *` | Every 5min | High |

---

## 🚨 Troubleshooting

**401 Unauthorized:**
- Check that CRON_SECRET matches exactly
- Verify Bearer token format: `Bearer YOUR_SECRET`

**500 Server Error:**
- Check server logs for details
- Verify all environment secrets are set (RESEND_API_KEY, SERPAPI_API_KEY, etc.)
- Test endpoint manually with cURL

**Timeout:**
- Increase timeout in cron service settings (recommend 60s)
- Some jobs (like auto-blog) may take longer

---

## 📝 Migration from worker.ts

The following worker.ts schedulers have been migrated to cron endpoints:

- ✅ `google-reviews` → `/api/cron/google-reviews`
- ✅ `membership-sync` → `/api/cron/membership-sync`
- ✅ `auto-blog` → `/api/cron/auto-blog`
- ✅ `google-drive` → `/api/cron/google-drive`
- ✅ `photo-cleanup` + `automated-photo-cleanup` → `/api/cron/photo-cleanup`
- ⚠️ `gmb-fetch` + `gmb-reply` → `/api/cron/gmb-automation` (not implemented)
- ✅ `review-requests` → `/api/cron/review-requests`
- ✅ `referral-nurture` → `/api/cron/referral-nurture`
- ✅ `custom-campaigns` → `/api/cron/custom-campaigns`
- ✅ `health-alerter` → `/api/cron/health-alerter`
- ❌ `daily-composite` → (disabled, not needed)

**Total:** 10 working endpoints + 1 placeholder (GMB)
