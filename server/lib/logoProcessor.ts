import sharp from 'sharp';
import OpenAI from 'openai';
import { ObjectStorageService } from '../objectStorage';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const objectStorageService = new ObjectStorageService();

/**
 * Use OpenAI Vision to analyze the logo and create a smart mask
 */
async function createLogoMaskWithAI(logoBuffer: Buffer, width: number, height: number): Promise<Buffer> {
  console.log('[Logo Processor] Using OpenAI Vision to analyze logo...');
  
  // Convert logo to base64 for OpenAI
  const base64Image = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert at analyzing logos. Determine the dominant colors and describe which areas are the logo/brand mark vs background. Provide RGB threshold values to separate logo from background.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this logo and provide:
1. Primary logo/text colors (RGB values)
2. Background color (RGB values)
3. Is the background light or dark?
4. Recommended threshold strategy (color-based or luminance-based)

Respond in JSON:
{
  "logoColors": [{"r": 0-255, "g": 0-255, "b": 0-255}],
  "backgroundColor": {"r": 0-255, "g": 0-255, "b": 0-255},
  "backgroundType": "light" or "dark",
  "strategy": "keep_dark" or "keep_light" or "color_threshold"
}`
          },
          {
            type: "image_url",
            image_url: { url: base64Image, detail: "high" }
          }
        ]
      }
    ],
    response_format: { type: "json_object" },
  });

  const analysis = JSON.parse(response.choices[0].message.content || "{}");
  console.log('[Logo Processor] AI Analysis:', analysis);
  
  // Defensive fallback if AI doesn't provide background color
  const bgColor = analysis.backgroundColor || { r: 255, g: 255, b: 255 }; // Default to white
  
  // Create mask based on AI analysis
  const { data: rawPixels } = await sharp(logoBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const maskBuffer = Buffer.alloc(width * height);
  
  // Process each pixel to create mask
  for (let i = 0; i < rawPixels.length; i += 4) {
    const r = rawPixels[i];
    const g = rawPixels[i + 1];
    const b = rawPixels[i + 2];
    const pixelIndex = i / 4;
    
    // Calculate color distance from background
    const distance = Math.sqrt(
      Math.pow(r - bgColor.r, 2) +
      Math.pow(g - bgColor.g, 2) +
      Math.pow(b - bgColor.b, 2)
    );
    
    // If pixel is similar to background (distance < 50), make transparent
    // Otherwise, keep opaque
    maskBuffer[pixelIndex] = distance < 50 ? 0 : 255;
  }
  
  return maskBuffer;
}

/**
 * Process a logo to create a white monochrome version
 * - Removes background using OpenAI Vision analysis
 * - Converts to white silhouette on transparent background
 * - Optimizes for web display
 */
export async function processLogoToWhiteMonochrome(
  logoUrl: string,
  customerName: string
): Promise<string> {
  try {
    console.log(`[Logo Processor] Processing logo for ${customerName}: ${logoUrl}`);

    // Download the original logo
    const logoBuffer = await objectStorageService.downloadBuffer(logoUrl);

    if (!logoBuffer) {
      throw new Error('Failed to download logo from object storage');
    }

    // First, convert ALL formats (including SVG) to PNG for consistent processing
    // This ensures we have a single pipeline regardless of input format
    let normalizedBuffer = logoBuffer;
    let metadata;
    
    try {
      metadata = await sharp(logoBuffer).metadata();
      
      // Convert EVERYTHING to PNG for consistent processing pipeline
      // This includes: SVG, JPEG, WebP, GIF, AVIF, TIFF, BMP, etc.
      const currentFormat = metadata.format?.toLowerCase() || 'unknown';
      
      console.log(`[Logo Processor] Converting ${currentFormat.toUpperCase()} to PNG for processing...`);
      
      normalizedBuffer = await sharp(logoBuffer)
        .resize(800, 800, { // Reasonable size for logos
          fit: 'inside',
          withoutEnlargement: true
        })
        .png()
        .toBuffer();
      
      // Update metadata for the converted image
      metadata = await sharp(normalizedBuffer).metadata();
      console.log(`[Logo Processor] ✅ Converted to PNG successfully (${metadata.width}x${metadata.height})`);
    } catch (sharpError: any) {
      console.error(`[Logo Processor] Sharp error:`, sharpError);
      throw new Error(
        'Unable to process this image file. Please ensure it\'s a valid image format ' +
        '(PNG, JPEG, WebP, SVG, GIF, BMP, TIFF, etc.) and not corrupted.'
      );
    }
    
    const width = metadata.width || 400;
    const height = metadata.height || 200;
    
    // Process the image to create white monochrome version
    // Strategy: Check for transparency first, if none use AI to create mask
    
    // Step 1: Ensure alpha channel and extract it
    const { data: alphaBuffer, info: alphaInfo } = await sharp(normalizedBuffer)
      .ensureAlpha()
      .extractChannel(3)  // Extract alpha channel only
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Check if the logo has any transparency
    // If all alpha values are 255 (fully opaque), the logo has no transparency
    const hasTransparency = alphaBuffer.some(value => value < 255);
    
    let finalAlphaBuffer: Buffer;
    
    if (!hasTransparency) {
      console.log('[Logo Processor] No transparency found, using AI to create mask...');
      // Use AI to analyze and create a mask
      finalAlphaBuffer = await createLogoMaskWithAI(normalizedBuffer, width, height);
    } else {
      console.log('[Logo Processor] Transparency found, using existing alpha channel');
      finalAlphaBuffer = Buffer.from(alphaBuffer);
    }
    
    // Step 2: Create a solid white RGB image (3 channels)
    const whiteRgbBuffer = await sharp({
      create: {
        width: width,
        height: height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    }).raw().toBuffer();
    
    // Step 3: Join white RGB with final alpha to create white RGBA image
    const processedBuffer = await sharp(whiteRgbBuffer, {
      raw: {
        width: width,
        height: height,
        channels: 3
      }
    })
      .joinChannel(finalAlphaBuffer)  // Add alpha as 4th channel
      .resize(400, 200, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality: 90, lossless: false }) // WebP for smaller file sizes
      .toBuffer();

    // Upload the processed logo
    const searchPaths = objectStorageService.getPublicObjectSearchPaths();
    
    if (!searchPaths || searchPaths.length === 0) {
      throw new Error('Object storage public paths not configured. Please configure PUBLIC_OBJECT_SEARCH_PATHS.');
    }

    const basePath = searchPaths[0];
    const fileName = `logos/processed-${Date.now()}-${customerName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.webp`;
    const destinationPath = `${basePath}/${fileName}`;

    const uploadedPath = await objectStorageService.uploadBuffer(
      processedBuffer,
      destinationPath,
      'image/webp'
    );

    if (!uploadedPath) {
      throw new Error('Failed to upload processed logo to object storage');
    }

    console.log(`[Logo Processor] Successfully processed logo: ${uploadedPath}`);
    return uploadedPath;
  } catch (error) {
    console.error('[Logo Processor] Error processing logo:', error);
    throw new Error(`Failed to process logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
