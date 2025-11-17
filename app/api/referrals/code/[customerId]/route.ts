/**
 * Referral Code Generation API
 * 
 * Generates or retrieves unique referral code for a customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { referralCodes, customersXlsx } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { db } = await import('@/server/db');
  try {
    const { customerId } = await params;
    const customerIdNum = parseInt(customerId);

    if (isNaN(customerIdNum)) {
      return NextResponse.json(
        { message: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    // Check if customer already has a code
    const [existingCode] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.customerId, customerIdNum))
      .limit(1);

    if (existingCode) {
      // Generate tracking URL
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plumbersthatcare.com';
      const url = `${baseUrl}/ref/${existingCode.code}`;
      
      return NextResponse.json({
        code: existingCode.code,
        url,
        clicks: 0, // TODO: Implement click tracking if needed
        conversions: 0, // TODO: Track from referrals table
        customerId: existingCode.customerId,
        customerName: existingCode.customerName,
      });
    }

    // Get customer info
    const [customer] = await db
      .select({
        name: customersXlsx.name,
        phone: customersXlsx.phone,
      })
      .from(customersXlsx)
      .where(sql`${customersXlsx.id} = ${customerIdNum}`)
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Use customer ID as the referral code (simple and non-intrusive)
    const code = customerIdNum.toString();

    // Store code
    const [newCode] = await db
      .insert(referralCodes)
      .values({
        customerId: customerIdNum,
        customerName: customer.name,
        customerPhone: customer.phone || null,
        code,
      })
      .returning();

    console.log(`[Referral Code] Generated ${code} for customer ${customerIdNum}`);

    // Generate tracking URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plumbersthatcare.com';
    const url = `${baseUrl}/ref/${newCode.code}`;

    return NextResponse.json({
      code: newCode.code,
      url,
      clicks: 0, // New code, no clicks yet
      conversions: 0, // New code, no conversions yet
      customerId: newCode.customerId,
      customerName: newCode.customerName,
    });

  } catch (error: any) {
    console.error('[Referral Code API] Error:', error);
    return NextResponse.json(
      { message: 'Error generating referral code' },
      { status: 500 }
    );
  }
}
