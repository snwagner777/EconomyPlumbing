/**
 * Cron Endpoint: Review Request Emails
 * 
 * Processes pending review request emails.
 * Schedule: Every 30 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCronAuth } from '@/server/lib/cronAuth';
import { getReviewRequestScheduler } from '@/server/lib/reviewRequestScheduler';

export async function POST(req: NextRequest) {
  // Validate authentication
  const authError = validateCronAuth(req);
  if (authError) return authError;

  try {
    console.log('[Cron] Review Requests: Starting...');
    const reviewRequestScheduler = getReviewRequestScheduler();
    await reviewRequestScheduler.processPendingEmails();
    console.log('[Cron] Review Requests: Completed');

    return NextResponse.json({ 
      success: true, 
      message: 'Review requests processed successfully' 
    });
  } catch (error: any) {
    console.error('[Cron] Review Requests: Error:', error);
    return NextResponse.json(
      { error: 'Failed to process review requests', details: error.message },
      { status: 500 }
    );
  }
}
