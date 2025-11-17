import { NextRequest, NextResponse } from 'next/server';
import { portalVerifications, customersXlsx } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/session';

const MAX_VERIFICATION_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const body = await request.json();
    const { contactValue, code, lookupType } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }
    
    console.log('[Portal Verify] Verifying code for:', contactValue);
    
    // Normalize contact value to match how it was stored in lookup
    // Phone: last 10 digits only, Email: lowercase
    let normalizedContact = contactValue;
    if (contactValue) {
      if (lookupType === 'phone') {
        normalizedContact = contactValue.replace(/\D/g, '').slice(-10);
      } else {
        normalizedContact = contactValue.toLowerCase();
      }
    }
    
    // Find verification in database
    const [verification] = await db
      .select()
      .from(portalVerifications)
      .where(
        normalizedContact 
          ? and(
              eq(portalVerifications.code, code),
              eq(portalVerifications.contactValue, normalizedContact)
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
    
    // Check if too many attempts
    if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      console.log('[Portal Verify] Too many attempts, deleting verification');
      await db.delete(portalVerifications).where(eq(portalVerifications.id, verification.id));
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new verification code.' },
        { status: 429 }
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
    
    // Check if code matches (increment attempts if wrong)
    if (verification.code !== code.trim()) {
      console.log('[Portal Verify] Invalid code attempt');
      await db
        .update(portalVerifications)
        .set({ attempts: verification.attempts + 1 })
        .where(eq(portalVerifications.id, verification.id));
      
      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - (verification.attempts + 1);
      return NextResponse.json(
        { error: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` },
        { status: 401 }
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
    
    // Create unified session
    const session = await getSession();
    session.customerPortalAuth = {
      customerId: customers[0].id,
      email: customers[0].email || '',
      phone: customers[0].phone || '',
      verifiedAt: Date.now(),
      availableCustomerIds: verification.customerIds,
    };
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
