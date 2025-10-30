/**
 * Admin API - Photo Management
 * 
 * Manage CompanyCam and ServiceTitan photos with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const quality = searchParams.get('quality');
    const status = searchParams.get('status');
    
    let photos = await storage.getAllPhotos();
    
    // Apply filters
    if (category && category !== 'all') {
      photos = photos.filter((p: any) => p.category === category);
    }
    
    if (quality && quality !== 'all') {
      if (quality === 'good') {
        photos = photos.filter((p: any) => p.isGoodQuality);
      } else if (quality === 'poor') {
        photos = photos.filter((p: any) => !p.isGoodQuality);
      }
    }
    
    if (status && status !== 'all') {
      if (status === 'used') {
        photos = photos.filter((p: any) => p.usedInBlogPostId || p.usedInPageUrl);
      } else if (status === 'unused') {
        photos = photos.filter((p: any) => !p.usedInBlogPostId && !p.usedInPageUrl);
      }
    }
    
    return NextResponse.json({ photos });
  } catch (error: any) {
    console.error("[Admin] Error fetching photos:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
