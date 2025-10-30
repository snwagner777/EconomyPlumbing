import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authMiddleware';
import { executePhotoCleanup } from '@/server/lib/automatedPhotoCleanup';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
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
