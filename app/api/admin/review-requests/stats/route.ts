import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    // Mock stats for now - will be replaced with real database queries
    const stats = {
      reviewRequests: {
        total: 0,
        active: 0,
        completed: 0,
        reviewsSubmitted: 0,
        averageRating: 0,
        openRate: 0,
        clickRate: 0
      },
      referralNurture: {
        total: 0,
        active: 0,
        paused: 0,
        completed: 0,
        totalReferrals: 0,
        averageEngagement: 0
      }
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("[Review Requests] Error fetching stats:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
