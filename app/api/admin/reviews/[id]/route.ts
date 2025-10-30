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
    await storage.deleteReview(id);
    console.log(`[Review Admin] Review ${id} deleted`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Review Admin] Delete error:', error);
    return NextResponse.json(
      { message: "Error deleting review: " + error.message },
      { status: 400 }
    );
  }
}
