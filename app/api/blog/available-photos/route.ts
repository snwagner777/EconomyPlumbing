import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET() {
  try {
    const photos = await storage.getPhotosWithoutBlogTopic();
    
    return NextResponse.json({
      success: true,
      count: photos.length,
      photos: photos.map(p => ({
        id: p.id,
        category: p.category,
        qualityScore: p.qualityScore,
        aiDescription: p.aiDescription,
        photoUrl: p.photoUrl
      }))
    });
  } catch (error: any) {
    console.error("Error fetching available photos:", error);
    return NextResponse.json(
      { message: "Failed to fetch available photos" },
      { status: 500 }
    );
  }
}
