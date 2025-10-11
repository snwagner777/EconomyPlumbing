// @ts-ignore - heic-convert doesn't have type definitions
import heicConvert from 'heic-convert';

/**
 * Detects if a base64 string or buffer is a HEIC/HEIF image
 */
export function isHeicImage(input: string | Buffer): boolean {
  let buffer: Buffer;
  
  if (typeof input === 'string') {
    // Handle base64 data URLs
    const base64Data = input.includes(',') ? input.split(',')[1] : input;
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    buffer = input;
  }
  
  // Check for HEIC/HEIF magic bytes
  // HEIC files start with: 00 00 00 [size] 66 74 79 70 (ftyp)
  // Followed by: 68 65 69 63 (heic) or 68 65 69 78 (heix) or 68 65 76 63 (hevc)
  if (buffer.length < 12) return false;
  
  // Search for 'ftyp' magic bytes (66 74 79 70 in hex)
  const ftypBytes = Buffer.from([0x66, 0x74, 0x79, 0x70]);
  const ftypOffset = buffer.indexOf(ftypBytes);
  if (ftypOffset === -1 || ftypOffset > 12) return false;
  
  const brandOffset = ftypOffset + 4;
  if (buffer.length < brandOffset + 4) return false;
  
  const brand = buffer.toString('utf8', brandOffset, brandOffset + 4);
  return ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs'].includes(brand);
}

/**
 * Converts HEIC image to JPEG
 * @param input - Base64 string or Buffer containing HEIC image
 * @returns Buffer containing JPEG image
 */
export async function convertHeicToJpeg(input: string | Buffer): Promise<Buffer> {
  let buffer: Buffer;
  
  if (typeof input === 'string') {
    // Handle base64 data URLs
    const base64Data = input.includes(',') ? input.split(',')[1] : input;
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    buffer = input;
  }
  
  try {
    const outputBuffer = await heicConvert({
      buffer: buffer,
      format: 'JPEG',
      quality: 0.92 // High quality JPEG
    });
    
    return Buffer.from(outputBuffer);
  } catch (error) {
    console.error('HEIC conversion error:', error);
    throw new Error('Failed to convert HEIC image to JPEG');
  }
}

/**
 * Processes an image, converting HEIC to JPEG if needed
 * @param input - Base64 string or Buffer
 * @returns Buffer ready for upload
 */
export async function processImage(input: string | Buffer): Promise<Buffer> {
  if (isHeicImage(input)) {
    console.log('[HEIC] Converting HEIC image to JPEG...');
    return await convertHeicToJpeg(input);
  }
  
  // Not HEIC, return as-is
  if (typeof input === 'string') {
    const base64Data = input.includes(',') ? input.split(',')[1] : input;
    return Buffer.from(base64Data, 'base64');
  }
  
  return input;
}
