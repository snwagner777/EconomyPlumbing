/**
 * Service Areas API - Get All Service Areas
 * 
 * Returns all service areas for SEO and location pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const areas = await storage.getAllServiceAreas();
    
    return NextResponse.json({
      serviceAreas: areas,
      count: areas.length,
    });
  } catch (error) {
    console.error('[Service Areas API] Error fetching areas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service areas' },
      { status: 500 }
    );
  }
}
