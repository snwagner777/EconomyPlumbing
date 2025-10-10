import https from 'https';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { URL } from 'url';

interface LogoSource {
  businessName: string;
  fileName: string;
  sourceUrl: string;
  website: string;
}

const logoSources: LogoSource[] = [
  {
    businessName: 'Brakes Plus',
    fileName: 'brakes-plus.webp',
    sourceUrl: 'https://www.brakesplus.com/content/dam/brakes-plus/logo.png',
    website: 'https://www.brakesplus.com'
  },
  {
    businessName: 'Createscape Coworking',
    fileName: 'createscape.webp',
    sourceUrl: 'https://images.squarespace-cdn.com/content/v1/65494a011ce6870f03dad27c/4c9e5c6f-c6e4-4d64-b24e-ae8e15a73d76/Createscape_Logo_Black-02.png',
    website: 'https://www.createscapework.co'
  },
  {
    businessName: 'Denny\'s Restaurant',
    fileName: 'dennys.webp',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Denny%27s_logo.svg/2560px-Denny%27s_logo.svg.png',
    website: 'https://www.dennys.com'
  },
  {
    businessName: 'Dollar General',
    fileName: 'dollar-general.webp',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Dollar_General_Logo.svg/2560px-Dollar_General_Logo.svg.png',
    website: 'https://www.dollargeneral.com'
  },
  {
    businessName: 'Gyu-Kaku Japanese BBQ',
    fileName: 'gyu-kaku.webp',
    sourceUrl: 'https://www.gyu-kaku.com/wp-content/uploads/2017/02/gyukaku_logo1104_white_horizontal-copy-e1461718107174.png',
    website: 'https://www.gyu-kaku.com'
  },
  {
    businessName: 'Jacoby\'s Restaurant',
    fileName: 'jacobys.webp',
    sourceUrl: 'https://www.jacobysaustin.com/wp-content/uploads/2025/02/jacobys-Restaurant-web-logo@2x.png',
    website: 'https://www.jacobysaustin.com'
  },
  {
    businessName: 'Meals on Wheels Austin',
    fileName: 'meals-on-wheels.webp',
    sourceUrl: 'https://pbs.twimg.com/profile_images/1523318327743213568/E8hKtOYh_400x400.jpg',
    website: 'https://www.mealsonwheelscentraltexas.org'
  },
  {
    businessName: 'O\'Reilly Auto Parts',
    fileName: 'oreilly.webp',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/O%27Reilly_Auto_Parts_Logo.svg/2560px-O%27Reilly_Auto_Parts_Logo.svg.png',
    website: 'https://www.oreillyauto.com'
  },
  {
    businessName: 'Save The World Brewing',
    fileName: 'stw-brewing.webp',
    sourceUrl: 'https://stwbrewing.com/cdn/shop/files/STW_Logo_transparent_d1f1e22b-f41b-4fc8-adc8-4d97636a5a7b.png',
    website: 'https://stwbrewing.com'
  },
  {
    businessName: 'Take 5 Oil Change',
    fileName: 'take5.webp',
    sourceUrl: 'https://www.take5.com/wp-content/uploads/2023/08/T5_Logo_FullColor_RGB.png',
    website: 'https://www.take5.com'
  }
];

async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function processLogo(source: LogoSource): Promise<void> {
  const outputDir = path.join(process.cwd(), 'client', 'public', 'commercial-logos');
  const outputPath = path.join(outputDir, source.fileName);
  
  console.log(`\nProcessing ${source.businessName}...`);
  
  try {
    // Download the image
    console.log(`  Downloading from ${source.sourceUrl}...`);
    const buffer = await downloadImage(source.sourceUrl);
    
    // Process with Sharp - resize and convert to WebP
    await sharp(buffer)
      .resize(400, 200, {
        fit: 'inside',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .webp({ quality: 90 })
      .toFile(outputPath);
    
    console.log(`  ✅ Saved to ${outputPath}`);
  } catch (error) {
    console.error(`  ❌ Error: ${error}`);
    throw error;
  }
}

async function main() {
  console.log('🚀 Downloading and processing commercial customer logos...\n');
  
  const results: Array<{ name: string; fileName: string; website: string }> = [];
  
  for (const source of logoSources) {
    try {
      await processLogo(source);
      results.push({
        name: source.businessName,
        fileName: source.fileName,
        website: source.website
      });
    } catch (error) {
      console.error(`Failed to process ${source.businessName}`);
    }
  }
  
  console.log('\n\n📊 Processing complete!');
  console.log(`✅ Successfully processed ${results.length}/${logoSources.length} logos`);
  
  // Generate SQL update statements
  console.log('\n\n📝 SQL Update Statements:');
  for (const result of results) {
    const escapedName = result.name.replace(/'/g, "''");
    const logoUrl = `/commercial-logos/${result.fileName}`;
    console.log(`UPDATE commercial_customers SET logo_url = '${logoUrl}', website_url = '${result.website}' WHERE name = '${escapedName}';`);
  }
}

main().catch(console.error);
