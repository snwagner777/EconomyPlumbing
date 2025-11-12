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
  "Professional product photography of a friendly golden retriever dog wearing a blue plumber's cap and work vest, carefully fixing a modern kitchen sink with chrome faucet, holding a wrench in paw, bright clean kitchen background, warm natural lighting, highly detailed, photorealistic",
  "Professional product photography of a German Shepherd dog wearing a blue plumber's uniform and tool belt, holding a large pipe wrench, standing confidently in a workshop setting, tools and pipes visible in background, bright professional lighting, highly detailed, photorealistic",
  "Professional product photography of a Labrador retriever dog wearing plumber's work clothes, lying on back under a kitchen sink cabinet working on pipes with tools, paws holding a wrench, domestic kitchen setting, realistic lighting from above, highly detailed, photorealistic",
  "Professional product photography of a Siberian Husky dog wearing a blue plumber's uniform, holding a red toilet plunger, standing in a modern bathroom with white tiles, confident expression, bright clean lighting, highly detailed, photorealistic",
  "Professional product photography of a Corgi dog wearing a tiny plumber's outfit, inspecting pipes under a sink, adorable focused expression, residential home setting, warm lighting, highly detailed, photorealistic",
  "Professional product photography of a Beagle dog wearing work overalls and hard hat, holding a pipe fitting tool, sitting on bathroom floor surrounded by plumbing supplies, friendly expression, natural lighting, highly detailed, photorealistic",
];

const catPrompts = [
  "Professional product photography of an orange tabby cat wearing a tiny blue plumber's cap, carefully adjusting a chrome bathroom faucet with tiny paws, sitting on bathroom counter, modern fixtures, warm natural lighting, highly detailed, photorealistic",
  "Professional product photography of a large fluffy Maine Coon cat wearing a work vest and tool belt, surrounded by plumbing tools including wrenches and pipe fittings, workshop setting, confident pose, bright professional lighting, highly detailed, photorealistic",
  "Professional product photography of a Siamese cat with blue eyes wearing a tiny hard hat, inspecting exposed copper pipes in a wall, curious expression, holding small flashlight, residential setting, realistic lighting, highly detailed, photorealistic",
  "Professional product photography of a British Shorthair gray cat wearing a blue plumber's uniform, sitting next to an open red metal toolbox filled with plumbing tools, professional workshop background, bright clean lighting, highly detailed, photorealistic",
  "Professional product photography of a fluffy Persian cat wearing work overalls, sitting on top of a water heater with a wrench, regal expression, utility room setting, professional lighting, highly detailed, photorealistic",
  "Professional product photography of a black and white tuxedo cat wearing a plumber's cap, peering into an open pipe with a tiny flashlight, under a modern bathroom sink, curious expression, realistic lighting, highly detailed, photorealistic",
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

    // Handle both URL and base64 formats
    let imageUrl: string;
    if (response.data[0].url) {
      // Direct URL from API (rare)
      imageUrl = response.data[0].url;
    } else if (response.data[0].b64_json) {
      // Convert base64 to buffer
      const base64Data = response.data[0].b64_json;
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Add watermark using sharp
      const logoPath = path.join(process.cwd(), 'attached_assets', 'Economy Plumbing Services logo_1759801055079.jpg');
      
      // Resize logo to 150px wide (maintain aspect ratio)
      const watermarkBuffer = await sharp(logoPath)
        .resize(150, null, { fit: 'inside' })
        .toBuffer();
      
      // Get watermark dimensions
      const watermarkMetadata = await sharp(watermarkBuffer).metadata();
      const watermarkWidth = watermarkMetadata.width || 150;
      const watermarkHeight = watermarkMetadata.height || 50;
      
      // Composite watermark in bottom-right corner with 20px padding
      const watermarkedImage = await sharp(imageBuffer)
        .composite([{
          input: watermarkBuffer,
          gravity: 'southeast',
          blend: 'over'
        }])
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
      imageUrl = destinationPath;
      
      console.log(`[Generate Plumbing Image] Saved watermarked image to object storage: ${imageUrl}`);
    } else {
      console.error('[Generate Plumbing Image] No URL or base64 data in response');
      return NextResponse.json(
        { error: 'No image data in response' },
        { status: 500 }
      );
    }

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
