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

    const settings = await db.select().from(systemSettings);
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));
    
    return NextResponse.json({
      thankYouCustomPrompt: settingsMap.get('referral_thank_you_custom_prompt') || '',
      successCustomPrompt: settingsMap.get('referral_success_custom_prompt') || '',
      brandGuidelines: settingsMap.get('referral_email_brand_guidelines') || '',
    });
  } catch (error: any) {
    console.error("[Referral Email Settings] Error fetching settings:", error);
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

    const { thankYouCustomPrompt, successCustomPrompt, brandGuidelines } = await req.json();
    
    // Update or insert settings
    const updates = [
      { key: 'referral_thank_you_custom_prompt', value: thankYouCustomPrompt || '' },
      { key: 'referral_success_custom_prompt', value: successCustomPrompt || '' },
      { key: 'referral_email_brand_guidelines', value: brandGuidelines || '' },
    ];
    
    for (const update of updates) {
      await db
        .insert(systemSettings)
        .values({
          key: update.key,
          value: update.value,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value: update.value,
            updatedAt: new Date()
          }
        });
    }
    
    console.log("[Referral Email Settings] Settings updated successfully");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Referral Email Settings] Error updating settings:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
