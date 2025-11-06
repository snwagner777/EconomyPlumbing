import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'customer_portal_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

interface SessionData {
  customerId?: number;
  availableCustomerIds?: number[];
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    // Check if there's an active session
    if (session.customerId) {
      // SECURITY: Verify customer still exists and is active in local database
      const { db } = await import('@/server/db');
      const { customersXlsx } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      const customer = await db
        .select({ id: customersXlsx.id, active: customersXlsx.active })
        .from(customersXlsx)
        .where(eq(customersXlsx.id, session.customerId))
        .limit(1);

      // If customer doesn't exist or is inactive, destroy session
      if (!customer.length || !customer[0].active) {
        console.log(`[Portal Session] Customer ${session.customerId} not found or inactive - destroying session`);
        session.destroy();
        await session.save();
        return NextResponse.json({ customerId: null }, { status: 200 });
      }

      return NextResponse.json({ 
        customerId: session.customerId,
        availableCustomerIds: session.availableCustomerIds || [session.customerId],
      }, { status: 200 });
    }
    
    // No active session
    return NextResponse.json({ customerId: null }, { status: 200 });
  } catch (error) {
    console.error('[Portal Session] Error checking session:', error);
    return NextResponse.json({ customerId: null }, { status: 200 });
  }
}
