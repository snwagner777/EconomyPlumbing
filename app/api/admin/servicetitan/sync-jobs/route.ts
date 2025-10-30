import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    console.log('[Admin] Triggering ServiceTitan jobs sync...');
    const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
    const serviceTitan = getServiceTitanAPI();
    
    const result = await serviceTitan.syncAllJobs();
    
    return NextResponse.json({
      message: "Jobs sync completed successfully",
      ...result
    });
  } catch (error: any) {
    console.error('[Admin] Error syncing jobs:', error);
    return NextResponse.json(
      { message: "Error syncing jobs", error: error.message },
      { status: 500 }
    );
  }
}
