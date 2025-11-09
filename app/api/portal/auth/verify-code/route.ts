import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { portalVerifications, customersXlsx } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

interface SessionData {
  customerId?: number;
  availableCustomerIds?: number[];
}

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactValue, code } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }
    
    console.log('[Portal Verify] Verifying code for:', contactValue);
    
    // Find verification in database
    const [verification] = await db
      .select()
      .from(portalVerifications)
      .where(
        contactValue 
          ? and(
              eq(portalVerifications.code, code),
              eq(portalVerifications.contactValue, contactValue)
            )
          : eq(portalVerifications.code, code) // Support token-only magic links
      )
      .limit(1);
    
    if (!verification) {
      console.log('[Portal Verify] Verification code not found');
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 404 }
      );
    }
    
    // Check if expired
    if (new Date() > verification.expiresAt) {
      console.log('[Portal Verify] Verification code expired');
      await db.delete(portalVerifications).where(eq(portalVerifications.id, verification.id));
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 410 }
      );
    }
    
    console.log('[Portal Verify] Code verified, customer IDs:', verification.customerIds);
    
    // Get customer details from database (customers_xlsx)
    const customers = await db
      .select({
        id: customersXlsx.id,
        name: customersXlsx.name,
        email: customersXlsx.email,
        phone: customersXlsx.phone,
      })
      .from(customersXlsx)
      .where(
        // Find all matching customer IDs from verification
        eq(customersXlsx.id, verification.customerIds[0])
      );
    
    // Fetch additional customers if multiple IDs
    if (verification.customerIds.length > 1) {
      for (let i = 1; i < verification.customerIds.length; i++) {
        const [additionalCustomer] = await db
          .select({
            id: customersXlsx.id,
            name: customersXlsx.name,
            email: customersXlsx.email,
            phone: customersXlsx.phone,
          })
          .from(customersXlsx)
          .where(eq(customersXlsx.id, verification.customerIds[i]));
        
        if (additionalCustomer) {
          customers.push(additionalCustomer);
        }
      }
    }
    
    if (customers.length === 0) {
      return NextResponse.json(
        { error: 'No customer accounts found' },
        { status: 404 }
      );
    }
    
    // Create portal session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.customerId = customers[0].id;
    session.availableCustomerIds = verification.customerIds;
    await session.save();
    
    console.log('[Portal Verify] Session created for customer:', customers[0].id);
    
    // Delete used verification code
    await db.delete(portalVerifications).where(eq(portalVerifications.id, verification.id));
    
    return NextResponse.json({
      success: true,
      customers: customers.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
      })),
    });
  } catch (error: any) {
    console.error('[Portal Verify] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
