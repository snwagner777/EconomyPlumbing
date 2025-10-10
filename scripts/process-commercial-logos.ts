import { Storage } from '@google-cloud/storage';
import { OpenAI } from 'openai';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const storage = new Storage();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface LogoMapping {
  businessName: string;
  fileName: string;
  website?: string;
}

const logoMappings: LogoMapping[] = [
  { businessName: 'Brakes Plus', fileName: 'brakes-plus.svg', website: 'https://www.brakesplus.com' },
  { businessName: 'Createscape Coworking', fileName: 'createscape.png', website: 'https://www.createscapework.co' },
  { businessName: 'Denny\'s Restaurant', fileName: 'dennys.svg', website: 'https://www.dennys.com' },
  { businessName: 'Dollar General', fileName: 'dollar-general.svg', website: 'https://www.dollargeneral.com' },
  { businessName: 'Gyu-Kaku Japanese BBQ', fileName: 'gyukaku.png', website: 'https://www.gyu-kaku.com' },
  { businessName: 'Jacoby\'s Restaurant', fileName: 'jacobys.png', website: 'https://www.jacobysaustin.com' },
  { businessName: 'Meals on Wheels Austin', fileName: 'meals-on-wheels.png', website: 'https://www.mealsonwheelscentraltexas.org' },
  { businessName: 'O\'Reilly Auto Parts', fileName: 'oreilly.svg', website: 'https://www.oreillyauto.com' },
  { businessName: 'Save The World Brewing', fileName: 'stw-brewing.png', website: 'https://stwbrewing.com' },
  { businessName: 'Take 5 Oil Change', fileName: 'take5.svg', website: 'https://www.take5.com' }
];

const LOGO_DIR = '/tmp/commercial-logos';
const BUCKET_NAME = 'replit-objstore-d3381c71-f557-457f-9913-e7cf7dce4d30';
const PUBLIC_DIR = 'public/commercial-logos';

async function processLogo(mapping: LogoMapping): Promise<string> {
  const inputPath = path.join(LOGO_DIR, mapping.fileName);
  const ext = path.extname(mapping.fileName);
  const baseName = path.basename(mapping.fileName, ext);
  const outputFileName = `${baseName}.webp`;
  const outputPath = path.join(LOGO_DIR, outputFileName);
  
  console.log(`\nProcessing ${mapping.businessName}...`);
  
  try {
    // Read the original file
    const fileBuffer = await fs.readFile(inputPath);
    
    // Check if it's an SVG (some SVGs might be malformed)
    if (ext === '.svg') {
      const svgContent = fileBuffer.toString();
      if (svgContent.length < 200) {
        console.log(`⚠️  SVG file for ${mapping.businessName} is too small, might be malformed. Skipping OpenAI processing.`);
        // Just convert to WebP at larger size
        await sharp(fileBuffer)
          .resize(400, 200, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .webp({ quality: 90 })
          .toFile(outputPath);
      } else {
        // Convert SVG to WebP
        await sharp(fileBuffer)
          .resize(400, 200, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .webp({ quality: 90 })
          .toFile(outputPath);
      }
    } else {
      // For PNG/JPG, resize and convert to WebP with transparency
      await sharp(fileBuffer)
        .resize(400, 200, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .webp({ quality: 90 })
        .toFile(outputPath);
    }
    
    // Upload to object storage
    const bucket = storage.bucket(BUCKET_NAME);
    const destPath = `${PUBLIC_DIR}/${outputFileName}`;
    
    await bucket.upload(outputPath, {
      destination: destPath,
      metadata: {
        cacheControl: 'public, max-age=31536000, immutable',
        contentType: 'image/webp'
      }
    });
    
    console.log(`✅ Uploaded ${mapping.businessName} to ${destPath}`);
    
    // Return the public URL
    return `/${BUCKET_NAME}/${destPath}`;
  } catch (error) {
    console.error(`❌ Error processing ${mapping.businessName}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Processing commercial customer logos...\n');
  
  const results: Array<{ name: string; logoUrl: string; website: string }> = [];
  
  for (const mapping of logoMappings) {
    try {
      const logoUrl = await processLogo(mapping);
      results.push({
        name: mapping.businessName,
        logoUrl,
        website: mapping.website || ''
      });
    } catch (error) {
      console.error(`Failed to process ${mapping.businessName}`);
    }
  }
  
  console.log('\n\n📊 Processing complete! Results:');
  console.log(JSON.stringify(results, null, 2));
  
  // Write results to a file for easy database update
  await fs.writeFile(
    '/tmp/logo-update-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n✅ Results saved to /tmp/logo-update-results.json');
}

main().catch(console.error);
