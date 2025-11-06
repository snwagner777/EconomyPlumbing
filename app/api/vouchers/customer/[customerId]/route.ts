import { NextRequest, NextResponse } from 'next/server';
import { getCustomerVoucherTotals } from '@/server/lib/vouchers';
import { db } from '@/server/db';
import { vouchers, serviceTitanCustomers } from '@shared/schema';
import { and, eq, isNull, or } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params;
    const customerIdNum = parseInt(customerId);
    
    if (isNaN(customerIdNum)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }
    
    // First, reconcile any unlinked vouchers for this customer
    // Get customer's phone number
    const [customer] = await db
      .select()
      .from(serviceTitanCustomers)
      .where(eq(serviceTitanCustomers.id, customerIdNum))
      .limit(1);
    
    if (customer && customer.phone) {
      // Link any vouchers with matching phone that don't have a customerId yet
      await db
        .update(vouchers)
        .set({ 
          customerId: customerIdNum,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(vouchers.customerPhone, customer.phone),
            isNull(vouchers.customerId)
          )
        );
    }
    
    const voucherData = await getCustomerVoucherTotals(customerIdNum);
    
    return NextResponse.json(voucherData);
  } catch (error) {
    console.error('Error fetching customer vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    );
  }
}
