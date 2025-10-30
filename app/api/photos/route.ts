import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const unused = searchParams.get('unused') === 'true';

    let photos: any[];
    if (unused) {
      photos = await storage.getUnusedPhotos(category);
    } else if (category) {
      photos = await storage.getPhotosByCategory(category);
    } else {
      photos = [];
    }

    return NextResponse.json(photos);
  } catch (error: any) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { 
        message: "Failed to fetch photos", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
