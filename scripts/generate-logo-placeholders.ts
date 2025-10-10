import fs from 'fs/promises';
import path from 'path';

interface LogoConfig {
  name: string;
  fileName: string;
  displayText: string;
  bgColor: string;
  textColor: string;
  website: string;
}

const logos: LogoConfig[] = [
  {
    name: "Brakes Plus",
    fileName: "brakes-plus.svg",
    displayText: "BRAKES PLUS",
    bgColor: "#1E3A8A",
    textColor: "#FFFFFF",
    website: "https://www.brakesplus.com"
  },
  {
    name: "Createscape Coworking",
    fileName: "createscape.svg",
    displayText: "CREATESCAPE",
    bgColor: "#0891B2",
    textColor: "#FFFFFF",
    website: "https://www.createscapework.co"
  },
  {
    name: "Denny's Restaurant",
    fileName: "dennys.svg",
    displayText: "DENNY'S",
    bgColor: "#DC2626",
    textColor: "#FEF08A",
    website: "https://www.dennys.com"
  },
  {
    name: "Dollar General",
    fileName: "dollar-general.svg",
    displayText: "DOLLAR GENERAL",
    bgColor: "#EAB308",
    textColor: "#000000",
    website: "https://www.dollargeneral.com"
  },
  {
    name: "Gyu-Kaku Japanese BBQ",
    fileName: "gyu-kaku.svg",
    displayText: "GYU-KAKU",
    bgColor: "#DC2626",
    textColor: "#FFFFFF",
    website: "https://www.gyu-kaku.com"
  },
  {
    name: "Jacoby's Restaurant",
    fileName: "jacobys.svg",
    displayText: "JACOBY'S",
    bgColor: "#92400E",
    textColor: "#FFFFFF",
    website: "https://www.jacobysaustin.com"
  },
  {
    name: "Meals on Wheels Austin",
    fileName: "meals-on-wheels.svg",
    displayText: "MEALS ON WHEELS",
    bgColor: "#EC4899",
    textColor: "#FFFFFF",
    website: "https://www.mealsonwheelscentraltexas.org"
  },
  {
    name: "O'Reilly Auto Parts",
    fileName: "oreilly.svg",
    displayText: "O'REILLY",
    bgColor: "#DC2626",
    textColor: "#FFFFFF",
    website: "https://www.oreillyauto.com"
  },
  {
    name: "Save The World Brewing",
    fileName: "stw-brewing.svg",
    displayText: "STW BREWING",
    bgColor: "#15803D",
    textColor: "#FFFFFF",
    website: "https://stwbrewing.com"
  },
  {
    name: "Take 5 Oil Change",
    fileName: "take5.svg",
    displayText: "TAKE 5",
    bgColor: "#EA580C",
    textColor: "#FFFFFF",
    website: "https://www.take5.com"
  }
];

function generateSVG(config: LogoConfig): string {
  const width = 400;
  const height = 200;
  const fontSize = config.displayText.length > 12 ? 32 : 40;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${config.bgColor}" rx="8"/>
  <text
    x="50%"
    y="50%"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="${config.textColor}"
    text-anchor="middle"
    dominant-baseline="middle"
    letter-spacing="1"
  >${config.displayText}</text>
</svg>`;
}

async function main() {
  const outputDir = path.join(process.cwd(), 'client', 'public', 'commercial-logos');
  
  console.log('🎨 Generating professional text-based logo placeholders...\n');
  
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });
  
  const results: Array<{ name: string; logoUrl: string; website: string }> = [];
  
  for (const config of logos) {
    const svg = generateSVG(config);
    const outputPath = path.join(outputDir, config.fileName);
    
    await fs.writeFile(outputPath, svg, 'utf-8');
    console.log(`✅ Created ${config.fileName}`);
    
    results.push({
      name: config.name,
      logoUrl: `/commercial-logos/${config.fileName}`,
      website: config.website
    });
  }
  
  console.log('\n\n📊 Generation complete!');
  console.log(`✅ Created ${results.length} logo placeholders\n`);
  
  console.log('📝 SQL Update Statements:\n');
  for (const result of results) {
    const escapedName = result.name.replace(/'/g, "''");
    console.log(`UPDATE commercial_customers SET logo_url = '${result.logoUrl}', website_url = '${result.website}' WHERE name = '${escapedName}';`);
  }
}

main().catch(console.error);
