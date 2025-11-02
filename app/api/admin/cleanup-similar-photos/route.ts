import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { executePhotoCleanup } from '@/server/lib/automatedPhotoCleanup';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    console.log("[Admin] Starting manual similar photo detection and cleanup...");
    
    const result = await executePhotoCleanup();
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Admin] Error in similar photo cleanup:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
