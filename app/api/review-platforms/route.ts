import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const platforms = await storage.getEnabledReviewPlatforms();
    return NextResponse.json(platforms);
  } catch (error: any) {
    console.error('[Review Platforms] Error fetching platforms:', error);
    return NextResponse.json(
      { message: "Error fetching review platforms" },
      { status: 500 }
    );
  }
}
