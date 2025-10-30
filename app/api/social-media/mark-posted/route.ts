import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function POST(req: NextRequest) {
  try {
    const { compositeId, facebookPostId, instagramPostId } = await req.json();

    if (!compositeId) {
      return NextResponse.json({ 
        message: "Composite ID is required" 
      }, { status: 400 });
    }

    await storage.markCompositeAsPosted(
      compositeId, 
      facebookPostId || null, 
      instagramPostId || null
    );

    return NextResponse.json({
      success: true,
      message: "Composite marked as posted to social media"
    });
  } catch (error: any) {
    console.error("Error marking composite as posted:", error);
    return NextResponse.json({
      message: "Failed to mark composite as posted",
      error: error.message
    }, { status: 500 });
  }
}
