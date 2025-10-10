// Create optimized Open Graph image from logo (1200x630px with proper aspect ratio)
import sharp from 'sharp';
import { resolve } from 'path';
import { existsSync } from 'fs';

async function createOGImage() {
  const logoPath = resolve('./attached_assets/logo.jpg');
  const ogImagePath = resolve('./attached_assets/og-image-social.jpg');

  if (!existsSync(logoPath)) {
    console.error('❌ Logo file not found at:', logoPath);
    process.exit(1);
  }

  try {
    // Read logo metadata to get dimensions
    const logoMetadata = await sharp(logoPath).metadata();
    console.log(`📐 Original logo dimensions: ${logoMetadata.width}x${logoMetadata.height}`);

    // Create 1200x630 OG image with logo centered on branded background
    // Use a subtle gradient background with brand colors
    const ogWidth = 1200;
    const ogHeight = 630;
    const logoSize = 400; // Logo will be 400x400 centered

    // Create the background with gradient
    const background = await sharp({
      create: {
        width: ogWidth,
        height: ogHeight,
        channels: 4,
        background: { r: 30, g: 58, b: 138, alpha: 1 } // Primary blue color
      }
    })
    .png()
    .toBuffer();

    // Resize logo to fit nicely in the OG image
    const resizedLogo = await sharp(logoPath)
      .resize(logoSize, logoSize, { 
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    // Composite logo onto background (centered)
    await sharp(background)
      .composite([{
        input: resizedLogo,
        gravity: 'center'
      }])
      .jpeg({ quality: 90 })
      .toFile(ogImagePath);

    const finalMetadata = await sharp(ogImagePath).metadata();
    const fileSizeKB = Math.round((finalMetadata.size || 0) / 1024);

    console.log('✅ Open Graph image created successfully!');
    console.log(`📏 Dimensions: ${finalMetadata.width}x${finalMetadata.height}px`);
    console.log(`💾 File size: ${fileSizeKB}KB`);
    console.log(`📍 Saved to: ${ogImagePath}`);
    console.log('\n🎯 Optimal for social sharing: Facebook, Twitter, LinkedIn, iMessage');

  } catch (error) {
    console.error('❌ Error creating OG image:', error);
    process.exit(1);
  }
}

createOGImage();
