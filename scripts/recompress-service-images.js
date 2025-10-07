import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { statSync, renameSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const images = [
  'Commercial_plumbing_services_bd7b6306.webp',
  'Drain_cleaning_professional_service_e8a953c5.webp',
  'Leak_repair_service_work_cb3145cc.webp'
];

async function recompressImages() {
  for (const image of images) {
    const inputPath = join(__dirname, '..', 'attached_assets', 'optimized', image);
    const outputPath = inputPath; // Overwrite the original

    try {
      const originalStats = statSync(inputPath);
      const metadata = await sharp(inputPath).metadata();
      
      console.log(`\nProcessing ${image}`);
      console.log(`Original: ${(originalStats.size / 1024).toFixed(1)} KB, dimensions: ${metadata.width}x${metadata.height}`);

      // Resize if needed and compress more aggressively
      // Service cards display at ~330px width, so 660px (2x for retina) is sufficient
      await sharp(inputPath)
        .resize(660, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ 
          quality: 72, // Lower quality for better compression
          effort: 6     // Higher effort for better compression
        })
        .toFile(outputPath + '.tmp');

      // Get new size
      const newStats = statSync(outputPath + '.tmp');
      const savings = ((originalStats.size - newStats.size) / originalStats.size * 100).toFixed(1);
      
      console.log(`New: ${(newStats.size / 1024).toFixed(1)} KB (${savings}% reduction)`);
      
      // Replace original
      renameSync(outputPath + '.tmp', outputPath);
      
    } catch (error) {
      console.error(`Error processing ${image}:`, error);
    }
  }
}

recompressImages();
