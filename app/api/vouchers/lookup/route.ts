import { NextRequest, NextResponse } from 'next/server';
import { vouchers } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Public endpoint - lookup voucher by code
 * No authentication required - techs scan QR codes with phone camera
 */
export async function GET(request: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Voucher code is required' },
        { status: 400 }
      );
    }

    const [voucher] = await db
      .select()
      .from(vouchers)
      .where(eq(vouchers.code, code.toUpperCase()))
      .limit(1);

    if (!voucher) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      );
    }

    // Check if expired
    const isExpired = new Date() > new Date(voucher.expiresAt);
    const actualStatus = isExpired ? 'expired' : voucher.status;

    // Return only necessary fields (no PII like email/phone, no referral metadata)
    return NextResponse.json({
      voucher: {
        id: voucher.id,
        code: voucher.code,
        voucherType: voucher.voucherType,
        customerName: voucher.customerName, // Name only, no email/phone
        discountAmount: voucher.discountAmount,
        minimumJobAmount: voucher.minimumJobAmount,
        status: actualStatus,
        expiresAt: voucher.expiresAt,
        redeemedAt: voucher.redeemedAt,
      }
    });
  } catch (error) {
    console.error('Error looking up voucher:', error);
    return NextResponse.json(
      { error: 'Failed to lookup voucher' },
      { status: 500 }
    );
  }
}
