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

    // Mock data for now - will be replaced with real database queries
    const campaigns: any[] = [];
    
    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error("[Review Requests] Error fetching active campaigns:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
