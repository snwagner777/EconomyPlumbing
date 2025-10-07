import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const optimizedDir = join(rootDir, 'attached_assets', 'optimized');

// Create optimized directory if it doesn't exist
if (!existsSync(optimizedDir)) {
  mkdirSync(optimizedDir, { recursive: true });
}

// Images to optimize
const imagesToOptimize = [
  // Service images - resize to 400px width (displayed at 330px, so 400px gives retina quality)
  {
    input: join(rootDir, 'attached_assets/generated_images/Commercial_plumbing_services_bd7b6306.png'),
    output: join(optimizedDir, 'Commercial_plumbing_services_bd7b6306.webp'),
    width: 400
  },
  {
    input: join(rootDir, 'attached_assets/generated_images/Drain_cleaning_professional_service_e8a953c5.png'),
    output: join(optimizedDir, 'Drain_cleaning_professional_service_e8a953c5.webp'),
    width: 400
  },
  {
    input: join(rootDir, 'attached_assets/generated_images/Leak_repair_service_work_cb3145cc.png'),
    output: join(optimizedDir, 'Leak_repair_service_work_cb3145cc.webp'),
    width: 400
  },
  {
    input: join(rootDir, 'attached_assets/generated_images/Toilet_and_faucet_installation_18dec30d.png'),
    output: join(optimizedDir, 'Toilet_and_faucet_installation_18dec30d.webp'),
    width: 400
  },
  {
    input: join(rootDir, 'attached_assets/generated_images/Tankless_water_heater_closeup_7279af49.png'),
    output: join(optimizedDir, 'Tankless_water_heater_closeup_7279af49.webp'),
    width: 400
  },
  // Logo - resize to 200px width (displayed at 85px, so 200px gives high DPI support)
  {
    input: join(rootDir, 'attached_assets/Economy Plumbing Services logo_1759801055079.jpg'),
    output: join(optimizedDir, 'Economy_Plumbing_Services_logo_1759801055079.webp'),
    width: 200
  }
];

async function optimizeImage(config) {
  try {
    const { input, output, width } = config;
    
    console.log(`Processing: ${input}`);
    
    await sharp(input)
      .resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toFile(output);
    
    console.log(`✓ Saved: ${output}`);
  } catch (error) {
    console.error(`✗ Error processing ${config.input}:`, error.message);
  }
}

async function main() {
  console.log('Starting image optimization...\n');
  
  for (const config of imagesToOptimize) {
    await optimizeImage(config);
  }
  
  console.log('\n✓ Image optimization complete!');
}

main();
