/**
 * Admin API - SMS Campaign Management
 * 
 * Create and manage SMS marketing campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { db } from '@/server/db';
import { smsCampaigns } from '@shared/schema';
import { desc } from 'drizzle-orm';
import { z } from 'zod';

const smsCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  messageContent: z.string().min(1).max(1600),
  audienceDefinition: z.object({
    listIds: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    customCriteria: z.record(z.any()).optional(),
  }).optional(),
  scheduledFor: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await db
      .select()
      .from(smsCampaigns)
      .orderBy(desc(smsCampaigns.createdAt));

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

    const data = result.data;

    const [campaign] = await db.insert(smsCampaigns).values({
      name: data.name,
      messageContent: data.messageContent,
      audienceDefinition: data.audienceDefinition || { listIds: [], tags: [], customCriteria: {} },
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      status: 'draft',
      createdBy: 'admin',
    }).returning();

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error('[Admin SMS Campaigns API] Error:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
