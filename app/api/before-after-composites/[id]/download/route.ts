import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import { ObjectStorageService } from '@/server/objectStorage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const composites = await storage.getBeforeAfterComposites();
    const composite = composites.find(c => c.id === id);

    if (!composite) {
      return NextResponse.json(
        { message: "Composite not found" },
        { status: 404 }
      );
    }

    // Fetch the composite image
    let imageBuffer: Buffer;
    
    if (composite.compositeUrl.startsWith('http')) {
      // External URL
      const response = await fetch(composite.compositeUrl);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      // Local/object storage path
      const objectStorage = new ObjectStorageService();
      
      // Normalize path for object storage: remove leading slash and 'public-objects/' prefix
      let normalizedPath = composite.compositeUrl.startsWith('/') ? composite.compositeUrl.substring(1) : composite.compositeUrl;
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
        imageBuffer = await fs.readFile(normalizedPath);
      }
    }

    // Convert to JPEG for social media compatibility
    const jpegBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 90 })
      .toBuffer();

    // Set appropriate headers
    return new NextResponse(jpegBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="composite-${id}.jpg"`,
      }
    });
  } catch (error: any) {
    console.error("Error downloading composite:", error);
    return NextResponse.json(
      { message: "Failed to download composite", error: error.message },
      { status: 500 }
    );
  }
}
