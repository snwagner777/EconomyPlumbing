/**
 * Referral Code Generation API
 * 
 * Generates or retrieves unique referral code for a customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { referralCodes, customersXlsx } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
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
      return NextResponse.json({
        code: existingCode.code,
        customerId: existingCode.customerId,
        customerName: existingCode.customerName,
      });
    }

    // Get customer info
    const [customer] = await db
      .select({
        name: customersXlsx.name,
        phone: customersXlsx.phoneNumber,
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

    // Generate unique code (e.g., JOHN-SMITH-ABC)
    const nameParts = customer.name.trim().toUpperCase().split(' ');
    const firstName = nameParts[0] || 'CUSTOMER';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    const code = `${firstName}${lastName ? `-${lastName}` : ''}-${randomSuffix}`;

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

    return NextResponse.json({
      code: newCode.code,
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
