# Google Drive Photo Import System

## Overview
Import plumbing job photos from Google Drive, automatically analyze quality with AI, categorize by job type, and optionally create before/after composites for social media.

## 🚀 Quick Start

### Step 1: Find Your Google Drive Folder ID

1. Open Google Drive in your browser
2. Navigate to the folder with your plumbing photos
3. Look at the URL - it will look like:
   ```
   https://drive.google.com/drive/folders/1a2B3c4D5e6F7g8H9i0J
   ```
4. Copy the folder ID (the part after `/folders/`): `1a2B3c4D5e6F7g8H9i0J`

### Step 2: Import Photos

**Make a POST request to:**
```
POST https://workspace.replit.app/api/photos/import-google-drive
```

**Request body:**
```json
{
  "folderId": "1a2B3c4D5e6F7g8H9i0J",
  "createBeforeAfter": true
}
```

**Parameters:**
- `folderId` (required): Your Google Drive folder ID
- `createBeforeAfter` (optional, default: true): Automatically create before/after composites

## 📊 What Happens

The system will:

1. **Fetch all images** from your Google Drive folder
2. **AI Analysis** - Each photo is analyzed by OpenAI GPT-4o Vision:
   - Quality score (1-10)
   - Sharpness, lighting, composition
   - Relevance to plumbing work
   - Content categorization
3. **Smart Filtering** - Only keeps photos that:
   - Score 7/10 or higher
   - Show actual plumbing work (rejects product boxes, irrelevant images)
4. **Auto-Categorization** - Photos sorted into categories:
   - `water_heater` - Water heater installations/repairs
   - `drain` - Drain cleaning/repairs
   - `leak` - Leak repairs
   - `toilet` - Toilet installations/repairs
   - `faucet` - Faucet/sink work
   - `gas` - Gas line work
   - `backflow` - Backflow prevention
   - `commercial` - Commercial jobs
   - `general` - General plumbing
5. **Organization** - Photos organized by category with statistics
6. **Before/After Creation** - AI detects photo pairs from same job and creates professional composites

## 📤 Response Format

```json
{
  "success": true,
  "summary": {
    "totalImported": 15,
    "totalRejected": 3,
    "compositesCreated": 2,
    "categories": 4
  },
  "organization": {
    "byCategory": {
      "water_heater": [/* array of water heater photos */],
      "drain": [/* array of drain photos */],
      "leak": [/* array of leak photos */]
    },
    "categoryStats": {
      "water_heater": {
        "count": 8,
        "avgScore": 8.5
      },
      "drain": {
        "count": 4,
        "avgScore": 7.8
      },
      "leak": {
        "count": 3,
        "avgScore": 9.2
      }
    }
  },
  "photos": [/* array of all imported photos */],
  "composites": [/* array of created before/after composites */],
  "rejectedPhotos": [
    {
      "fileName": "product-box.jpg",
      "reason": "Shows product packaging, not actual plumbing work",
      "score": 6
    }
  ],
  "message": "Successfully imported 15 quality photos across 4 categories and created 2 before/after composites. Rejected 3 low-quality/irrelevant photos."
}
```

## 🎯 Use Cases

### 1. Bulk Photo Import
Import all your historical job photos from Google Drive at once:
```bash
curl -X POST https://workspace.replit.app/api/photos/import-google-drive \
  -H "Content-Type: application/json" \
  -d '{"folderId": "YOUR_FOLDER_ID", "createBeforeAfter": true}'
```

### 2. Quality Check Only
Import and analyze without creating composites:
```bash
curl -X POST https://workspace.replit.app/api/photos/import-google-drive \
  -H "Content-Type: application/json" \
  -d '{"folderId": "YOUR_FOLDER_ID", "createBeforeAfter": false}'
```

### 3. Category-Specific Folders
Organize photos in Google Drive by job type, then import each folder separately for better organization.

## 🔄 Integration with Zapier

You can automate this with Zapier:

1. **Trigger:** Google Drive - "New File in Folder"
2. **Action:** Webhooks - POST to `/api/photos/import-google-drive`
3. **Result:** Photos automatically imported and analyzed as they're added

## 📱 Before/After Composites

When `createBeforeAfter: true`, the system:

1. **Groups photos by category** (water heater, drain, etc.)
2. **AI detects matching pairs** from the same job
3. **Creates professional composites** with:
   - Polaroid-style layout
   - "BEFORE" and "AFTER" labels
   - High-quality output
4. **Generates AI captions** for social media:
   ```
   "Old leaking water heater → Brand new energy-efficient installation! 
   Call (512) 575-3157 or visit https://www.plumbersthatcare.com/?utm=facebook"
   ```

## 🎨 Photo Requirements

**Best Results:**
- Clear, well-lit photos
- Shows the actual work/fixture
- Minimum 800x600 resolution
- JPEG or PNG format

**Will Be Rejected:**
- Blurry or dark photos (score < 7)
- Product boxes or packaging
- Photos of people (not work)
- Irrelevant images

## 🔗 Related Endpoints

- **Get all photos:** `GET /api/photos?category=water_heater`
- **Get unused photos:** `GET /api/photos?unused=true`
- **Get composites:** `GET /api/before-after-composites`
- **Get best composite for posting:** `GET /api/social-media/best-composite`

## 💡 Pro Tips

1. **Organize before importing** - Structure your Google Drive folders by job type for better results
2. **Check rejected photos** - Review the `rejectedPhotos` array to see what didn't make the cut
3. **Use category stats** - The `categoryStats` show you which job types you photograph most
4. **Batch processing** - Import large folders during off-peak hours (AI analysis takes time)

## 🛠️ Troubleshooting

**"Google Drive not connected"**
- Ensure the Google Drive integration is set up in Replit
- Check that the connection is active

**"No images found"**
- Verify the folder ID is correct
- Ensure the folder contains image files (JPG, PNG)
- Check folder permissions

**"All photos rejected"**
- Photos might be too low quality
- Try images with better lighting and clarity
- Ensure photos show actual plumbing work

## 📈 Next Steps

After importing:
1. Use `/api/social-media/best-composite` to get the best photo for Facebook
2. Set up weekly auto-posting with Zapier
3. Review category statistics to understand your portfolio
4. Use high-scoring photos for your website and marketing
