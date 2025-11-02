/**
 * Public API - Get Photo by ID
 * 
 * Returns original photo URL for lightbox display (no auth required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const photos = await storage.getAllPhotos();
    const photo = photos.find((p: any) => p.id === id);
    
    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      photoUrl: photo.photoUrl,
      thumbnailUrl: photo.thumbnailUrl 
    });
  } catch (error: any) {
    console.error('[Photos API] Error fetching photo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    );
  }
}
