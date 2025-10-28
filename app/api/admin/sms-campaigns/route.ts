/**
 * Admin API - SMS Campaign Management
 * 
 * Create and manage SMS marketing campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { db } from '@/server/db';
import { customCampaignEmails } from '@shared/schema';
import { desc } from 'drizzle-orm';
import { z } from 'zod';

const smsCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  message: z.string().min(1).max(1600),
  segmentCriteria: z.record(z.any()).optional(),
  scheduledFor: z.string().datetime().optional(),
  provider: z.enum(['twilio', 'zoom_phone']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: SMS campaigns table not yet created
    // Using customCampaignEmails temporarily
    const campaigns = await db
      .select()
      .from(customCampaignEmails)
      .orderBy(desc(customCampaignEmails.createdAt));

    return NextResponse.json({
      campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    console.error('[Admin SMS Campaigns API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate input
    const result = smsCampaignSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // TODO: SMS campaigns table not yet created
    return NextResponse.json({ error: 'SMS campaigns temporarily unavailable' }, { status: 503 });
  } catch (error) {
    console.error('[Admin SMS Campaigns API] Error:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
