import { NextRequest, NextResponse } from 'next/server';
import { manuallyPostBest } from '@/server/lib/weeklyPostScheduler';

export async function POST(req: NextRequest) {
  try {
    await manuallyPostBest();

    return NextResponse.json({
      success: true,
      message: "Posted best before/after composite to social media"
    });
  } catch (error: any) {
    console.error("Error posting to social media:", error);
    return NextResponse.json({
      message: "Failed to post to social media",
      error: error.message
    }, { status: 500 });
  }
}
