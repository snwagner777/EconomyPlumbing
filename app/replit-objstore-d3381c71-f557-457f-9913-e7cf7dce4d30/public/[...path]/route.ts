import { NextRequest, NextResponse } from 'next/server';
import { ObjectStorageService } from '@/server/objectStorage';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const objectStorage = new ObjectStorageService();
    const filePath = params.path.join('/');
    
    // Search for the file in public object storage
    const file = await objectStorage.searchPublicObject(filePath);
    
    if (!file) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Get file metadata
    const [metadata] = await file.getMetadata();
    
    // Download the file
    const [buffer] = await file.download();
    
    // Return the file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': metadata.size?.toString() || buffer.length.toString(),
      }
    });
  } catch (error: any) {
    console.error('Error serving object storage file:', error);
    return NextResponse.json(
      { error: 'Failed to load image' },
      { status: 500 }
    );
  }
}
