import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const stories = await storage.getApprovedSuccessStories();
    
    return NextResponse.json(
      { stories },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, must-revalidate',
        }
      }
    );
  } catch (error: any) {
    console.error("[Success Stories] Error fetching approved stories:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
