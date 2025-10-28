/**
 * Admin API - Photo Management
 * 
 * Manage CompanyCam and ServiceTitan photos
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const jobId = searchParams.get('jobId');
    const unused = searchParams.get('unused') === 'true';

    let photos;
    
    if (jobId) {
      photos = await storage.getPhotosByJob(jobId);
    } else if (category) {
      photos = await storage.getPhotosByCategory(category);
    } else if (unused) {
      photos = await storage.getUnusedPhotos();
    } else {
      photos = await storage.getAllPhotos();
    }

    return NextResponse.json({
      photos,
      count: photos.length,
    });
  } catch (error) {
    console.error('[Admin Photos API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
