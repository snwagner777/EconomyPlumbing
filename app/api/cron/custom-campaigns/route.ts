/**
 * Cron Endpoint: Custom Campaign Emails
 * 
 * Processes custom marketing campaign emails.
 * Schedule: Every 30 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCronAuth } from '@/server/lib/cronAuth';
import { customCampaignScheduler } from '@/server/lib/customCampaignScheduler';

export async function POST(req: NextRequest) {
  // Validate authentication
  const authError = validateCronAuth(req);
  if (authError) return authError;

  try {
    console.log('[Cron] Custom Campaigns: Starting...');
    await customCampaignScheduler.processCampaigns();
    console.log('[Cron] Custom Campaigns: Completed');

    return NextResponse.json({ 
      success: true, 
      message: 'Custom campaigns processed successfully' 
    });
  } catch (error: any) {
    console.error('[Cron] Custom Campaigns: Error:', error);
    return NextResponse.json(
      { error: 'Failed to process custom campaigns', details: error.message },
      { status: 500 }
    );
  }
}
