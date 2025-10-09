# Zapier → Facebook Auto-Posting Setup

## Overview
Automatically post your best before/after plumbing photos to Facebook using Zapier. No Facebook API credentials needed!

## 🎯 What You'll Achieve

Every week (or on-demand), Zapier will:
1. Fetch your best unused before/after composite
2. Post it to your Facebook Page
3. Include AI-generated caption with phone & website
4. Mark it as "posted" so it's not reused

---

## 📅 Option 1: Weekly Auto-Posting (Recommended)

### Step 1: Create Your Zap

1. Go to https://zapier.com/app/zaps
2. Click **"Create Zap"**

### Step 2: Set Up Schedule Trigger

1. **Trigger:** Search for **"Schedule by Zapier"**
2. **Event:** Choose **"Every Week"**
3. **Configure:**
   - Day: **Monday**
   - Time: **10:00 AM** (your timezone)
   - Click **Continue**

### Step 3: Get Best Composite

1. Click **"+"** to add an action
2. Search for **"Webhooks by Zapier"**
3. Choose **"GET"**
4. **URL:** 
   ```
   https://workspace.replit.app/api/social-media/best-composite
   ```
5. Click **Test action** - you should see:
   ```json
   {
     "success": true,
     "composite": {
       "id": "...",
       "imageUrl": "https://...",
       "caption": "Before: Leaking water heater..."
     }
   }
   ```

### Step 4: Post to Facebook

1. Click **"+"** to add another action
2. Search for **"Facebook Pages"**
3. Choose **"Create Page Photo"**
4. **Connect your Facebook account** when prompted
5. **Configure:**
   - **Page:** Select "Economy Plumbing Services"
   - **Photo URL:** Map from Step 3 → `composite imageUrl`
   - **Message:** Map from Step 3 → `composite caption`

### Step 5: Mark as Posted

1. Click **"+"** to add final action
2. Search for **"Webhooks by Zapier"**
3. Choose **"POST"**
4. **Configure:**
   - **URL:** `https://workspace.replit.app/api/social-media/mark-posted`
   - **Payload Type:** `json`
   - **Data:** 
     - `compositeId`: Map from Step 3 → `composite id`
     - `facebookPostId`: Map from Step 4 → `id` (Facebook post ID)

### Step 6: Test & Activate

1. Click **"Test action"** on each step
2. Check your Facebook page - you should see the post!
3. **Turn on your Zap**
4. Give it a name: "Weekly Before/After Facebook Post"

---

## 🚀 Option 2: Manual/On-Demand Posting

For testing or posting whenever you want:

### Create a "Button Press" Zap

1. **Trigger:** "Webhooks by Zapier" → "Catch Hook"
2. Copy the webhook URL Zapier gives you
3. Follow Steps 3-6 above (Get Composite → Post → Mark Posted)
4. **To trigger:** Send a GET request to your Zapier webhook URL
   - Use a browser bookmark
   - Or create a Zapier Chrome Extension button

---

## 🎨 What Gets Posted

**Example Caption (AI-generated):**
```
Before: Old leaking water heater causing water damage. 
After: Brand new energy-efficient Rheem installation! 

Professional plumbing services in Austin & Marble Falls.
Call (512) 575-3157 or visit https://www.plumbersthatcare.com/?utm=facebook

#PlumbingAustin #WaterHeater #BeforeAndAfter #HomeImprovement
```

**Image Format:**
- Professional polaroid-style layout
- Clear "BEFORE" and "AFTER" labels
- High-quality plumbing work photos
- Optimized for Facebook feed

---

## 📊 Response Format

When you call `/api/social-media/best-composite`, you get:

```json
{
  "success": true,
  "composite": {
    "id": "abc-123",
    "imageUrl": "https://your-composite-url.jpg",
    "caption": "Before: Old water heater... After: New installation! Call (512) 575-3157...",
    "category": "water_heater",
    "beforePhotoUrl": "https://...",
    "afterPhotoUrl": "https://...",
    "jobDescription": "Water heater replacement",
    "totalScore": 18
  }
}
```

---

## 🔄 How It Selects "Best" Photo

The system chooses based on:
1. **Highest combined quality score** (before + after photo scores)
2. **Never posted before** (unused composites only)
3. **Most recent creation date** (newest first)

---

## 🎯 Pro Tips

1. **Test first** - Use Option 2 (manual trigger) to test before setting up weekly automation
2. **Check timing** - Schedule posts when your audience is most active (Monday 10am is great!)
3. **Monitor results** - The `mark-posted` step prevents duplicate posts
4. **Backup plan** - If no composites available, Zap will stop gracefully (no error posts)

---

## 🔧 Troubleshooting

### "No unused composites available"
- Import more photos from Google Drive
- Create before/after composites manually
- Check that photos aren't already marked as posted

### Facebook post failed
- Verify Facebook Pages connection is active
- Check that photo URL is publicly accessible
- Ensure your page allows photo posts

### Composite not marked as posted
- Check that Step 5 (mark-posted) completed successfully
- Verify `compositeId` was mapped correctly
- Check logs in Replit

---

## 📈 Instagram Too?

Facebook Pages API can also post to connected Instagram accounts:

1. Connect Instagram Business account to your Facebook Page
2. In Step 4, enable "Post to Instagram" option
3. Update Step 5 to include `instagramPostId` mapping

---

## 🎊 You're Done!

Your plumbing business now has:
- ✅ Automated weekly social media posts
- ✅ Professional before/after content
- ✅ AI-generated engaging captions
- ✅ No manual work required!

Just keep adding photos via CompanyCam or Google Drive, and Zapier handles the rest! 🚀
