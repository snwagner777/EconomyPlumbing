import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const path = `/${pathArray.join('/')}`; // Add leading slash
    const metadata = await storage.getPageMetadataByPath(path);
    
    if (!metadata) {
      return NextResponse.json(
        { error: "Metadata not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ metadata }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache for 1 hour
      }
    });
  } catch (error: any) {
    console.error("[Page Metadata] Error fetching metadata:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
