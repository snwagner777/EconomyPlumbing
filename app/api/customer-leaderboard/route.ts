import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Placeholder until we implement proper leaderboard with ServiceTitan job data
    return NextResponse.json({ leaderboard: [] });
  } catch (error: any) {
    console.error("[Leaderboard] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
