/**
 * Public Object Storage API - Serve Public Files
 * 
 * Serves files from object storage with appropriate caching headers
 * Migrated from Express route: /public-objects/:filePath(*)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectStorageService } from '@/server/objectStorage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filePath: string[] }> }
) {
  try {
    const { filePath } = await params;
    const filePathStr = filePath.join('/');
    
    const objectStorageService = new ObjectStorageService();
    
    // Search for the file in public object search paths
    const file = await objectStorageService.searchPublicObject(filePathStr);
    
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Blog images get 1 year cache, others get 1 hour
    const cacheTtl = filePathStr.startsWith('blog_images/') ? 31536000 : 3600;
    
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
    
    // Return streaming response with appropriate headers
    return new NextResponse(readableStream, {
      status: 200,
      headers: {
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'Content-Length': String(metadata.size),
        'Cache-Control': `public, max-age=${cacheTtl}, immutable`,
      },
    });
  } catch (error) {
    console.error('[Object Storage] Error serving file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
