import sharp from 'sharp';
import { processImage as convertHeic } from './heicConverter';

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Optimizes and converts images to WebP format with compression
 * @param input - Base64 string or Buffer containing the image
 * @param options - Optimization options
 * @returns Buffer containing optimized WebP image
 */
export async function optimizeImage(
  input: string | Buffer,
  options: OptimizeOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
    format = 'webp'
  } = options;

  try {
    // Step 1: Convert HEIC to JPEG if needed
    let buffer = await convertHeic(input);

    // Step 2: Optimize with Sharp
    let sharpInstance = sharp(buffer);

    // Get metadata to check if resize is needed
    const metadata = await sharpInstance.metadata();
    
    // Resize if image exceeds max dimensions
    if (metadata.width && metadata.height) {
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        console.log(`[Image Optimizer] Resizing from ${metadata.width}x${metadata.height} to fit ${maxWidth}x${maxHeight}`);
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }

    // Convert to target format with compression
    let optimized: Buffer;
    
    if (format === 'webp') {
      optimized = await sharpInstance
        .webp({ quality, effort: 4 })
        .toBuffer();
    } else if (format === 'jpeg') {
      optimized = await sharpInstance
        .jpeg({ quality, progressive: true })
        .toBuffer();
    } else {
      optimized = await sharpInstance
        .png({ quality, compressionLevel: 8 })
        .toBuffer();
    }

    const originalSize = buffer.length;
    const optimizedSize = optimized.length;
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`[Image Optimizer] Compressed ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(optimizedSize / 1024 / 1024).toFixed(2)}MB (${savings}% savings)`);

    return optimized;
  } catch (error) {
    console.error('[Image Optimizer] Error:', error);
    throw new Error('Failed to optimize image');
  }
}

/**
 * Detects the MIME type of an optimized image
 */
export function getOptimizedMimeType(format: 'webp' | 'jpeg' | 'png'): string {
  const mimeTypes = {
    webp: 'image/webp',
    jpeg: 'image/jpeg',
    png: 'image/png'
  };
  return mimeTypes[format];
}
