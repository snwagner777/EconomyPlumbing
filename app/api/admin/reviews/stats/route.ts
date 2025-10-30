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

    const stats = await storage.getReviewStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('[Review Admin] Stats error:', error);
    return NextResponse.json(
      { message: "Error fetching review stats" },
      { status: 500 }
    );
  }
}
