/**
 * Page Metadata API
 * 
 * Fetches custom SEO metadata for pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { message: 'Path parameter is required' },
        { status: 400 }
      );
    }

    const metadata = await storage.getPageMetadataByPath(path);

    if (!metadata) {
      return NextResponse.json(
        { message: 'No custom metadata found for this page' },
        { status: 404 }
      );
    }

    // Cache for 5 minutes
    return NextResponse.json(metadata, {
      headers: {
        'Cache-Control': 'public, max-age=300, must-revalidate',
      },
    });

  } catch (error) {
    console.error('[Page Metadata API] Error fetching page metadata:', error);
    return NextResponse.json(
      { message: 'Failed to fetch page metadata' },
      { status: 500 }
    );
  }
}
