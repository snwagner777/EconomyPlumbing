import { NextRequest, NextResponse } from 'next/server';
import { redeemVoucher } from '@/server/lib/vouchers';
import { z } from 'zod';

const redeemVoucherSchema = z.object({
  code: z.string().min(1),
  jobAmount: z.number().min(0),
  technicianName: z.string().optional(),
  jobNumber: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = redeemVoucherSchema.parse(body);
    
    const result = await redeemVoucher(validatedData);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      discountAmount: result.discountAmount,
      referrerRewardVoucher: result.referrerRewardVoucher,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error redeeming voucher:', error);
    return NextResponse.json(
      { error: 'Failed to redeem voucher' },
      { status: 500 }
    );
  }
}
