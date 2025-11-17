/**
 * Admin API - System Settings
 * 
 * Get and update system-wide settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { systemSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Allowed setting keys with validation
const settingsSchema = z.record(
  z.string().min(1).max(100), // key
  z.union([z.string(), z.number(), z.boolean(), z.null()]) // value
);

// Whitelist of allowed setting keys for security
const ALLOWED_SETTING_KEYS = [
  'company_name',
  'company_phone',
  'company_email',
  'notification_email',
  'default_tracking_number',
  'review_request_enabled',
  'referral_nurture_enabled',
  'ai_blog_generation_enabled',
  'google_drive_sync_enabled',
  'photo_cleanup_enabled',
  'email_campaign_from_name',
  'referral_credit_amount',
  'membership_price',
];

export async function GET(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await db.select().from(systemSettings);

    // Convert to key-value object
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ settings: settingsObj });
  } catch (error) {
    console.error('[Admin Settings API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate input structure
    const result = settingsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const updates = result.data;

    // Validate all keys are whitelisted
    const invalidKeys = Object.keys(updates).filter(
      key => !ALLOWED_SETTING_KEYS.includes(key)
    );
    
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: 'Invalid setting keys', invalidKeys },
        { status: 400 }
      );
    }

    // Update each setting
    for (const [key, value] of Object.entries(updates)) {
      await db
        .insert(systemSettings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value, updatedAt: new Date() },
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('[Admin Settings API] Error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
