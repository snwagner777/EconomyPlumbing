/**
 * Public API - Referral Submission
 * 
 * Handle customer referral submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { referrals, serviceTitanCustomers, customersXlsx } from '@shared/schema';
import { z } from 'zod';
import { createReferralVouchers } from '@/server/lib/vouchers';
import { sendRefereeWelcomeEmail, sendReferrerThankYouEmail } from '@/server/lib/resendClient';
import { normalizePhone } from '@/server/lib/serviceTitan';
import { eq, or, sql } from 'drizzle-orm';

const referralSchema = z.object({
  referrerName: z.string().min(1).max(200),
  referrerEmail: z.string().email().optional().or(z.literal('')),
  referrerPhone: z.string().min(1),
  refereeName: z.string().min(1).max(200),
  refereeEmail: z.string().email().optional().or(z.literal('')),
  refereePhone: z.string().min(1),
  refereeAddress: z.string().optional(),
  refereeCity: z.string().optional(),
  refereeState: z.string().optional(),
  refereeZip: z.string().optional(),
  serviceNeeded: z.string().optional(),
  notes: z.string().optional(),
});

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + 60 * 60 * 1000, // 1 hour
    });
    return true;
  }

  if (limit.count >= 3) {
    return false; // Max 3 referrals per hour
  }

  limit.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many referrals submitted. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const result = referralSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Check if referee is already an existing customer (reject if so)
    // Normalize phone number for comparison (strip formatting)
    const normalizedRefereePhone = normalizePhone(result.data.refereePhone);
    
    // Validate that normalized phone is valid (not empty and has minimum length)
    if (!normalizedRefereePhone || normalizedRefereePhone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please provide a valid 10-digit phone number.' },
        { status: 400 }
      );
    }
    
    // Check XLSX table first (primary source) - using SQL normalization for accurate matching
    const existingRefereeXlsx = await db
      .select()
      .from(customersXlsx)
      .where(
        or(
          sql`regexp_replace(${customersXlsx.phone}, '[^0-9]', '', 'g') = ${normalizedRefereePhone}`,
          sql`regexp_replace(${customersXlsx.mobilePhone}, '[^0-9]', '', 'g') = ${normalizedRefereePhone}`
        )
      )
      .limit(1);
    
    if (existingRefereeXlsx.length > 0) {
      return NextResponse.json(
        { 
          error: 'This person is already a customer! Referral rewards are for bringing in new customers only.',
          isExistingCustomer: true
        },
        { status: 400 }
      );
    }
    
    // Also check legacy ServiceTitan table (in case XLSX import hasn't synced yet)
    // Check BOTH phone and mobilePhone columns
    const existingRefereeST = await db
      .select()
      .from(serviceTitanCustomers)
      .where(
        or(
          sql`regexp_replace(${serviceTitanCustomers.phone}, '[^0-9]', '', 'g') = ${normalizedRefereePhone}`,
          sql`regexp_replace(${serviceTitanCustomers.mobilePhone}, '[^0-9]', '', 'g') = ${normalizedRefereePhone}`
        )
      )
      .limit(1);
    
    if (existingRefereeST.length > 0) {
      return NextResponse.json(
        { 
          error: 'This person is already a customer! Referral rewards are for bringing in new customers only.',
          isExistingCustomer: true
        },
        { status: 400 }
      );
    }
    
    // Look up referrer customer ID from ServiceTitan by phone (using normalized comparison)
    // Check BOTH phone and mobilePhone columns for complete coverage
    const normalizedReferrerPhone = normalizePhone(result.data.referrerPhone);
    
    // Validate referrer phone (must be valid to process referral)
    if (!normalizedReferrerPhone || normalizedReferrerPhone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid referrer phone number format. Please provide a valid 10-digit phone number.' },
        { status: 400 }
      );
    }
    
    let referrerCustomerId: number | undefined;
    const [referrerCustomer] = await db
      .select()
      .from(serviceTitanCustomers)
      .where(
        or(
          sql`regexp_replace(${serviceTitanCustomers.phone}, '[^0-9]', '', 'g') = ${normalizedReferrerPhone}`,
          sql`regexp_replace(${serviceTitanCustomers.mobilePhone}, '[^0-9]', '', 'g') = ${normalizedReferrerPhone}`
        )
      )
      .limit(1);
    
    if (referrerCustomer) {
      referrerCustomerId = referrerCustomer.id; // id is the ServiceTitan customer ID
    }
    
    // Look up referee customer ID if they already exist (shouldn't happen after check above)
    // Using normalized comparison for consistency, checking BOTH phone columns
    let refereeCustomerId: number | undefined;
    const [refereeCustomer] = await db
      .select()
      .from(serviceTitanCustomers)
      .where(
        or(
          sql`regexp_replace(${serviceTitanCustomers.phone}, '[^0-9]', '', 'g') = ${normalizedRefereePhone}`,
          sql`regexp_replace(${serviceTitanCustomers.mobilePhone}, '[^0-9]', '', 'g') = ${normalizedRefereePhone}`
        )
      )
      .limit(1);
    
    if (refereeCustomer) {
      refereeCustomerId = refereeCustomer.id;
    }

    // Create referral record
    const [referral] = await db
      .insert(referrals)
      .values({
        ...result.data,
        referrerCustomerId,
        submittedAt: new Date(),
        status: 'pending',
      })
      .returning();

    // Create instant voucher for referee (and prepare for referrer reward)
    let voucherData;
    if (referrerCustomerId) {
      try {
        voucherData = await createReferralVouchers({
          referralId: referral.id,
          refereeName: referral.refereeName,
          refereeEmail: referral.refereeEmail ?? undefined,
          refereePhone: referral.refereePhone,
          refereeCustomerId, // Link to existing customer if found
          referrerCustomerId,
          referrerName: referral.referrerName,
        });
        
        // Send welcome email to referee with QR code voucher
        if (referral.refereeEmail && voucherData?.refereeVoucher) {
          try {
            await sendRefereeWelcomeEmail({
              refereeName: referral.refereeName,
              refereeEmail: referral.refereeEmail,
              referrerName: referral.referrerName,
              voucherCode: voucherData.refereeVoucher.code,
              voucherQRCode: voucherData.refereeVoucher.qrCode,
              discountAmount: 2500, // $25
              expiresAt: voucherData.refereeVoucher.expiresAt,
            });
            console.log('[Referral] Referee welcome email sent successfully');
          } catch (emailError) {
            console.error('[Referral] Failed to send referee welcome email:', emailError);
            // Don't fail the referral submission if email fails
          }
        }
      } catch (error) {
        console.error('[Referral Voucher Creation] Error:', error);
        // Continue even if voucher creation fails
      }
    }

    // Send thank you email to referrer
    if (result.data.referrerEmail) {
      try {
        await sendReferrerThankYouEmail({
          referrerName: result.data.referrerName,
          referrerEmail: result.data.referrerEmail,
          refereeName: result.data.refereeName,
        });
        console.log('[Referral] Referrer thank you email sent successfully');
      } catch (emailError) {
        console.error('[Referral] Failed to send referrer thank you email:', emailError);
        // Don't fail the referral submission if email fails
      }
    }

    // TODO: Notify admin

    return NextResponse.json({
      success: true,
      message: 'Thank you for your referral! We will contact them soon.',
      referralId: referral.id,
      voucherCode: voucherData?.refereeVoucher.code,
    }, { status: 201 });
  } catch (error) {
    console.error('[Referral Submission API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit referral' },
      { status: 500 }
    );
  }
}
