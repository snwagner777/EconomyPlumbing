import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filePath: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = resolvedParams.filePath.join('/');
    const fullPath = path.resolve(process.cwd(), "attached_assets", filePath);
    
    if (fs.existsSync(fullPath)) {
      const fileBuffer = fs.readFileSync(fullPath);
      
      // Determine content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.json': 'application/json',
        '.txt': 'text/plain',
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } else {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('[Attached Assets] Error serving file:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
