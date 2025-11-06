import { NextRequest, NextResponse } from 'next/server';
import { getCustomerVoucherTotals } from '@/server/lib/vouchers';

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
