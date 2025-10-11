import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Generates a high-quality Open Graph image for social media sharing
 * Creates a 1200x630 image with company branding
 */
export async function generateOGImage(): Promise<void> {
  const outputPath = path.join(process.cwd(), 'attached_assets', 'og-image-social.jpg');
  
  // Create a branded OG image with blue background
  const width = 1200;
  const height = 630;
  
  // Primary blue color from the brand
  const brandBlue = '#0066CC';
  
  try {
    // Create base image with gradient-like effect
    const svgImage = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background gradient -->
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${brandBlue};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#004C99;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)"/>
        
        <!-- Company Name -->
        <text x="600" y="250" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="white">
          Economy Plumbing Services
        </text>
        
        <!-- Tagline -->
        <text x="600" y="350" font-family="Arial, sans-serif" font-size="40" text-anchor="middle" fill="white" opacity="0.95">
          Austin &amp; Marble Falls Plumber
        </text>
        
        <!-- Phone Number -->
        <text x="600" y="440" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="white">
          (512) 698-6690
        </text>
        
        <!-- Website -->
        <text x="600" y="520" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="white" opacity="0.9">
          plumbersthatcare.com
        </text>
      </svg>
    `;
    
    // Generate the image
    await sharp(Buffer.from(svgImage))
      .jpeg({ quality: 95, progressive: true })
      .toFile(outputPath);
    
    console.log(`[OG Image] Generated new Open Graph image at ${outputPath}`);
    
    // Verify file size
    const stats = fs.statSync(outputPath);
    console.log(`[OG Image] File size: ${Math.round(stats.size / 1024)}KB`);
    
  } catch (error) {
    console.error('[OG Image] Error generating Open Graph image:', error);
    throw error;
  }
}
