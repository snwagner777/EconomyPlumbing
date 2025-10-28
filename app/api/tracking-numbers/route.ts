/**
 * Tracking Numbers API
 * 
 * Returns active tracking phone numbers for dynamic display
 * Used for marketing attribution
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const trackingNumbers = await storage.getActiveTrackingNumbers();

    return NextResponse.json({
      trackingNumbers,
      count: trackingNumbers.length,
    });

  } catch (error: any) {
    console.error('[Tracking Numbers API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking numbers' },
      { status: 500 }
    );
  }
}
