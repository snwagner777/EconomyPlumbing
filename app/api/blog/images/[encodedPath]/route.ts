import { NextRequest, NextResponse } from 'next/server';

async function convertImageToJPEG(encodedPath: string): Promise<NextResponse> {
  try {
    // Decode the base64-encoded path
    const imageUrl = Buffer.from(encodedPath, 'base64').toString('utf-8');
    
    let imageBuffer: Buffer;

    // Handle different image sources
    if (imageUrl.startsWith('http')) {
      // External URL
      const response = await fetch(imageUrl);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      // Local/object storage path
      const sharp = await import('sharp');
      const fs = await import('fs/promises');
      const { ObjectStorageService } = await import('@/server/objectStorage');
      const objectStorage = new ObjectStorageService();
      
      // Normalize path for object storage
      let normalizedPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
      
      // Remove bucket-specific prefix patterns
      // Pattern: replit-objstore-{id}/public/ or public-objects/
      if (normalizedPath.includes('/public/')) {
        normalizedPath = normalizedPath.split('/public/')[1];
      } else if (normalizedPath.startsWith('public-objects/')) {
        normalizedPath = normalizedPath.substring('public-objects/'.length);
      }
      
      try {
        // Try object storage first
        const file = await objectStorage.searchPublicObject(normalizedPath);
        if (file) {
          const [buffer] = await file.download();
          imageBuffer = buffer;
        } else {
          // Fall back to local filesystem with original path (without leading slash)
          const fsPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
          imageBuffer = await fs.readFile(fsPath);
        }
      } catch {
        // Last resort: try filesystem with original path (without leading slash)
        const fsPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        imageBuffer = await fs.readFile(fsPath);
      }
    }

    // Convert to JPEG
    const sharp = await import('sharp');
    const jpegBuffer = await sharp.default(imageBuffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    // Cache for 1 year (images don't change)
    return new NextResponse(jpegBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error: any) {
    console.error("Error converting image to JPEG:", error);
    return NextResponse.json(
      { message: "Failed to convert image" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { encodedPath: string } }
) {
  return convertImageToJPEG(params.encodedPath);
}
