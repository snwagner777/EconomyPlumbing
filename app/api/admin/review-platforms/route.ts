import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';

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
