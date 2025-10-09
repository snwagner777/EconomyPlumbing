# Photo Quality Filtering System

## Overview
Automated AI-powered photo quality filtering system using OpenAI Vision (GPT-5) to analyze and filter ServiceTitan job photos before saving them for blog content and marketing materials.

## Architecture

### Components

1. **Photo Quality Analyzer** (`photoQualityAnalyzer.ts`)
   - Uses OpenAI GPT-5 Vision API with high-detail image analysis
   - Evaluates photos on quality (sharpness, lighting, composition)
   - Categorizes plumbing-related content
   - Returns quality score (1-10) and keep/reject decision

2. **ServiceTitan Photos Integration** (`serviceTitanPhotos.ts`)
   - Fetches photos from ServiceTitan Projects API
   - Processes photos through quality analyzer
   - Auto-categorizes based on AI analysis
   - Filters out poor-quality images

3. **Database Schema** (`shared/schema.ts`)
   - `companyCamPhotos` table with quality analysis fields:
     - `qualityAnalyzed`: boolean flag
     - `isGoodQuality`: AI assessment
     - `shouldKeep`: final decision
     - `qualityScore`: 1-10 rating
     - `qualityReasoning`: AI explanation
     - `analyzedAt`: timestamp

4. **API Endpoints** (`server/routes.ts`)
   - `POST /api/photos/analyze` - Test single photo analysis
   - `POST /api/photos/import` - Import and filter from ServiceTitan
   - `GET /api/photos` - Retrieve filtered photos by category

## Quality Criteria

### Photos are KEPT if they show:
- Clear plumbing work (water heaters, pipes, fixtures)
- Before/after comparisons
- Problem documentation (leaks, clogs, damage)
- Professional installation work
- Good lighting and sharp focus

### Photos are REJECTED if they:
- Are blurry, dark, or out of focus
- Show irrelevant content (personal photos, accidents)
- Are too close-up or too far away
- Contain unrelated subjects
- Are duplicate images

## Usage

### Test Single Photo
```bash
curl -X POST http://localhost:5000/api/photos/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "photoUrl": "https://example.com/photo.jpg",
    "description": "Water heater installation"
  }'
```

### Import from ServiceTitan
```bash
curl -X POST http://localhost:5000/api/photos/import \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "token": "BEARER_TOKEN",
    "jobDescription": "Emergency water heater replacement"
  }'
```

### Get Unused Photos by Category
```bash
curl "http://localhost:5000/api/photos?category=water_heater&unused=true"
```

## Photo Categories
- `water_heater` - Water heater installations/repairs
- `drain` - Drain cleaning and repair
- `leak` - Leak detection and repair
- `toilet` - Toilet repairs
- `faucet` - Faucet and sink work
- `gas` - Gas line work
- `backflow` - Backflow testing/prevention
- `commercial` - Commercial plumbing
- `general` - General plumbing work

## Error Handling

The system is designed to fail safely:
- If AI analysis fails, photo defaults to `shouldKeep: true`
- Errors are logged but don't stop the import process
- Photos that fail processing are skipped, not deleted

## Performance

- Batch processing with configurable concurrency (default: 3 photos at a time)
- 1-second delay between batches to respect rate limits
- Database upsert prevents duplicates

## Configuration

Required environment variables:
- `OPENAI_API_KEY` - OpenAI API key for Vision analysis
- `SERVICETITAN_TENANT_ID` - ServiceTitan tenant ID
- `SERVICETITAN_APP_KEY` - ServiceTitan app key

## Future Enhancements

1. **Background Job Processing**
   - Process photos asynchronously via queue
   - Retry failed analyses

2. **Batch Import CLI**
   - Command-line tool for bulk imports
   - Progress tracking and reporting

3. **Admin Dashboard**
   - Review and manually override AI decisions
   - View rejected photos
   - Bulk operations

4. **Advanced Filtering**
   - Duplicate detection using perceptual hashing
   - Face detection to remove photos with people
   - NSFW filtering

5. **Analytics**
   - Track quality scores over time
   - Identify projects with best photos
   - Category distribution stats
