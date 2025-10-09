# Zapier Photo Webhook Integration

## 🎯 Overview
This webhook allows you to automatically send job photos from any source (ServiceTitan, CompanyCam, Google Drive, etc.) to your Economy Plumbing website, where they'll be:
- ✅ Analyzed by AI for quality (rejects blurry/irrelevant photos automatically)
- ✅ Auto-categorized (water heater, drain, leak, etc.)
- ✅ Stored in database
- ✅ Available for before/after composites
- ✅ Auto-posted to Facebook/Instagram weekly

## 📍 Webhook URL
```
https://your-replit-app.replit.app/api/photos/webhook
```

## 📤 How to Send Photos

### Option 1: Single Photo
```json
{
  "photoUrl": "https://example.com/photo.jpg",
  "jobId": "12345",
  "jobDescription": "Water heater replacement",
  "customerName": "John Smith"
}
```

### Option 2: Batch of Photos
```json
{
  "photos": [
    {
      "photoUrl": "https://example.com/photo1.jpg",
      "jobId": "12345",
      "jobDescription": "Before photo"
    },
    {
      "photoUrl": "https://example.com/photo2.jpg",
      "jobId": "12345",
      "jobDescription": "After photo"
    }
  ]
}
```

## 🔧 Zapier Setup Instructions

### Step 1: Create a Zap
1. Go to [Zapier](https://zapier.com) and click "Create Zap"
2. Choose your trigger app (examples below)

### Step 2: Choose Your Trigger
Pick one based on where your photos come from:

**Option A: ServiceTitan**
- Trigger: "New Job Completed" or "Job Status Changed"
- This fires when a job is marked complete

**Option B: CompanyCam**
- Trigger: "New Photo" or "Project Updated"
- This fires when photos are uploaded

**Option C: Google Drive**
- Trigger: "New File in Folder"
- Create a folder where photos are uploaded

**Option D: Email**
- Trigger: "New Email in Gmail"
- Techs email photos after jobs

### Step 3: Add Webhook Action
1. Click "+" to add an action
2. Search for "Webhooks by Zapier"
3. Choose "POST" action
4. Configure:
   - **URL**: `https://your-replit-app.replit.app/api/photos/webhook`
   - **Method**: POST
   - **Data** (JSON format):
     ```
     photoUrl: [INSERT PHOTO URL FROM TRIGGER]
     jobId: [INSERT JOB ID FROM TRIGGER]
     jobDescription: [INSERT JOB DESCRIPTION FROM TRIGGER]
     ```

### Step 4: Map Your Fields
Map data from your trigger to the webhook fields:

**Example with ServiceTitan:**
- `photoUrl` → Job Attachments > Photo URL
- `jobId` → Job > ID
- `jobDescription` → Job > Summary or Job Type

**Example with Google Drive:**
- `photoUrl` → New File > Web View Link
- `jobId` → New File > Name (extract job number)
- `jobDescription` → New File > Parent Folder Name

### Step 5: Test & Turn On
1. Click "Test" to send a sample photo
2. Check the response - you should see:
   ```json
   {
     "success": true,
     "imported": 1,
     "rejected": 0,
     "message": "Successfully imported 1 quality photos..."
   }
   ```
3. Turn on your Zap!

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "imported": 2,
  "rejected": 1,
  "photos": [
    {
      "id": "...",
      "photoUrl": "https://...",
      "category": "water_heater",
      "qualityScore": 8,
      "aiDescription": "Clear photo of tankless water heater installation..."
    }
  ],
  "rejectedPhotos": [
    {
      "photoUrl": "https://...",
      "reason": "Photo is too blurry and out of focus",
      "score": 3
    }
  ],
  "message": "Successfully imported 2 quality photos. Rejected 1 low-quality/irrelevant photos."
}
```

### Error Response
```json
{
  "message": "Photo URL is required. Send either 'photoUrl' or 'photos' array..."
}
```

## 🤖 AI Quality Filter

The AI automatically analyzes each photo and **rejects** photos that are:
- ❌ Blurry, out of focus, or dark
- ❌ Accidental screenshots or personal photos
- ❌ Too close-up or too far away
- ❌ Unrelated to plumbing work
- ❌ Quality score below 7/10

The AI **keeps** photos that show:
- ✅ Clear plumbing work in progress
- ✅ Before/after comparisons
- ✅ Specific fixtures (water heaters, pipes, drains)
- ✅ Problems being repaired
- ✅ Professional installation work

## 📸 Photo Categories

Photos are automatically categorized into:
- `water_heater` - Water heater installations/repairs
- `drain` - Drain cleaning/clogs
- `leak` - Leak repairs
- `toilet` - Toilet repairs/installations
- `faucet` - Faucet and sink work
- `gas` - Gas line work
- `backflow` - Backflow prevention
- `commercial` - Commercial plumbing
- `general` - General plumbing work

## 🎨 What Happens Next?

Once photos are imported:

1. **AI Analysis** - Photos analyzed for quality (15-30 seconds per photo)
2. **Database Storage** - High-quality photos saved with AI descriptions
3. **Before/After Detection** - System can detect pairs from same job
4. **Social Media Queue** - Best photos queued for weekly Facebook/Instagram posts
5. **Blog Integration** - Photos available for blog posts

## 🔍 Advanced Examples

### Example 1: Filter by Job Type
Only send photos from certain job types:

**Zap Filter Step:**
- Only continue if...
- Job Type contains "Water Heater" OR "Tankless"

### Example 2: Batch Multiple Photos
Send all photos from a completed job at once:

**Zap Formatter Step:**
1. Use "Utilities > Line Item to Text" to combine photo URLs
2. Create array in webhook:
   ```
   photos: [
     { "photoUrl": "url1", "jobId": "123" },
     { "photoUrl": "url2", "jobId": "123" }
   ]
   ```

### Example 3: Add Custom Tags
Include additional context:

```json
{
  "photoUrl": "https://...",
  "jobId": "12345",
  "jobDescription": "Emergency water heater replacement - Bradford White 50gal",
  "customerName": "Austin HomeBuilder LLC"
}
```

## 🚨 Troubleshooting

### "Photo URL is required" Error
- Make sure `photoUrl` field is populated
- Check that the URL is publicly accessible
- Verify photo file is .jpg, .jpeg, or .png

### "Photo import failed" Error
- Photo URL might be private/requires authentication
- Image file might be corrupted
- OpenAI API might be rate-limited

### Photos Rejected by AI
- Normal! AI rejects 30-50% of photos
- Rejected photos are logged in response
- Check `rejectedPhotos` array for reasons

### No Photos Showing Up
1. Check Zap history - did it run?
2. Check webhook response - were photos accepted?
3. Query database: `GET /api/photos?category=water_heater`

## 📞 Support

If you need help setting up your Zap or troubleshooting, check the response messages - they're designed to be helpful and explain exactly what went wrong.

## 🎯 Recommended Zap Triggers

**Best for ServiceTitan Users:**
- Trigger: "Job Status Changed to Complete"
- Filter: Only jobs with photos attached
- Result: Automatic photo import for every completed job

**Best for CompanyCam Users:**
- Trigger: "New Photo Added to Project"
- Result: Real-time photo import as techs upload

**Best for Manual Upload:**
- Trigger: "New File in Google Drive Folder"
- Create a "Job Photos" folder
- Techs upload there after jobs
- Result: Automatic processing

---

**Questions?** The webhook is fully operational and ready to receive photos from Zapier! 🚀
