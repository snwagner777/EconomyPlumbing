import { NextRequest, NextResponse } from 'next/server';
import { ObjectStorageService } from '@/server/objectStorage';

export async function GET(
  req: NextRequest,
  { params }: { params: { bucketId: string; filePath: string[] } }
) {
  try {
    const filePath = params.filePath.join('/');
    const objectStorageService = new ObjectStorageService();
    
    // Search for the file in public directory
    const file = await objectStorageService.searchPublicObject(filePath);
    
    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    
    // Download and stream the file with 1 hour cache
    // Using Response to stream the file
    const response = new Response();
    await objectStorageService.downloadObject(file, response as any, 3600);
    
    return response;
  } catch (error: any) {
    console.error("[Legacy Objstore] Error serving file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
