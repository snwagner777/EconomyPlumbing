import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { fetchAndFilterServiceTitanPhotos } from '@/server/lib/serviceTitanPhotos';

export async function POST(req: NextRequest) {
  try {
    const { projectId, token, jobDescription } = await req.json();
    
    if (!projectId || !token) {
      return NextResponse.json({ 
        message: "Project ID and access token are required" 
      }, { status: 400 });
    }

    const filteredPhotos = await fetchAndFilterServiceTitanPhotos(
      projectId,
      token,
      jobDescription
    );

    // Save to database
    const savedPhotos = await storage.savePhotos(filteredPhotos);

    return NextResponse.json({
      success: true,
      imported: savedPhotos.length,
      photos: savedPhotos,
    });
  } catch (error: any) {
    console.error("Error importing photos:", error);
    return NextResponse.json({ 
      message: "Photo import failed", 
      error: error.message 
    }, { status: 500 });
  }
}
