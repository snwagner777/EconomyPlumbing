/**
 * GET /api/referrals/code
 * 
 * Generates or retrieves a customer's unique referral code and tracking link.
 * Returns click/conversion statistics for the customer's referral link.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { referralCodes, referrals } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Generate a unique referral code using customer ID
 * Simple format: just the customer ID number
 */
function generateReferralCode(customerName: string, customerId: number): string {
  return customerId.toString();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerIdParam = searchParams.get('customerId');
    
    if (!customerIdParam) {
      return NextResponse.json(
        { error: 'Missing customerId parameter' },
        { status: 400 }
      );
    }
    
    const customerId = parseInt(customerIdParam);
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customerId parameter' },
        { status: 400 }
      );
    }
    
    // Check if customer already has a referral code
    let existingCode = await db.query.referralCodes.findFirst({
      where: eq(referralCodes.customerId, customerId),
    });
    
    // If no code exists, create one
    if (!existingCode) {
      // Try to fetch from customers_xlsx table first
      let customer = await db.query.customersXlsx.findFirst({
        where: (customers, { eq }) => eq(customers.id, customerId),
      });
      
      // If not in customers_xlsx, fetch from ServiceTitan as fallback
      if (!customer) {
        const { getServiceTitanClient } = await import('@/server/lib/serviceTitanClient');
        const st = await getServiceTitanClient();
        
        try {
          const stCustomer = await st.getCustomer(customerId);
          customer = {
            id: stCustomer.id,
            name: stCustomer.name,
            phone: stCustomer.phoneNumber || '',
            email: stCustomer.email || '',
          };
        } catch (error) {
          console.error(`[Referral Code API] Customer ${customerId} not found in customers_xlsx or ServiceTitan:`, error);
          return NextResponse.json(
            { error: 'Customer not found' },
            { status: 404 }
          );
        }
      }
      
      const code = generateReferralCode(customer.name, customerId);
      
      // Insert new referral code
      [existingCode] = await db
        .insert(referralCodes)
        .values({
          code,
          customerId,
          customerName: customer.name,
          customerPhone: customer.phone || '',
          createdAt: new Date(),
        })
        .returning();
    }
    
    // Calculate statistics from referrals table
    const customerReferrals = await db.query.referrals.findMany({
      where: eq(referrals.referrerCustomerId, customerId),
    });
    
    // Count conversions (completed jobs)
    const conversions = customerReferrals.filter(
      r => r.status === 'job_completed' || r.status === 'credited'
    ).length;
    
    // Generate tracking URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plumbersthatcare.com';
    const trackingUrl = `${baseUrl}/ref/${existingCode.code}`;
    
    return NextResponse.json({
      code: existingCode.code,
      url: trackingUrl,
      clicks: 0, // TODO: Implement click tracking if needed
      conversions,
    });
  } catch (error) {
    console.error('[Referral Code API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve referral code' },
      { status: 500 }
    );
  }
}
