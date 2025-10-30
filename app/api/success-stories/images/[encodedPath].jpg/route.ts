import { NextRequest, NextResponse } from 'next/server';
import { ObjectStorageService } from '@/server/objectStorage';
import { promises as fs } from 'fs';
import sharp from 'sharp';

async function convertImageToJPEG(encodedPath: string) {
  try {
    const imageUrl = Buffer.from(decodeURIComponent(encodedPath), 'base64').toString('utf-8');
    let imageBuffer: Buffer;

    // Handle different image sources
    if (imageUrl.startsWith('http')) {
      // External URL
      const response = await fetch(imageUrl);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      // Local/object storage path
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
    const jpegBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    return new NextResponse(jpegBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
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
  { params }: { params: Promise<{ encodedPath: string }> }
) {
  const { encodedPath } = await params;
  return convertImageToJPEG(encodedPath);
}
