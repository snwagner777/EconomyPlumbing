import { NextRequest, NextResponse } from 'next/server';
import { processBlogImage } from '@/server/lib/blogImageProcessor';

export async function POST(req: NextRequest) {
  try {
    const { imagePath, blogTitle } = await req.json();
    
    if (!imagePath) {
      return NextResponse.json(
        { message: "imagePath is required" },
        { status: 400 }
      );
    }

    console.log(`📸 [API] Processing blog image: ${imagePath}`);
    const processedImages = await processBlogImage(imagePath, blogTitle);
    
    return NextResponse.json({ 
      original: imagePath,
      cropped: processedImages.imagePath,
      jpegCropped: processedImages.jpegImagePath,
      focalPointX: processedImages.focalPointX,
      focalPointY: processedImages.focalPointY,
      message: "Image processed successfully" 
    });
  } catch (error) {
    console.error('[API] Error processing blog image:', error);
    return NextResponse.json(
      { message: "Failed to process image" },
      { status: 500 }
    );
  }
}
