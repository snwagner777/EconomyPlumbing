import { NextResponse } from 'next/server';
import { createVoucher } from '@/server/lib/vouchers';
import { z } from 'zod';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
};

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

export async function POST(request: Request) {
  try {
    // Require admin authentication
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
    
    if (!(session as any).isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
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
