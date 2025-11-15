import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'src/lib/session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

interface LegacySessionData {
  customerId?: number;
  availableCustomerIds?: number[];
}

const legacySessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'customer_portal_session',
  cookieOptions: {
    secure: true,
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function POST(req: NextRequest) {
  try {
    // DUAL-CLEAR: Destroy both session systems for complete logout
    
    // 1. Clear unified session
    const unifiedSession = await getSession();
    if (unifiedSession.customerPortalAuth) {
      unifiedSession.customerPortalAuth = undefined;
      await unifiedSession.save();
    }
    
    // 2. Clear legacy session
    const cookieStore = await cookies();
    const legacySession = await getIronSession<LegacySessionData>(cookieStore, legacySessionOptions);
    if (legacySession.customerId) {
      legacySession.destroy();
    }
    
    console.log('[Portal Logout] Both sessions cleared');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Portal] Logout error:", error);
    return NextResponse.json({ success: true }); // Return success anyway
  }
}
