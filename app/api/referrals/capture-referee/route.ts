/**
 * Capture Referee API
 * 
 * Captures referee info using referral code from landing page
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { referralCodes, referrals, customersXlsx, contactsXlsx } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

const captureRefereeSchema = z.object({
  referralCode: z.string(),
  refereeName: z.string().min(2),
  refereePhone: z.string().min(10),
  refereeEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = captureRefereeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: 'Missing required fields', details: result.error.errors },
        { status: 400 }
      );
    }

    const { referralCode, refereeName, refereePhone, refereeEmail } = result.data;

    console.log(`[Referrals] Capturing referee: ${refereeName} (${refereePhone}) referred by code: ${referralCode}`);

    // Look up referrer from code mapping
    const [codeMapping] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, referralCode))
      .limit(1);

    if (!codeMapping) {
      console.error(`[Referrals] Referral code not found: ${referralCode}`);
      return NextResponse.json(
        { message: 'Invalid referral code' },
        { status: 404 }
      );
    }

    console.log(`[Referrals] Found referrer: Customer ${codeMapping.customerId} (${codeMapping.customerName})`);

    // Check if referee is already a customer (mark as ineligible if they are)
    let refereeCustomerId: number | null = null;
    let creditNotes: string | null = null;

    try {
      // Search in contacts_xlsx by phone
      const normalizedPhone = refereePhone.replace(/\D/g, '');
      const [existingContact] = await db
        .select({ customerId: contactsXlsx.customerId })
        .from(contactsXlsx)
        .where(sql`${contactsXlsx.normalizedValue} LIKE ${`%${normalizedPhone}%`}`)
        .limit(1);

      if (existingContact && existingContact.customerId) {
        refereeCustomerId = existingContact.customerId;
        creditNotes = 'ineligible - already a customer at time of referral';
        console.log(`[Referrals] Referee "${refereeName}" is already a customer (ID: ${refereeCustomerId}) - marking as ineligible`);
      }
    } catch (error) {
      console.error('[Referrals] Error checking referee:', error);
    }

    // Create referral record
    const [referral] = await db.insert(referrals).values({
      referralCode,
      referrerName: codeMapping.customerName,
      referrerPhone: codeMapping.customerPhone || 'UNKNOWN',
      referrerCustomerId: codeMapping.customerId,
      refereeName,
      refereePhone,
      refereeEmail: refereeEmail || null,
      refereeCustomerId,
      status: creditNotes ? 'ineligible' : 'pending',
      creditNotes,
      submittedAt: new Date(),
    }).returning();

    console.log(`[Referrals] Created referral ${referral.id} - Status: ${referral.status}`);

    return NextResponse.json({
      success: true,
      message: 'Referral submitted successfully!',
      referralId: referral.id,
    });

  } catch (error: any) {
    console.error('[Referral Capture Referee API] Error:', error);
    return NextResponse.json(
      { message: 'Error submitting referral' },
      { status: 500 }
    );
  }
}
