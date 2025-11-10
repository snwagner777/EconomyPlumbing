# Replit Scheduled Deployments Setup Guide

## Overview

Your automated campaigns (emails, blog posts, etc.) currently use `setInterval` timers in `worker.ts`, which **are unreliable in Next.js serverless environments**. The server can restart at any time, losing all timers.

**Solution**: Use Replit's Scheduled Deployments feature to run tasks on a reliable schedule.

---

## What Needs to Be Scheduled

| Task | Frequency | Command | Purpose |
|------|-----------|---------|---------|
| **Frequent Emails** | Every 30 min | `npx tsx server/cron.ts emails-frequent` | Review requests, referral nurture, custom campaigns |
| **Reviews Fetch** | Every 6 hours | `npx tsx server/cron.ts reviews-fetch` | Fetch Google reviews via SerpAPI |
| **Weekly Blog** | Monday 9am | `npx tsx server/cron.ts blog-weekly` | Generate AI blog post from photos |
| **Photo Sync** | 2x daily (9am & 5pm) | `npx tsx server/cron.ts photos-sync` | Sync photos from Google Drive |
| **Photo Cleanup** | Daily 3am | `npx tsx server/cron.ts photos-cleanup` | Delete old unused photos (60+ days) |

---

## Pricing

- **Scheduler fee**: $0.10/month per Scheduled Deployment (5 jobs = $0.50/month)
- **Runtime cost**: $0.000028/second (only when running)
- **Replit Core members**: Get $25/month credits (covers all costs)

**Example cost**: A 30-second email job running every 30 min = ~$1.20/month

---

## Setup Steps

### 1. Access Deployments

1. Click **Deploy** in the top navigation
2. Select **Scheduled Deployment** type

### 2. Create Each Scheduled Job

For **each task** in the table above, create a separate Scheduled Deployment:

#### Example: Frequent Emails (Every 30 minutes)

**Schedule Tab:**
- **Schedule description**: `Every 30 minutes`
- **Timezone**: `America/Chicago` (Central Time)
- **Job timeout**: `10 minutes` (emails can take a while)

**Build & Run Tab:**
- **Build command**: `npm install` (installs dependencies before running)
- **Run command**: `npx tsx server/cron.ts emails-frequent`

**Secrets Tab:**
- All your existing environment secrets will be automatically included

**Click Deploy** ✅

---

#### Example: Weekly Blog (Every Monday 9am)

**Schedule Tab:**
- **Schedule description**: `Every Monday at 9:00 AM`
- **Timezone**: `America/Chicago`
- **Job timeout**: `15 minutes` (OpenAI API can be slow)

**Build & Run Tab:**
- **Build command**: `npm install`
- **Run command**: `npx tsx server/cron.ts blog-weekly`

**Click Deploy** ✅

---

#### Example: Photo Sync (2x daily at 9am & 5pm)

**Schedule Tab:**
- **Schedule description**: `Every day at 9:00 AM and 5:00 PM`
- **Timezone**: `America/Chicago`
- **Job timeout**: `10 minutes`

**Build & Run Tab:**
- **Build command**: `npm install`
- **Run command**: `npx tsx server/cron.ts photos-sync`

**Click Deploy** ✅

---

#### Example: Reviews Fetch (Every 6 hours)

**Schedule Tab:**
- **Schedule description**: `Every 6 hours`
- **Timezone**: `America/Chicago`
- **Job timeout**: `5 minutes`

**Build & Run Tab:**
- **Build command**: `npm install`
- **Run command**: `npx tsx server/cron.ts reviews-fetch`

**Click Deploy** ✅

---

## Monitoring & Alerts

After deploying, you can:
- **View logs**: See what happened during each run
- **Error alerts**: Get notified when a job fails
- **Monitor status**: Check if jobs are running on schedule

---

## Testing Individual Tasks

You can test any task manually before scheduling:

```bash
# Test email sending
npx tsx server/cron.ts emails-frequent

# Test blog generation
npx tsx server/cron.ts blog-weekly

# Test photo monitoring
npx tsx server/cron.ts photos-monitor

# Test membership sync
npx tsx server/cron.ts membership-sync

# Test GMB reviews
npx tsx server/cron.ts gmb-reviews

# Test photo cleanup
npx tsx server/cron.ts photos-cleanup
```

Each task will output detailed logs showing what it did.

---

## What Happens to worker.ts?

Once you set up Scheduled Deployments, the `worker.ts` file is **no longer needed** for these automated tasks. However, it's still running alongside your Next.js server.

**Recommended**: After confirming Scheduled Deployments work, you can:
1. Comment out the unreliable tasks in `worker.ts`
2. Keep only the ones that need to run immediately on server startup (if any)

---

## Troubleshooting

### Job times out
- Increase the **Job timeout** in the deployment settings
- Check logs to see what's taking so long

### Job fails immediately
- Check the **Build command** ran successfully
- Verify all required environment secrets are set
- Look at the error logs for details

### No emails being sent
- Verify `emails-frequent` is running every 30 minutes
- Check admin panel → Email Marketing for master switch status
- Review the task logs for errors

---

## Benefits of Scheduled Deployments

✅ **Reliable**: Runs even if your main app restarts  
✅ **Isolated**: Task failures don't crash your website  
✅ **Monitored**: See logs and get error alerts  
✅ **Cost-effective**: Only pay for runtime, not idle time  
✅ **Scalable**: Each task gets its own resources

---

## Next Steps

1. Set up the 6 Scheduled Deployments listed above
2. Monitor logs for the first few runs to ensure they work
3. Once confirmed working, remove the unreliable `setInterval` code from `worker.ts`
4. Celebrate having reliable automated campaigns! 🎉
