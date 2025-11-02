import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';

export async function PUT(
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
    
    console.log(`[Success Stories] Unapproving story ${id}...`);
    
    // Unapprove the story (set approved=false and clear collage)
    const story = await storage.unapproveSuccessStory(id);
    
    console.log(`[Success Stories] ✅ Story unapproved and moved to pending queue`);
    
    // Invalidate SSR cache (success story removed)
    if (global.invalidateSSRCache) global.invalidateSSRCache();
    
    return NextResponse.json({ story });
  } catch (error: any) {
    console.error("[Success Stories] Error unapproving story:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
