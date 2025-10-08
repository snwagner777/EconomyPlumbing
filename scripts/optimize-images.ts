import sharp from 'sharp';
import { readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

const QUALITY = 85; // WebP quality (85 is excellent balance)
const inputDir = 'attached_assets';
const outputDir = 'attached_assets/optimized';

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

async function convertToWebP(inputPath: string, outputPath: string) {
  try {
    await sharp(inputPath)
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(outputPath);
    
    const inputStats = statSync(inputPath);
    const outputStats = statSync(outputPath);
    const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
    
    console.log(`✓ ${basename(inputPath)} -> ${basename(outputPath)} (${savings}% smaller)`);
  } catch (error) {
    console.error(`✗ Failed to convert ${inputPath}:`, error);
  }
}

async function processDirectory(dir: string) {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory() && file !== 'optimized') {
      await processDirectory(fullPath);
    } else if (stat.isFile()) {
      const ext = extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        const baseNameWithoutExt = basename(file, ext);
        const outputPath = join(outputDir, `${baseNameWithoutExt}.webp`);
        
        // Only convert if WebP doesn't exist yet
        if (!existsSync(outputPath)) {
          await convertToWebP(fullPath, outputPath);
        }
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting image optimization...\n');
  await processDirectory(inputDir);
  console.log('\n✅ Image optimization complete!');
}

main().catch(console.error);
