/**
 * Admin API - Google Reviews Sync
 * 
 * Trigger manual sync of Google reviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import from correct module
    const { fetchGoogleReviews } = await import('@/server/lib/googleReviews');
    
    const result = await fetchGoogleReviews();

    return NextResponse.json({
      success: true,
      message: 'Google reviews synced successfully',
      ...result,
    });
  } catch (error) {
    console.error('[Admin Google Reviews Sync API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync reviews', details: (error as Error).message },
      { status: 500 }
    );
  }
}
