import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

interface LegacySessionData {
  customerId?: number;
  availableCustomerIds?: number[];
}

const legacySessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'customer_portal_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
};

/**
 * Destroys both legacy and unified customer portal sessions
 * This ensures complete logout across all session systems
 */
export async function destroyAllPortalSessions(): Promise<void> {
  try {
    const cookieStore = await cookies();
    
    // 1. Destroy legacy session cookie (customer_portal_session)
    const legacySession = await getIronSession<LegacySessionData>(
      cookieStore,
      legacySessionOptions
    );
    await legacySession.destroy();
    
    // 2. Destroy unified session cookie (plumbing_session)
    const unifiedSession = await getSession();
    await unifiedSession.destroy();
    
    console.log('[Portal Session Utils] Both sessions destroyed');
  } catch (error) {
    console.error('[Portal Session Utils] Error destroying sessions:', error);
    throw error;
  }
}
