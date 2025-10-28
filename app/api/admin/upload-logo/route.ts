/**
 * Admin API - Upload Logo to Object Storage
 * 
 * Handles logo uploads with image optimization and object storage integration
 * Migrated from Express: POST /api/admin/upload-logo
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { ObjectStorageService } from '@/server/objectStorage';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize image: resize and convert to WebP
    const optimizedBuffer = await sharp(buffer)
      .resize(500, 500, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .webp({ quality: 90 })
      .toBuffer();

    // Upload to object storage
    const objectStorageService = new ObjectStorageService();
    const timestamp = Date.now();
    const destinationPath = `/repl-default-bucket-${process.env.REPL_ID || 'local'}/public/logos/logo-${timestamp}.webp`;
    
    const publicUrl = await objectStorageService.uploadBuffer(
      optimizedBuffer,
      destinationPath,
      'image/webp'
    );

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: `logo-${timestamp}.webp`,
    }, { status: 201 });
  } catch (error) {
    console.error('[Admin Logo Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo', details: (error as Error).message },
      { status: 500 }
    );
  }
}
