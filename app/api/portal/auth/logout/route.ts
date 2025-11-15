import { NextRequest, NextResponse } from 'next/server';
import { destroyAllPortalSessions } from '@/server/lib/customer-portal/session-utils';

/**
 * Legacy logout endpoint - redirects to shared session destruction logic
 * This endpoint exists for backward compatibility
 */
export async function POST(req: NextRequest) {
  try {
    await destroyAllPortalSessions();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Portal Auth] Logout error:", error);
    return NextResponse.json({ success: true }); // Return success anyway to prevent UI errors
  }
}
