import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    const updates = await req.json();
    const platform = await storage.updateReviewPlatform(id, updates);
    console.log(`[Admin Review Platforms] Updated platform ${id}`);
    return NextResponse.json({ success: true, platform });
  } catch (error: any) {
    console.error('[Admin Review Platforms] Error updating platform:', error);
    return NextResponse.json(
      { message: "Error updating review platform" },
      { status: 500 }
    );
  }
}
