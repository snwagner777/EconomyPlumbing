import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const logoUrls = [
  { name: 'brakes-plus', url: 'https://s3.amazonaws.com/brakesplus.com-production/spree/logo/2/new-nav-logo.png' },
  { name: 'createscape', url: 'https://static.wixstatic.com/media/07d1ae_1e3bc9c50f7a4b49b4b40e82d67c5d73~mv2.png' },
  { name: 'dennys', url: 'https://logos-world.net/wp-content/uploads/2020/11/Dennys-Logo.png' },
  { name: 'dollar-general', url: 'https://logos-world.net/wp-content/uploads/2020/11/Dollar-General-Logo.png' },
  { name: 'oreilly', url: 'https://1000logos.net/wp-content/uploads/2021/06/OReilly-Auto-Parts-logo.png' },
  { name: 'take5', url: 'https://1000logos.net/wp-content/uploads/2023/06/Take-5-Oil-Change-Logo.png' },
  { name: 'stw-brewing', url: 'https://cdn.shopify.com/s/files/1/0578/2582/7773/files/STW_Logo_transparent_d1f1e22b-f41b-4fc8-adc8-4d97636a5a7b.png' },
  { name: 'meals-on-wheels', url: 'https://i0.wp.com/mowaustin.org/wp-content/uploads/2020/05/MOWLogo-header.png' }
];

async function downloadAndConvert(name: string, url: string) {
  const tempPath = `/tmp/${name}-temp.png`;
  const outputPath = `client/public/commercial-logos/${name}.webp`;
  
  console.log(`Processing ${name}...`);
  
  try {
    // Download with curl
    await execAsync(`curl -L -o "${tempPath}" "${url}" 2>/dev/null`);
    
    // Check if file was downloaded
    const stats = await fs.stat(tempPath);
    if (stats.size === 0) {
      console.log(`  ❌ Failed to download ${name}`);
      return false;
    }
    
    // Convert to WebP with sharp
    await sharp(tempPath)
      .resize(400, 200, {
        fit: 'inside',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .webp({ quality: 90 })
      .toFile(outputPath);
    
    // Clean up temp file
    await fs.unlink(tempPath);
    
    console.log(`  ✅ Saved ${name}.webp`);
    return true;
  } catch (error) {
    console.log(`  ❌ Error processing ${name}:`, error);
    try {
      await fs.unlink(tempPath);
    } catch {}
    return false;
  }
}

async function main() {
  console.log('Converting logos to WebP...\n');
  
  const results = await Promise.all(
    logoUrls.map(({ name, url }) => downloadAndConvert(name, url))
  );
  
  const successCount = results.filter(Boolean).length;
  console.log(`\n✅ Successfully converted ${successCount}/${logoUrls.length} logos`);
}

main().catch(console.error);
