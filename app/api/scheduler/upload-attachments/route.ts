/**
 * Scheduler File Upload API
 * 
 * Handles photo/document uploads for scheduler bookings.
 * MODULAR - Can be called after job creation from any context.
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';

// Force Node.js runtime for proper file/buffer handling
export const runtime = 'nodejs';

// Max file size: 10MB per file
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobId = formData.get('jobId') as string;
    
    if (!jobId || isNaN(parseInt(jobId))) {
      return NextResponse.json(
        { error: 'Valid jobId is required' },
        { status: 400 }
      );
    }

    const jobIdNum = parseInt(jobId);
    
    // Collect all files from form data
    const files: Array<{ buffer: Buffer; fileName: string }> = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof File) {
        const file = value as File;
        
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          return NextResponse.json(
            { 
              error: `Invalid file type: ${file.type}`,
              allowed: ALLOWED_TYPES 
            },
            { status: 400 }
          );
        }
        
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { 
              error: `File too large: ${file.name} (max 10MB)`,
            },
            { status: 400 }
          );
        }
        
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        files.push({
          buffer,
          fileName: file.name,
        });
      }
    }
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }
    
    console.log(`[Upload Attachments] Uploading ${files.length} file(s) to job ${jobIdNum}`);
    
    // Upload all files to ServiceTitan
    const uploadedFiles = await serviceTitanJobs.uploadJobAttachments(
      jobIdNum,
      files
    );
    
    return NextResponse.json({
      success: true,
      jobId: jobIdNum,
      filesUploaded: uploadedFiles.length,
      fileNames: uploadedFiles,
    });
    
  } catch (error: any) {
    console.error('[Upload Attachments] Failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload attachments',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
