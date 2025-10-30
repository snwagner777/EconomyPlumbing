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
    const { status, moderationNotes, featured, displayOnWebsite } = await req.json();
    
    if (!['approved', 'rejected', 'spam'].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status" },
        { status: 400 }
      );
    }
    
    const moderatorId = 'admin'; // Could use session.userId if needed
    
    const review = await storage.moderateReview(id, {
      status,
      moderatedBy: moderatorId,
      moderationNotes,
      featured: featured !== undefined ? featured : undefined,
      displayOnWebsite: displayOnWebsite !== undefined ? displayOnWebsite : undefined,
    });
    
    console.log(`[Review Admin] Review ${id} ${status} by ${moderatorId}`);
    return NextResponse.json(review);
  } catch (error: any) {
    console.error('[Review Admin] Moderation error:', error);
    return NextResponse.json(
      { message: "Error moderating review: " + error.message },
      { status: 400 }
    );
  }
}
