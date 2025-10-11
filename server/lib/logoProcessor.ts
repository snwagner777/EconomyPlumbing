import sharp from 'sharp';
import { ObjectStorageService } from '../objectStorage';

const objectStorageService = new ObjectStorageService();

/**
 * Process a logo to create a white monochrome version
 * - Removes background
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

    // Get image metadata
    const metadata = await sharp(logoBuffer).metadata();
    const width = metadata.width || 400;
    const height = metadata.height || 200;
    
    // Process the image to create white monochrome version
    // Strategy: Extract alpha channel, create white RGB, join them back together
    
    // Step 1: Ensure alpha channel and extract it
    const { data: alphaBuffer, info: alphaInfo } = await sharp(logoBuffer)
      .ensureAlpha()
      .extractChannel(3)  // Extract alpha channel only
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Check if the logo has any transparency
    // If all alpha values are 255 (fully opaque), the logo has no transparency
    const hasTransparency = alphaBuffer.some(value => value < 255);
    
    if (!hasTransparency) {
      throw new Error(
        'Logo must have a transparent background. Please upload a PNG file with transparency, ' +
        'or use an image editor to remove the background first.'
      );
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
    
    // Step 3: Join white RGB with extracted alpha to create white RGBA image
    const processedBuffer = await sharp(whiteRgbBuffer, {
      raw: {
        width: width,
        height: height,
        channels: 3
      }
    })
      .joinChannel(Buffer.from(alphaBuffer))  // Add alpha as 4th channel
      .resize(400, 200, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    // Upload the processed logo
    const searchPaths = objectStorageService.getPublicObjectSearchPaths();
    
    if (!searchPaths || searchPaths.length === 0) {
      throw new Error('Object storage public paths not configured. Please configure PUBLIC_OBJECT_SEARCH_PATHS.');
    }

    const basePath = searchPaths[0];
    const fileName = `logos/processed-${Date.now()}-${customerName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    const destinationPath = `${basePath}/${fileName}`;

    const uploadedPath = await objectStorageService.uploadBuffer(
      processedBuffer,
      destinationPath,
      'image/png'
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
