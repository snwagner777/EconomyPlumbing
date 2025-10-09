import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ProductionPhotoAnalysis {
  isProductionQuality: boolean; // Whether photo is good enough to show customers
  qualityScore: number; // 0-100
  qualityReason: string; // Why it passed/failed quality check
  category: string; // 'water-heater', 'drain-cleaning', 'leak-repair', etc.
  description: string; // What the photo shows
  tags: string[]; // Descriptive tags
  focalPointX: number; // 0-100 (percentage from left)
  focalPointY: number; // 0-100 (percentage from top)
  focalPointReason: string; // Why this focal point was chosen
}

const PLUMBING_CATEGORIES = [
  'water-heater',
  'drain-cleaning', 
  'leak-repair',
  'pipe-repair',
  'faucet-repair',
  'toilet-repair',
  'gas-line',
  'sewer-line',
  'backflow-prevention',
  'commercial-plumbing',
  'general-plumbing'
];

export async function analyzeProductionPhoto(imageBuffer: Buffer): Promise<ProductionPhotoAnalysis> {
  const base64Image = imageBuffer.toString('base64');
  const imageUrl = `data:image/jpeg;base64,${base64Image}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a professional plumbing marketing expert analyzing job site photos for customer-facing marketing materials (website, blog posts, social media).

ANALYZE THIS PHOTO FOR PRODUCTION QUALITY:

1. PRODUCTION QUALITY CHECK (is this suitable to show customers?):
   - ✅ GOOD: Any plumbing work photo including installations, repairs, before/after, work in progress, under-sink work, water heaters, fixtures - even if lighting isn't perfect or area is slightly cluttered
   - ❌ BAD: ONLY reject if it's a close-up of a rating plate/serial number, an extreme close-up showing just a part number/label, or so blurry you can't tell what it is at all
   
   BE LENIENT - Accept most real plumbing work photos. Only reject obvious technical detail shots.

2. FOCAL POINT DETECTION:
   - Identify the main subject (the most important/interesting part)
   - Provide X,Y coordinates as percentages (0-100) from top-left corner
   - Example: Water heater in center = X:50, Y:50
   - Example: Before/after split with "after" on right = X:75, Y:50

3. CATEGORIZATION:
   Choose the most specific category: ${PLUMBING_CATEGORIES.join(', ')}

4. DESCRIPTION & TAGS:
   - Clear description of what's shown
   - Relevant tags for searchability

Respond in this EXACT JSON format:
{
  "isProductionQuality": true or false,
  "qualityScore": 0-100,
  "qualityReason": "Specific reason why this photo is/isn't production quality",
  "category": "one of the categories above",
  "description": "Clear description of photo",
  "tags": ["tag1", "tag2", "tag3"],
  "focalPointX": 0-100,
  "focalPointY": 0-100,
  "focalPointReason": "Why this focal point (e.g. 'Water heater is centered', 'Completed faucet installation on right side')"
}`
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high"
            }
          }
        ]
      }
    ],
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim();
  }

  const analysis = JSON.parse(jsonStr);

  // Validate and return
  return {
    isProductionQuality: analysis.isProductionQuality ?? false,
    qualityScore: Math.min(100, Math.max(0, analysis.qualityScore ?? 0)),
    qualityReason: analysis.qualityReason || 'No reason provided',
    category: PLUMBING_CATEGORIES.includes(analysis.category) 
      ? analysis.category 
      : 'general-plumbing',
    description: analysis.description || 'Plumbing photo',
    tags: Array.isArray(analysis.tags) ? analysis.tags : [],
    focalPointX: Math.min(100, Math.max(0, analysis.focalPointX ?? 50)),
    focalPointY: Math.min(100, Math.max(0, analysis.focalPointY ?? 50)),
    focalPointReason: analysis.focalPointReason || 'Center of image'
  };
}
