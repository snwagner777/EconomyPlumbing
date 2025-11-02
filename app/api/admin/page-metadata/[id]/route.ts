import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';

export async function DELETE(
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
    await storage.deletePageMetadata(id);
    
    // Invalidate SSR cache (page metadata changed)
    if (global.invalidateSSRCache) global.invalidateSSRCache();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Page Metadata] Error deleting metadata:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
