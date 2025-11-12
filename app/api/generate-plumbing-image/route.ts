import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { generatedPlumbingImages } from '@shared/schema';
import { desc, eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Get random prompt
    const prompts = animal === 'dog' ? dogPrompts : catPrompts;
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    // Generate image using Anthropic with proper image generation setup
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1024,
      modalities: ['image'] as any, // Enable image generation
      messages: [
        {
          role: 'user',
          content: randomPrompt,
        },
      ],
    });

    // Extract image from response
    const imageBlock: any = message.content.find((block: any) => block.type === 'image');
    if (!imageBlock || !imageBlock.source || !imageBlock.source.data) {
      console.error('[Generate Plumbing Image] No image in response:', message.content);
      return NextResponse.json(
        { error: 'Image generation failed - no image returned' },
        { status: 500 }
      );
    }

    const imageUrl = `data:${imageBlock.source.media_type || 'image/png'};base64,${imageBlock.source.data}`;

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

    // If more than 12, delete the oldest ones
    if (allImages.length > 12) {
      const toDelete = allImages.slice(12);
      const idsToDelete = toDelete.map((img: any) => img.id);
      
      for (const id of idsToDelete) {
        await db.delete(generatedPlumbingImages).where(eq(generatedPlumbingImages.id, id));
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
  } catch (error) {
    console.error('[Get Plumbing Images] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
