import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function POST(req: NextRequest) {
  try {
    const { requestedUrl, referrer } = await req.json();
    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Save to database
    await storage.create404Error({
      requestedUrl,
      referrer,
      userAgent,
      ipAddress,
      emailSent: false,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Track 404] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
