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
 * Generate a unique referral code based on customer name and ID
 * Format: FIRSTNAME-LAST-XXXX (e.g., "JOHN-SMITH-5127")
 */
function generateReferralCode(customerName: string, customerId: number): string {
  const nameParts = customerName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '') // Remove non-letters
    .split(/\s+/)
    .filter(Boolean);
  
  const firstName = nameParts[0] || 'CUSTOMER';
  const lastName = nameParts[nameParts.length - 1] || '';
  
  // Use last 4 digits of customer ID for uniqueness
  const idSuffix = String(customerId).slice(-4).padStart(4, '0');
  
  if (lastName && lastName !== firstName) {
    return `${firstName}-${lastName}-${idSuffix}`;
  } else {
    return `${firstName}-${idSuffix}`;
  }
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
      // We need customer name to generate the code
      // For now, we'll fetch from customers_xlsx table
      const customer = await db.query.customersXlsx.findFirst({
        where: (customers, { eq }) => eq(customers.id, customerId),
      });
      
      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      
      const code = generateReferralCode(customer.name, customerId);
      
      // Insert new referral code
      [existingCode] = await db
        .insert(referralCodes)
        .values({
          code,
          customerId,
          customerName: customer.name,
          customerPhone: customer.phone,
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
