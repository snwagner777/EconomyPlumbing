/**
 * Customer Portal Session Check API
 * 
 * Returns current session status and customerId if authenticated.
 * Used to restore session on page load/refresh.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    console.log(`[Portal Session] Active session for customer ${session.customerPortalAuth.customerId}`);

    return NextResponse.json({
      authenticated: true,
      customerId: session.customerPortalAuth.customerId.toString(),
    });

  } catch (error: any) {
    console.error('[Portal Session] Error checking session:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }
}
