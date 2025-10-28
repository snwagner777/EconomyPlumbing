/**
 * Service Area API - Get Single Area by Slug
 * 
 * Returns individual service area for detail page
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const area = await storage.getServiceAreaBySlug(slug);
    
    if (!area) {
      return NextResponse.json(
        { error: 'Service area not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ serviceArea: area });
  } catch (error) {
    console.error('[Service Area API] Error fetching area:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service area' },
      { status: 500 }
    );
  }
}
