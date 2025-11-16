import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'src/lib/session';

/**
 * Google My Business OAuth Status Check
 * 
 * NOTE: Google My Business integration has been removed.
 * This endpoint is kept for backward compatibility but returns unauthenticated status.
 */
export async function GET(req: NextRequest) {
  try {
    // SECURITY: Require admin authentication
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json(
        { message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }
    
    // Google My Business integration removed - return not authenticated
    return NextResponse.json({ 
      isAuthenticated: false,
      hasAccountId: false,
      hasLocationId: false,
    });
  } catch (error: any) {
    console.error('[OAuth Status] Error:', error);
    return NextResponse.json(
      { message: "Error checking OAuth status" },
      { status: 500 }
    );
  }
}
