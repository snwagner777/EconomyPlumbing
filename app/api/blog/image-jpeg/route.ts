import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const imageUrl = req.nextUrl.searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json(
        { message: "url parameter is required" },
        { status: 400 }
      );
    }

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
      
      // Normalize path for object storage: remove leading slash and 'public-objects/' prefix
      let normalizedPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
      if (normalizedPath.startsWith('public-objects/')) {
        normalizedPath = normalizedPath.substring('public-objects/'.length);
      }
      
      try {
        // Try object storage first
        const file = await objectStorage.searchPublicObject(normalizedPath);
        if (file) {
          const [buffer] = await file.download();
          imageBuffer = buffer;
        } else {
          // Fall back to local filesystem
          imageBuffer = await fs.readFile(normalizedPath);
        }
      } catch {
        // Last resort: try filesystem
        imageBuffer = await fs.readFile(normalizedPath);
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
    console.error("Error converting blog image to JPEG:", error);
    return NextResponse.json(
      { message: "Failed to convert image" },
      { status: 500 }
    );
  }
}
