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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    
    const reviews = await storage.getAllReviews(status);
    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error('[Review Admin] Error fetching reviews:', error);
    return NextResponse.json(
      { message: "Error fetching reviews" },
      { status: 500 }
    );
  }
}
