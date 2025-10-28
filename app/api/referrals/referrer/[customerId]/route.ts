/**
 * Referrer Info API
 * 
 * Fetches referrer information for referral landing page
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customersXlsx } from '@shared/schema';
import { sql } from 'drizzle-orm';

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

    // Look up referrer info from customers_xlsx
    const [customer] = await db
      .select({
        name: customersXlsx.name,
        customerId: customersXlsx.id,
      })
      .from(customersXlsx)
      .where(sql`${customersXlsx.id} = ${customerIdNum}`)
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { message: 'Referrer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: customer.name,
      customerId: customer.customerId,
    });

  } catch (error: any) {
    console.error('[Referrer Info API] Error:', error);
    return NextResponse.json(
      { message: 'Error fetching referrer information' },
      { status: 500 }
    );
  }
}
