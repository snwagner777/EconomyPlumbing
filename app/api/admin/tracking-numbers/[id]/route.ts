import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';
import { insertTrackingNumberSchema } from '@shared/schema';

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
    const body = await req.json();
    const updates = insertTrackingNumberSchema.partial().parse(body);
    
    const trackingNumber = await storage.updateTrackingNumber(id, updates);
    
    // Invalidate SSR cache (tracking numbers changed)
    if (global.invalidateSSRCache) global.invalidateSSRCache();
    
    return NextResponse.json({ trackingNumber });
  } catch (error: any) {
    console.error("[Tracking Numbers] Error updating tracking number:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

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
    await storage.deleteTrackingNumber(id);
    
    // Invalidate SSR cache (tracking numbers changed)
    if (global.invalidateSSRCache) global.invalidateSSRCache();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Tracking Numbers] Error deleting tracking number:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
