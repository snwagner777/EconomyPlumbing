/**
 * Admin API - Individual SMS Campaign Operations
 * 
 * PATCH: Update campaign status (activate, pause, complete)
 * DELETE: Remove campaign and related messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getSession } from '@/lib/session';
import { db } from '@/server/db';
import { smsCampaigns, smsCampaignMessages, smsCampaignSegments } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateCampaignSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const campaignId = parseInt(id);
    
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    // Get campaign with messages and segments
    const campaign = await db.query.smsCampaigns.findFirst({
      where: eq(smsCampaigns.id, campaignId),
      with: {
        messages: true,
        segments: {
          with: {
            segment: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('[Admin SMS Campaigns API] Error fetching campaign:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const campaignId = parseInt(id);
    
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    const body = await req.json();
    
    // Validate input
    const result = updateCampaignSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Handle status transitions
    const updateData: any = { ...result.data };
    if (result.data.status === 'paused') {
      updateData.pausedAt = new Date();
    }
    if (result.data.status === 'completed' || result.data.status === 'cancelled') {
      updateData.completedAt = new Date();
    }

    // Update campaign
    const [updated] = await db
      .update(smsCampaigns)
      .set(updateData)
      .where(eq(smsCampaigns.id, campaignId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    console.log('[Admin SMS Campaigns API] Updated campaign:', campaignId, result.data.status);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Admin SMS Campaigns API] Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const campaignId = parseInt(id);
    
    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    // Delete campaign in transaction (cascades to messages and segments)
    const result = await db.transaction(async (tx) => {
      // Delete segments first
      await tx.delete(smsCampaignSegments).where(eq(smsCampaignSegments.campaignId, campaignId));
      
      // Delete messages
      await tx.delete(smsCampaignMessages).where(eq(smsCampaignMessages.campaignId, campaignId));
      
      // Delete campaign
      const [deleted] = await tx
        .delete(smsCampaigns)
        .where(eq(smsCampaigns.id, campaignId))
        .returning();
      
      return deleted;
    });

    if (!result) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    console.log('[Admin SMS Campaigns API] Deleted campaign:', campaignId, result.name);

    return NextResponse.json({ success: true, deletedCampaign: result });
  } catch (error) {
    console.error('[Admin SMS Campaigns API] Error deleting campaign:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
