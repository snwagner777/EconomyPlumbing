import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';
import { z } from 'zod';

const createPlatformSchema = z.object({
  platform: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  url: z.string().url(),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(999),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const platforms = await storage.getAllReviewPlatforms();
    return NextResponse.json(platforms);
  } catch (error: any) {
    console.error('[Admin Review Platforms] Error fetching platforms:', error);
    return NextResponse.json(
      { message: "Error fetching review platforms" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = createPlatformSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const platform = await storage.createReviewPlatform(result.data);
    return NextResponse.json(platform, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Review Platforms] Error creating platform:', error);
    return NextResponse.json(
      { message: "Error creating review platform" },
      { status: 500 }
    );
  }
}
