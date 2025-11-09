/**
 * Admin API - SMS Campaigns Management
 * 
 * CRUD operations for SMS marketing campaigns
 * Supports broadcast and drip sequences
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getSession } from '@/lib/session';
import { db } from '@/server/db';
import { smsCampaigns, smsCampaignMessages, smsCampaignSegments, customerSegments, insertSmsCampaignSchema, insertSmsCampaignMessageSchema } from '@shared/schema';
import { desc, eq, and, count, inArray } from 'drizzle-orm';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const campaignType = searchParams.get('type');
    const offset = (page - 1) * limit;

    // Build filters
    const filters = [];
    if (status) {
      filters.push(eq(smsCampaigns.status, status as any));
    }
    if (campaignType) {
      filters.push(eq(smsCampaigns.campaignType, campaignType as any));
    }

    // Get total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(smsCampaigns)
      .where(filters.length > 0 ? and(...filters) : undefined);

    // Get paginated campaigns
    const campaigns = await db
      .select()
      .from(smsCampaigns)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(smsCampaigns.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('[Admin SMS Campaigns API] Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

const createCampaignSchema = z.object({
  campaign: insertSmsCampaignSchema,
  messages: z.array(insertSmsCampaignMessageSchema),
  segmentIds: z.array(z.string()).optional(), // customerSegments uses varchar IDs
});

export async function POST(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession();
    const body = await req.json();
    
    // Validate input
    const result = createCampaignSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Validate segments exist
    if (result.data.segmentIds && result.data.segmentIds.length > 0) {
      const segments = await db
        .select({ id: customerSegments.id })
        .from(customerSegments)
        .where(inArray(customerSegments.id, result.data.segmentIds));
      
      if (segments.length !== result.data.segmentIds.length) {
        return NextResponse.json(
          { error: 'One or more segment IDs do not exist' },
          { status: 400 }
        );
      }
    }

    // Create campaign in transaction
    const campaign = await db.transaction(async (tx) => {
      // Insert campaign with audit trail
      const [newCampaign] = await tx
        .insert(smsCampaigns)
        .values({
          ...result.data.campaign,
          createdBy: session?.user?.email || 'admin',
        })
        .returning();

      // Insert messages
      if (result.data.messages.length > 0) {
        await tx.insert(smsCampaignMessages).values(
          result.data.messages.map((msg, index) => ({
            ...msg,
            campaignId: newCampaign.id,
            sequenceNumber: msg.sequenceNumber ?? index,
          }))
        );
      }

      // Link segments
      if (result.data.segmentIds && result.data.segmentIds.length > 0) {
        await tx.insert(smsCampaignSegments).values(
          result.data.segmentIds.map(segmentId => ({
            campaignId: newCampaign.id,
            segmentId,
          }))
        );
      }

      return newCampaign;
    });

    console.log('[Admin SMS Campaigns API] Created campaign:', campaign.id, campaign.name);

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('[Admin SMS Campaigns API] Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
