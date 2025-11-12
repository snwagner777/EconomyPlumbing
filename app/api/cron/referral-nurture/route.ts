/**
 * Cron Endpoint: Referral Nurture Emails
 * 
 * Processes pending referral nurture campaign emails.
 * Schedule: Every 30 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCronAuth } from '@/server/lib/cronAuth';
import { getReferralNurtureScheduler } from '@/server/lib/referralNurtureScheduler';

export async function POST(req: NextRequest) {
  // Validate authentication
  const authError = validateCronAuth(req);
  if (authError) return authError;

  try {
    console.log('[Cron] Referral Nurture: Starting...');
    const referralNurtureScheduler = getReferralNurtureScheduler();
    await referralNurtureScheduler.processPendingEmails();
    console.log('[Cron] Referral Nurture: Completed');

    return NextResponse.json({ 
      success: true, 
      message: 'Referral nurture emails processed successfully' 
    });
  } catch (error: any) {
    console.error('[Cron] Referral Nurture: Error:', error);
    return NextResponse.json(
      { error: 'Failed to process referral nurture emails', details: error.message },
      { status: 500 }
    );
  }
}
