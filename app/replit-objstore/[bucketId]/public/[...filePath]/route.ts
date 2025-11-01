import { NextRequest, NextResponse } from 'next/server';
import { ObjectStorageService } from '@/server/objectStorage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bucketId: string; filePath: string[] }> }
) {
  try {
    const { filePath } = await params;
    const filePathStr = filePath.join('/');
    
    const objectStorageService = new ObjectStorageService();
    
    // Search for the file in public directory
    const file = await objectStorageService.searchPublicObject(filePathStr);
    
    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    
    // Get file metadata
    const [metadata] = await file.getMetadata();
    
    // Create a readable stream from the file
    const stream = file.createReadStream();
    
    // Convert Node.js stream to Web Stream for Next.js
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        
        stream.on('end', () => {
          controller.close();
        });
        
        stream.on('error', (err) => {
          console.error('[Object Storage] Stream error:', err);
          controller.error(err);
        });
      },
    });
    
    // Return streaming response with 1 hour cache
    return new NextResponse(readableStream, {
      status: 200,
      headers: {
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'Content-Length': String(metadata.size),
        'Cache-Control': 'public, max-age=3600, immutable',
      },
    });
  } catch (error: any) {
    console.error("[Legacy Objstore] Error serving file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
