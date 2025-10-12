import OpenAI from "openai";
import sharp from "sharp";
import type { CompanyCamPhoto, InsertBeforeAfterComposite } from "@shared/schema";
import path from "path";
import fs from "fs/promises";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface BeforeAfterPair {
  beforePhoto: CompanyCamPhoto;
  afterPhoto: CompanyCamPhoto;
  confidence: number; // 0-1
  reasoning: string;
}

/**
 * Convert local file path to base64 data URI for OpenAI
 */
async function filePathToBase64(filePath: string): Promise<string> {
  // If it's already a public URL or base64, return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath;
  }

  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  
  // Read file from local filesystem
  const buffer = await fs.readFile(cleanPath);
  
  // Determine MIME type from file extension
  const ext = path.extname(cleanPath).toLowerCase();
  const mimeType = ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg';
  
  // Convert to base64 data URI
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Use OpenAI to detect which photos are before/after pairs from the same job
 */
export async function detectBeforeAfterPairs(photos: CompanyCamPhoto[]): Promise<BeforeAfterPair[]> {
  if (photos.length < 2) return [];

  console.log(`[Before/After] Analyzing ${photos.length} photos for before/after pairs...`);

  const pairs: BeforeAfterPair[] = [];

  // Analyze photos in groups to find before/after pairs
  for (let i = 0; i < photos.length; i++) {
    for (let j = i + 1; j < photos.length; j++) {
      const photo1 = photos[i];
      const photo2 = photos[j];

      // Skip if different categories (probably not before/after of same thing)
      if (photo1.category !== photo2.category) continue;

      try {
        // Convert local file paths to base64 for OpenAI
        const photo1Url = await filePathToBase64(photo1.photoUrl);
        const photo2Url = await filePathToBase64(photo2.photoUrl);

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert at analyzing plumbing job photos. Determine if two photos show the same location/fixture in before and after states. Look for:
- Same location (walls, floor, fixtures in same position)
- Same plumbing fixture or problem area
- Evidence of work being done (old vs new equipment, problem resolved, etc.)

Respond with JSON:
{
  "isBeforeAfter": boolean,
  "confidence": number (0-1),
  "reasoning": "brief explanation",
  "whichIsBefore": 1 or 2 (which photo is the before state)
}`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Photo 1: ${photo1.aiDescription}\nPhoto 2: ${photo2.aiDescription}\n\nAre these before/after photos of the same plumbing work?`
                },
                {
                  type: "image_url",
                  image_url: { url: photo1Url, detail: "low" }
                },
                {
                  type: "image_url",
                  image_url: { url: photo2Url, detail: "low" }
                }
              ]
            }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 300,
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        if (result.isBeforeAfter && result.confidence > 0.7) {
          pairs.push({
            beforePhoto: result.whichIsBefore === 1 ? photo1 : photo2,
            afterPhoto: result.whichIsBefore === 1 ? photo2 : photo1,
            confidence: result.confidence,
            reasoning: result.reasoning,
          });

          console.log(`[Before/After] ✅ Found pair (${result.confidence * 100}% confident): ${result.reasoning}`);
        }
      } catch (error) {
        console.error(`[Before/After] Error analyzing pair:`, error);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return pairs;
}

/**
 * Generate a social media caption for a before/after photo
 */
async function generateCaption(pair: BeforeAfterPair): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a social media manager for Economy Plumbing Services, a trusted plumbing company serving Austin and Marble Falls, TX. Write engaging Facebook/Instagram posts for before/after photos that:

1. Explain what the problem was and what we did to fix it (2-3 sentences)
2. Promote our professional plumbing services 
3. Include a call-to-action
4. End with contact info and relevant hashtags

REQUIRED: Always end the post with:
"📞 Call us: 512.575.3157
🌐 Visit: https://www.plumbersthatcare.com/?utm=facebook"

Be conversational, helpful, and professional. Total length should be 250-350 characters.`
        },
        {
          role: "user",
          content: `Before: ${pair.beforePhoto.aiDescription}\nAfter: ${pair.afterPhoto.aiDescription}\n\nWrite a Facebook/Instagram post for this before/after photo.`
        }
      ],
      max_completion_tokens: 250,
    });

    const aiCaption = response.choices[0].message.content || "";
    
    // Ensure contact info is always included
    if (!aiCaption.includes("512.575.3157")) {
      return `${aiCaption}\n\n📞 Call us: 512.575.3157\n🌐 Visit: https://www.plumbersthatcare.com/?utm=facebook`;
    }
    
    return aiCaption;
  } catch (error) {
    console.error(`[Before/After] Error generating caption:`, error);
    return `Before and after! Our expert plumbers solved another problem. Quality plumbing services in Austin & Marble Falls.\n\n📞 Call us: 512.575.3157\n🌐 Visit: https://www.plumbersthatcare.com/?utm=facebook`;
  }
}

/**
 * Download image from URL or object storage path
 * Handles both public and private object storage paths
 */
async function downloadImage(url: string): Promise<Buffer> {
  console.log(`[Compositor] Downloading image: ${url}`);
  
  // Handle object storage paths (e.g., /replit-objstore-xxx/.private/... or /replit-objstore-xxx/public/...)
  if (url.startsWith('/replit-objstore-')) {
    console.log(`[Compositor] Detected object storage path`);
    const { ObjectStorageService } = await import('../objectStorage');
    const objectStorageService = new ObjectStorageService();
    
    // For private paths, use direct bucket access (bypasses HTTP auth)
    const buffer = await objectStorageService.downloadBuffer(url);
    
    if (!buffer) {
      console.error(`[Compositor] downloadBuffer returned null for: ${url}`);
      throw new Error(`Failed to download from object storage: ${url}`);
    }
    
    console.log(`[Compositor] Successfully downloaded ${buffer.length} bytes from object storage`);
    return buffer;
  }
  
  // Handle HTTP(S) URLs
  console.log(`[Compositor] Downloading from HTTP(S): ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`[Compositor] HTTP download failed with status ${response.status}: ${response.statusText}`);
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`[Compositor] Successfully downloaded ${buffer.length} bytes from HTTP`);
  return buffer;
}

/**
 * Detect focal point (main subject area) in image using OpenAI Vision
 * Returns normalized coordinates (0-1) for the focal point center
 */
async function detectFocalPoint(imageBuffer: Buffer): Promise<{ x: number; y: number } | null> {
  try {
    console.log(`[Focal Point] Analyzing image for focal point...`);
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    const metadata = await sharp(imageBuffer).metadata();
    const mimeType = metadata.format === 'png' ? 'image/png' : metadata.format === 'webp' ? 'image/webp' : 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64Image}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a computer vision expert analyzing plumbing work photos. Your task is to identify the main focal point - the most important subject that should be centered when cropping the image for a polaroid-style frame.

Look for:
- The primary plumbing fixture, pipe, or equipment being worked on
- The main problem area or repair location
- The most visually important element

Return the focal point as normalized coordinates (0 to 1 range) where:
- x: 0 = left edge, 0.5 = horizontal center, 1 = right edge
- y: 0 = top edge, 0.5 = vertical center, 1 = bottom edge

Respond ONLY with a JSON object: {"x": 0.5, "y": 0.5}

If the image has no clear focal point (blank, too dark, etc.), respond with: {"x": 0.5, "y": 0.5} for center crop.`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUri }
            },
            {
              type: "text",
              text: "Identify the focal point coordinates for this plumbing photo."
            }
          ]
        }
      ],
      max_completion_tokens: 100,
    });

    const content = response.choices[0].message.content || "";
    console.log(`[Focal Point] OpenAI response: ${content}`);
    
    // Parse the JSON response
    const match = content.match(/\{[^}]+\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        // Clamp values to 0-1 range
        const x = Math.max(0, Math.min(1, parsed.x));
        const y = Math.max(0, Math.min(1, parsed.y));
        console.log(`[Focal Point] ✅ Detected focal point at (${x}, ${y})`);
        return { x, y };
      }
    }
    
    console.log(`[Focal Point] Could not parse focal point, using center`);
    return { x: 0.5, y: 0.5 };
  } catch (error) {
    console.error(`[Focal Point] Error detecting focal point:`, error);
    // Default to center if detection fails
    return { x: 0.5, y: 0.5 };
  }
}

/**
 * Create a polaroid-style before/after composite image
 */
export async function createBeforeAfterComposite(
  beforeUrl: string,
  afterUrl: string,
  outputPath: string
): Promise<string> {
  console.log(`[Compositor] Creating before/after composite...`);

  // Download both images
  const beforeBuffer = await downloadImage(beforeUrl);
  const afterBuffer = await downloadImage(afterUrl);

  // Detect focal points for intelligent cropping
  console.log(`[Compositor] Detecting focal points for smart positioning...`);
  const beforeFocalPoint = await detectFocalPoint(beforeBuffer);
  const afterFocalPoint = await detectFocalPoint(afterBuffer);

  // Resize images to consistent size (800x600 for each photo)
  const photoWidth = 800;
  const photoHeight = 600;

  // Convert normalized focal points (0-1) to sharp position strings
  const getFocalPosition = (focal: { x: number; y: number } | null): string => {
    if (!focal) return 'center';
    
    // Determine position based on focal point
    const xPos = focal.x < 0.33 ? 'left' : focal.x > 0.67 ? 'right' : 'centre';
    const yPos = focal.y < 0.33 ? 'top' : focal.y > 0.67 ? 'bottom' : 'centre';
    
    // Combine into position string (e.g., "left top", "centre", "right bottom")
    if (xPos === 'centre' && yPos === 'centre') return 'centre';
    if (xPos === 'centre') return yPos;
    if (yPos === 'centre') return xPos;
    return `${yPos} ${xPos}`;
  };

  const beforePosition = getFocalPosition(beforeFocalPoint);
  const afterPosition = getFocalPosition(afterFocalPoint);
  
  console.log(`[Compositor] Before photo focal position: ${beforePosition}`);
  console.log(`[Compositor] After photo focal position: ${afterPosition}`);

  const beforeImage = await sharp(beforeBuffer)
    .resize(photoWidth, photoHeight, { 
      fit: "cover",
      position: beforePosition as any
    })
    .toBuffer();

  const afterImage = await sharp(afterBuffer)
    .resize(photoWidth, photoHeight, { 
      fit: "cover",
      position: afterPosition as any
    })
    .toBuffer();

  // Create polaroid-style frames
  const frameMargin = 40; // White border around photo
  const labelHeight = 80; // Space for "BEFORE" / "AFTER" text
  const frameWidth = photoWidth + (frameMargin * 2);
  const frameHeight = photoHeight + frameMargin + labelHeight;

  // Create SVG overlays for labels
  const createLabelSvg = (text: string) => `
    <svg width="${frameWidth}" height="${frameHeight}">
      <text 
        x="${frameWidth / 2}" 
        y="${photoHeight + frameMargin + 50}" 
        font-family="Arial, sans-serif" 
        font-size="36" 
        font-weight="bold" 
        fill="#1E88E5" 
        text-anchor="middle"
      >${text}</text>
    </svg>
  `;

  // Create polaroid frames with labels
  const beforeFrame = await sharp({
    create: {
      width: frameWidth,
      height: frameHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    {
      input: beforeImage,
      top: frameMargin,
      left: frameMargin
    },
    {
      input: Buffer.from(createLabelSvg('BEFORE')),
      top: 0,
      left: 0,
      blend: 'over'
    }
  ])
  .png()
  .toBuffer();

  const afterFrame = await sharp({
    create: {
      width: frameWidth,
      height: frameHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    {
      input: afterImage,
      top: frameMargin,
      left: frameMargin
    },
    {
      input: Buffer.from(createLabelSvg('AFTER')),
      top: 0,
      left: 0,
      blend: 'over'
    }
  ])
  .png()
  .toBuffer();

  // Stack frames vertically with slight offset for polaroid effect
  const gap = 60;
  const totalHeight = (frameHeight * 2) + gap;
  const rotation = -3; // Slight rotation for bottom frame

  const composite = await sharp({
    create: {
      width: frameWidth + 100,
      height: totalHeight + 100,
      channels: 4,
      background: { r: 240, g: 240, b: 240, alpha: 1 }
    }
  })
  .composite([
    // Top frame (BEFORE) - slightly rotated
    {
      input: await sharp(beforeFrame).rotate(2).toBuffer(),
      top: 20,
      left: 50
    },
    // Bottom frame (AFTER) - slightly rotated opposite direction
    {
      input: await sharp(afterFrame).rotate(rotation).toBuffer(),
      top: frameHeight + gap,
      left: 30
    }
  ])
  .webp({ quality: 85 })
  .toFile(outputPath);

  console.log(`[Compositor] ✅ Composite created as WebP: ${outputPath}`);

  // Also save a JPEG version for RSS feeds and social media
  const jpegPath = outputPath.replace('.webp', '.jpg');
  await sharp({
    create: {
      width: frameWidth + 100,
      height: totalHeight + 100,
      channels: 4,
      background: { r: 240, g: 240, b: 240, alpha: 1 }
    }
  })
  .composite([
    {
      input: await sharp(beforeFrame).rotate(2).toBuffer(),
      top: 20,
      left: 50
    },
    {
      input: await sharp(afterFrame).rotate(rotation).toBuffer(),
      top: frameHeight + gap,
      left: 30
    }
  ])
  .jpeg({ quality: 90 })
  .toFile(jpegPath);

  console.log(`[Compositor] ✅ Composite also saved as JPEG: ${jpegPath}`);

  return outputPath;
}

/**
 * Process before/after pairs and create composites
 */
export async function processBeforeAfterPairs(
  photos: CompanyCamPhoto[],
  jobId: string
): Promise<InsertBeforeAfterComposite[]> {
  const pairs = await detectBeforeAfterPairs(photos);

  if (pairs.length === 0) {
    console.log(`[Before/After] No before/after pairs found in job ${jobId}`);
    return [];
  }

  console.log(`[Before/After] Found ${pairs.length} before/after pair(s) in job ${jobId}`);

  const composites: InsertBeforeAfterComposite[] = [];

  // Ensure composites directory exists
  const compositesDir = path.resolve(import.meta.dirname, '../../attached_assets/composites');
  await fs.mkdir(compositesDir, { recursive: true });

  for (const pair of pairs) {
    try {
      // Generate filename with .webp extension
      const filename = `before_after_${jobId}_${Date.now()}.webp`;
      const jpegFilename = filename.replace('.webp', '.jpg');
      const outputPath = path.join(compositesDir, filename);
      const compositeUrl = `/attached_assets/composites/${filename}`;
      const jpegCompositeUrl = `/attached_assets/composites/${jpegFilename}`;

      // Create composite image (saves both WebP and JPEG)
      await createBeforeAfterComposite(
        pair.beforePhoto.photoUrl,
        pair.afterPhoto.photoUrl,
        outputPath
      );

      // Generate caption
      const caption = await generateCaption(pair);

      composites.push({
        beforePhotoId: pair.beforePhoto.id,
        afterPhotoId: pair.afterPhoto.id,
        compositeUrl,
        jpegCompositeUrl,
        caption,
        category: pair.beforePhoto.category,
        jobId,
      });

      console.log(`[Before/After] ✅ Created composite (WebP & JPEG) with caption: "${caption}"`);
    } catch (error) {
      console.error(`[Before/After] Error creating composite:`, error);
    }
  }

  return composites;
}
