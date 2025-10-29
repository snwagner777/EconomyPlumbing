import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/server/lib/session';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
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
