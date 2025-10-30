import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { systemSettings } from '@shared/schema';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const dbSettings = await db.select().from(systemSettings);
    const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

    const settings = {
      reviewMasterEmailSwitch: settingsMap.get('review_master_email_switch') === 'true',
      reviewDripEnabled: settingsMap.get('review_drip_enabled') === 'true',
      referralDripEnabled: settingsMap.get('referral_drip_enabled') === 'true',
      autoSendReviewRequests: settingsMap.get('auto_send_review_requests') === 'true',
      autoStartReferralCampaigns: settingsMap.get('auto_start_referral_campaigns') === 'true',
      reviewRequestPhoneNumber: settingsMap.get('review_request_phone_number') || '',
      reviewRequestPhoneFormatted: settingsMap.get('review_request_phone_formatted') || '',
      referralNurturePhoneNumber: settingsMap.get('referral_nurture_phone_number') || '',
      referralNurturePhoneFormatted: settingsMap.get('referral_nurture_phone_formatted') || '',
      quoteFollowupPhoneNumber: settingsMap.get('quote_followup_phone_number') || '',
      quoteFollowupPhoneFormatted: settingsMap.get('quote_followup_phone_formatted') || ''
    };
    
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("[Review Requests] Error fetching settings:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const updates = await req.json();

    // SERVER-SIDE VALIDATION: Prevent enabling master switch without phone number
    if (updates.reviewMasterEmailSwitch === true) {
      const dbSettings = await db.select().from(systemSettings);
      const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));
      const phoneNumber = settingsMap.get('review_request_phone_number');
      
      if (!phoneNumber) {
        return NextResponse.json({
          error: "Cannot enable master email switch without a configured phone number. Please set a phone number first."
        }, { status: 400 });
      }
    }

    // Save each setting to database
    for (const [key, value] of Object.entries(updates)) {
      // Convert camelCase to snake_case
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      
      await db
        .insert(systemSettings)
        .values({
          key: dbKey,
          value: String(value),
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value: String(value),
            updatedAt: new Date()
          }
        });
    }
    
    // Re-query database to get actual current state
    const dbSettings = await db.select().from(systemSettings);
    const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));
    
    const currentSettings = {
      reviewMasterEmailSwitch: settingsMap.get('review_master_email_switch') === 'true',
      reviewDripEnabled: settingsMap.get('review_drip_enabled') === 'true',
      referralDripEnabled: settingsMap.get('referral_drip_enabled') === 'true',
      autoSendReviewRequests: settingsMap.get('auto_send_review_requests') === 'true',
      autoStartReferralCampaigns: settingsMap.get('auto_start_referral_campaigns') === 'true',
      reviewRequestPhoneNumber: settingsMap.get('review_request_phone_number') || '',
      reviewRequestPhoneFormatted: settingsMap.get('review_request_phone_formatted') || '',
      referralNurturePhoneNumber: settingsMap.get('referral_nurture_phone_number') || '',
      referralNurturePhoneFormatted: settingsMap.get('referral_nurture_phone_formatted') || '',
      quoteFollowupPhoneNumber: settingsMap.get('quote_followup_phone_number') || '',
      quoteFollowupPhoneFormatted: settingsMap.get('quote_followup_phone_formatted') || ''
    };
    
    console.log("[Review Requests] Settings updated:", currentSettings);
    return NextResponse.json({ success: true, settings: currentSettings });
  } catch (error: any) {
    console.error("[Review Requests] Error updating settings:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
