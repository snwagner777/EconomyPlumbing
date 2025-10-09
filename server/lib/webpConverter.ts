import sharp from "sharp";
import fs from "fs";
import path from "path";

export interface WebPConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  originalSize?: number;
  webpSize?: number;
  savings?: number;
}

/**
 * Convert an image to WebP format
 * @param inputPath - Path to the input image
 * @param outputPath - Path where the WebP image should be saved
 * @param quality - WebP quality (0-100, default 85)
 * @returns Conversion result with file size information
 */
export async function convertToWebP(
  inputPath: string,
  outputPath: string,
  quality: number = 85
): Promise<WebPConversionResult> {
  try {
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      return {
        success: false,
        error: `Input file not found: ${inputPath}`
      };
    }

    // Get original file size
    const originalSize = fs.statSync(inputPath).size;

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert to WebP
    await sharp(inputPath)
      .webp({ quality })
      .toFile(outputPath);

    // Get WebP file size
    const webpSize = fs.statSync(outputPath).size;
    const savings = Math.round(((originalSize - webpSize) / originalSize) * 100);

    return {
      success: true,
      outputPath,
      originalSize,
      webpSize,
      savings
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during conversion"
    };
  }
}

/**
 * Convert an image to WebP and get the buffer (for direct upload to object storage)
 * @param inputPath - Path to the input image
 * @param quality - WebP quality (0-100, default 85)
 * @returns WebP buffer
 */
export async function convertToWebPBuffer(
  inputPath: string,
  quality: number = 85
): Promise<Buffer> {
  return await sharp(inputPath)
    .webp({ quality })
    .toBuffer();
}
