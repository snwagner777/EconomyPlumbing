import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { generatedPlumbingImages } from '@shared/schema';
import { desc, eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { ObjectStorageService } from '@/server/objectStorage';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL!,
});

const objectStorage = new ObjectStorageService();

const dogPrompts = [
  "Professional product photography of a Border Collie dog wearing red plumber overalls and yellow hard hat, using a pipe wrench to fix copper pipes in a basement utility room, focused intelligent expression, industrial setting with concrete walls, dramatic side lighting, highly detailed, photorealistic",
  "Professional product photography of a Bulldog wearing navy blue plumber uniform, installing a new garbage disposal under kitchen sink, muscular build, determined expression, modern granite countertop kitchen, professional lighting, highly detailed, photorealistic",
  "Professional product photography of a Dalmatian dog wearing plumber's coveralls with tool belt, checking water pressure gauge on outdoor spigot, spotted coat, suburban house exterior with garden, bright sunny day, highly detailed, photorealistic",
  "Professional product photography of a Poodle dog with groomed fur wearing a white plumber's uniform, delicately soldering copper pipes with blowtorch, safety goggles on, professional workshop with pegboard tool wall, studio lighting, highly detailed, photorealistic",
  "Professional product photography of a Rottweiler dog wearing heavy-duty work vest and gloves, carrying large PVC pipes over shoulder, construction site background with water heater, strong powerful pose, natural outdoor lighting, highly detailed, photorealistic",
  "Professional product photography of a Australian Shepherd dog wearing plaid flannel shirt and plumber's cap, threading pipe with pipe threader tool, colorful merle coat, garage workshop setting with workbench, warm overhead lighting, highly detailed, photorealistic",
  "Professional product photography of a Boxer dog wearing orange safety vest over plumber uniform, using plunger on clogged toilet, athletic build, residential bathroom with blue tiles, afternoon window light, highly detailed, photorealistic",
  "Professional product photography of a Dachshund dog in tiny plumber overalls crawling through small crawl space under house inspecting pipes with flashlight, elongated body advantage, dirt floor crawlspace, dramatic flashlight beam, highly detailed, photorealistic",
  "Professional product photography of a St. Bernard dog wearing extra-large plumber coveralls, installing new shower fixture on wall, gentle giant expression, bathroom renovation in progress, construction lighting, highly detailed, photorealistic",
  "Professional product photography of a Jack Russell Terrier dog wearing miniature plumber uniform, expertly fixing small leak in bathroom faucet on pedestal sink, energetic focused expression, vintage black and white tiled bathroom, natural window light, highly detailed, photorealistic",
];

const catPrompts = [
  "Professional product photography of a Bengal cat with leopard spots wearing tiny orange safety vest, balancing on exposed pipes in ceiling, athletic agile pose, commercial building mechanical room, dramatic upward angle lighting, highly detailed, photorealistic",
  "Professional product photography of a Russian Blue cat wearing miniature navy coveralls, carefully reading plumbing blueprint spread on workbench, intelligent concentrated expression, professional contractor office, desk lamp lighting, highly detailed, photorealistic",
  "Professional product photography of a Ragdoll cat with striking blue eyes wearing white plumber uniform, lazily lounging inside empty bathtub while holding pipe wrench, fluffy relaxed pose, luxury bathroom with marble, soft diffused lighting, highly detailed, photorealistic",
  "Professional product photography of a Calico cat with orange black and white patches wearing red plumber cap, using miniature adjustable wrench on outdoor garden hose connection, backyard patio setting, golden hour sunlight, highly detailed, photorealistic",
  "Professional product photography of a Scottish Fold cat with folded ears wearing green work shirt, sitting inside open cabinet under kitchen sink surrounded by pipes and cleaning supplies, adorable curious expression, under-sink view, LED cabinet lighting, highly detailed, photorealistic",
  "Professional product photography of a Sphynx hairless cat wearing tiny insulated work vest for warmth, operating pipe cutting tool on metal pipe, industrial basement boiler room, serious professional expression, fluorescent lighting, highly detailed, photorealistic",
  "Professional product photography of a Norwegian Forest cat with long majestic fur wearing plumber's tool belt, climbing tall water heater like a tree, outdoor utility area, confident climbing pose, natural daylight, highly detailed, photorealistic",
  "Professional product photography of an American Shorthair tabby cat wearing yellow rain slicker, using mop and bucket next to leaking pipe, helpful expression, flooded bathroom floor, emergency situation lighting, highly detailed, photorealistic",
  "Professional product photography of a Himalayan cat with color-point markings wearing pristine white plumber uniform, daintily holding chrome drain snake tool, elegant sitting pose, sparkling clean modern powder room, glamorous lighting, highly detailed, photorealistic",
  "Professional product photography of a Devon Rex cat with large ears and curly coat wearing black coveralls, squeezing through narrow space behind washing machine to access pipes, agile flexible pose, laundry room setting, side lighting through gap, highly detailed, photorealistic",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { animal } = body;

    if (!animal || (animal !== 'dog' && animal !== 'cat')) {
      return NextResponse.json(
        { error: 'Invalid animal type. Must be "dog" or "cat".' },
        { status: 400 }
      );
    }

    // Get random prompt
    const prompts = animal === 'dog' ? dogPrompts : catPrompts;
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    // Generate image using OpenAI via Replit AI Integrations
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: randomPrompt,
      n: 1,
      size: '1024x1024',
    });

    if (!response.data || !response.data[0]) {
      console.error('[Generate Plumbing Image] Invalid response:', response);
      return NextResponse.json(
        { error: 'No image returned from service' },
        { status: 500 }
      );
    }

    // Get image buffer (handle both URL and base64 formats)
    let imageBuffer: Buffer;
    if (response.data[0].b64_json) {
      // Convert base64 to buffer
      const base64Data = response.data[0].b64_json;
      imageBuffer = Buffer.from(base64Data, 'base64');
      console.log('[Generate Plumbing Image] Received base64 image from OpenAI');
    } else if (response.data[0].url) {
      // Download from URL
      const imageResponse = await fetch(response.data[0].url);
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      console.log('[Generate Plumbing Image] Downloaded image from URL:', response.data[0].url);
    } else {
      console.error('[Generate Plumbing Image] No URL or base64 data in response');
      return NextResponse.json(
        { error: 'No image data in response' },
        { status: 500 }
      );
    }
    
    // Add watermark using sharp (ALWAYS apply watermark)
    const logoPath = path.join(process.cwd(), 'attached_assets', 'Economy Plumbing Services logo_1759801055079.jpg');
    
    // Resize logo to 150px wide (maintain aspect ratio) with 15% opacity
    const watermarkBuffer = await sharp(logoPath)
      .resize(150, null, { fit: 'inside' })
      .png()
      .toBuffer();
    
    // Composite watermark in bottom-right corner with 20px padding and 15% opacity
    const watermarkedImage = await sharp(imageBuffer)
      .composite([{
        input: watermarkBuffer,
        gravity: 'southeast',
        blend: 'over'
      }])
      .png()
      .toBuffer();
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = randomBytes(4).toString('hex');
    const filename = `${animal}-plumber-${timestamp}-${randomId}.png`;
    
    // Upload to object storage in public directory
    const publicPaths = objectStorage.getPublicObjectSearchPaths();
    const bucketPath = publicPaths[0]; // Use first public path
    const destinationPath = `${bucketPath}/${animal}s-plumbing/${filename}`;
    
    console.log(`[Generate Plumbing Image] Uploading ${filename} with watermark to ${destinationPath}`);
    
    await objectStorage.uploadBuffer(watermarkedImage, destinationPath, 'image/png');
    
    // Store the public path (proxy will rewrite this to a public URL)
    const imageUrl = destinationPath;
    
    console.log(`[Generate Plumbing Image] Saved watermarked image to object storage: ${imageUrl}`);

    // Save to database
    await db.insert(generatedPlumbingImages).values({
      animalType: animal,
      imageUrl,
    });

    // Get all images for this animal type (newest first)
    const allImages = await db
      .select()
      .from(generatedPlumbingImages)
      .where(eq(generatedPlumbingImages.animalType, animal))
      .orderBy(desc(generatedPlumbingImages.createdAt));

    // If more than 12, delete the oldest ones (both from DB and object storage)
    if (allImages.length > 12) {
      const toDelete = allImages.slice(12);
      
      for (const img of toDelete) {
        // Delete from object storage first
        try {
          await objectStorage.deleteFile(img.imageUrl);
          console.log(`[Generate Plumbing Image] Deleted old image from storage: ${img.imageUrl}`);
        } catch (error) {
          console.error(`[Generate Plumbing Image] Error deleting from storage: ${img.imageUrl}`, error);
          // Continue even if storage deletion fails
        }
        
        // Delete from database
        await db.delete(generatedPlumbingImages).where(eq(generatedPlumbingImages.id, img.id));
      }
    }

    // Return the latest 12 images after generation
    const images = await db
      .select()
      .from(generatedPlumbingImages)
      .where(eq(generatedPlumbingImages.animalType, animal))
      .orderBy(desc(generatedPlumbingImages.createdAt))
      .limit(12);

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('[Generate Plumbing Image] Error:', error);
    const errorMessage = error?.message || 'Failed to generate image';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const animal = searchParams.get('animal');

    if (!animal || (animal !== 'dog' && animal !== 'cat')) {
      return NextResponse.json(
        { error: 'Invalid animal type. Must be "dog" or "cat".' },
        { status: 400 }
      );
    }

    // Get last 12 images for this animal type
    const images = await db
      .select()
      .from(generatedPlumbingImages)
      .where(eq(generatedPlumbingImages.animalType, animal))
      .orderBy(desc(generatedPlumbingImages.createdAt))
      .limit(12);

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('[Get Plumbing Images] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
