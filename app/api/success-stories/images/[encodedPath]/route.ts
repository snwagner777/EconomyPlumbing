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
          const fsPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
          imageBuffer = await fs.readFile(fsPath);
        }
      } catch {
        const fsPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        imageBuffer = await fs.readFile(fsPath);
      }
    }

    // Convert to JPEG
    const sharp = await import('sharp');
    const jpegBuffer = await sharp.default(imageBuffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    return new NextResponse(jpegBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error: any) {
    console.error("Error converting success story image to JPEG:", error);
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
