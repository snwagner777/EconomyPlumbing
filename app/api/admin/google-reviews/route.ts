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

    const reviews = await storage.getGoogleReviews();
    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('[Admin Google Reviews] Error fetching reviews:', error);
    return NextResponse.json(
      { message: "Error fetching Google reviews" },
      { status: 500 }
    );
  }
}
