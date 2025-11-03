/**
 * Admin API - Tracking Phone Numbers
 * 
 * Manage dynamic phone numbers for marketing attribution
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { storage } from '@/server/storage';
import { insertTrackingNumberSchema } from '@shared/schema';

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    const numbers = activeOnly
      ? await storage.getActiveTrackingNumbers()
      : await storage.getAllTrackingNumbers();

    return NextResponse.json({
      trackingNumbers: numbers,
      count: numbers.length,
    });
  } catch (error) {
    console.error('[Admin Tracking Numbers API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch numbers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate using the correct schema from shared/schema.ts
    const result = insertTrackingNumberSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const trackingNumber = await storage.createTrackingNumber(result.data);

    return NextResponse.json({ trackingNumber }, { status: 201 });
  } catch (error) {
    console.error('[Admin Tracking Numbers API] Error:', error);
    return NextResponse.json({ error: 'Failed to create number' }, { status: 500 });
  }
}
