import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    
    // Check if there's an active portal session
    if (session.customerPortalAuth?.customerId) {
      // SECURITY: Verify customer still exists and is active in local database
      const { db } = await import('@/server/db');
      const { customersXlsx } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      const customer = await db
        .select({ id: customersXlsx.id, active: customersXlsx.active })
        .from(customersXlsx)
        .where(eq(customersXlsx.id, session.customerPortalAuth.customerId))
        .limit(1);

      // If customer doesn't exist or is inactive, destroy portal session
      if (!customer.length || !customer[0].active) {
        console.log(`[Portal Session] Customer ${session.customerPortalAuth.customerId} not found or inactive - destroying portal session`);
        delete session.customerPortalAuth;
        await session.save();
        return NextResponse.json({ customerId: null }, { status: 200 });
      }

      return NextResponse.json({ 
        customerId: session.customerPortalAuth.customerId,
        availableCustomerIds: session.customerPortalAuth.availableCustomerIds || [session.customerPortalAuth.customerId],
      }, { status: 200 });
    }
    
    // No active session
    return NextResponse.json({ customerId: null }, { status: 200 });
  } catch (error) {
    console.error('[Portal Session] Error checking session:', error);
    return NextResponse.json({ customerId: null }, { status: 200 });
  }
}
