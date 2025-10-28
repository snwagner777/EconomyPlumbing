/**
 * Chatbot API - Upload Image for Diagnosis
 * 
 * Handles image uploads for AI-powered plumbing issue diagnosis
 * Migrated from Express: POST /api/chatbot/upload-image
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectStorageService } from '@/server/objectStorage';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const conversationId = formData.get('conversationId') as string | null;

    if (!image) {
      return NextResponse.json(
        { error: 'No image uploaded' },
        { status: 400 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize image: resize for AI analysis and convert to WebP
    const optimizedBuffer = await sharp(buffer)
      .resize(1024, 1024, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Upload to object storage
    const objectStorageService = new ObjectStorageService();
    const timestamp = Date.now();
    const filename = `chatbot-${conversationId}-${timestamp}.webp`;
    const destinationPath = `/repl-default-bucket-${process.env.REPL_ID || 'local'}/public/chatbot-uploads/${filename}`;
    
    const publicUrl = await objectStorageService.uploadBuffer(
      optimizedBuffer,
      destinationPath,
      'image/webp'
    );

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      filename,
      conversationId,
    }, { status: 201 });
  } catch (error) {
    console.error('[Chatbot Image Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image', details: (error as Error).message },
      { status: 500 }
    );
  }
}
