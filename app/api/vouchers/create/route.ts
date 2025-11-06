import { NextRequest, NextResponse } from 'next/server';
import { createVoucher } from '@/server/lib/vouchers';
import { z } from 'zod';

const createVoucherSchema = z.object({
  voucherType: z.enum(['referral_new_customer', 'referral_reward', 'promotional']),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerId: z.number().optional(),
  referralId: z.string().optional(),
  referrerCustomerId: z.number().optional(),
  discountAmount: z.number().optional(),
  minimumJobAmount: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = createVoucherSchema.parse(body);
    
    const voucher = await createVoucher(validatedData);
    
    return NextResponse.json({
      success: true,
      voucher,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating voucher:', error);
    return NextResponse.json(
      { error: 'Failed to create voucher' },
      { status: 500 }
    );
  }
}
