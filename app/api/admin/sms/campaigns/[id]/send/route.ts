/**
 * Admin API - Send/Schedule SMS Campaign
 * 
 * POST: Send campaign immediately or schedule for later
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { db } from '@/server/db';
import { smsCampaigns, smsCampaignRuns, smsMessageEvents, smsContacts, smsCampaignMessages, smsCampaignSegments, customerSegments, customersXlsx } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { sendSMS } from '@/server/lib/sms';
import { z } from 'zod';

const sendCampaignSchema = z.object({
  sendNow: z.boolean().default(true),
  scheduledFor: z.string().datetime().optional(),
});

export async function POST(
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
    const result = sendCampaignSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
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

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Campaign must be in draft or scheduled status to send' },
        { status: 400 }
      );
    }

    if (!result.data.sendNow && !result.data.scheduledFor) {
      return NextResponse.json(
        { error: 'Must specify sendNow or scheduledFor' },
        { status: 400 }
      );
    }

    // Get target contacts based on segments with TCPA-compliant filtering
    let targetContacts: any[] = [];
    
    // TCPA filter: must be opted-in AND not opted-out
    const tcpaFilter = and(
      eq(smsContacts.optedIn, true),
      eq(smsContacts.optedOut, false)
    );
    
    if (campaign.segments && campaign.segments.length > 0) {
      // MVP: Segment targeting via providerListIds (SimpleTexting lists)
      // Each customerSegment should map to one or more providerListIds
      const segmentIds = campaign.segments.map(s => s.segmentId);
      const segmentDetails = await db
        .select()
        .from(customerSegments)
        .where(inArray(customerSegments.id, segmentIds));

      if (segmentDetails.length === 0) {
        return NextResponse.json(
          { error: 'Selected segments not found' },
          { status: 400 }
        );
      }

      // Get all provider list IDs from segment metadata (assumes segments store listIds in metadata)
      const providerListIds: string[] = [];
      for (const segment of segmentDetails) {
        // Extract listId from segment name or metadata (e.g., "segment_123" → "list_123")
        // For MVP, we'll match by segment name pattern or require listId in segment definition
        // This is a simplification - production would need proper segment→list mapping
        if (segment.name) {
          providerListIds.push(`list_${segment.id}`);
        }
      }

      if (providerListIds.length === 0) {
        // Fallback: Try matching via customersXlsx for email-based segments
        const segmentPhones: string[] = [];
        for (const segment of segmentDetails) {
          const customers = await db
            .select({ phone: customersXlsx.phone })
            .from(customersXlsx)
            .where(and(
              eq(customersXlsx.segmentId, segment.id),
              sql`${customersXlsx.phone} IS NOT NULL`
            ));
          
          segmentPhones.push(...customers.map(c => c.phone!).filter(Boolean));
        }

        if (segmentPhones.length > 0) {
          // Match SMS contacts by phone from email segments
          targetContacts = await db
            .select()
            .from(smsContacts)
            .where(
              and(
                tcpaFilter,
                inArray(smsContacts.phone, segmentPhones)
              )
            );
        } else {
          // No contacts found in segments
          return NextResponse.json(
            { error: 'No contacts found in selected segments. Please ensure segments have valid phone numbers or SMS list mappings.' },
            { status: 400 }
          );
        }
      } else {
        // Use provider list IDs for filtering (native SMS segments)
        targetContacts = await db
          .select()
          .from(smsContacts)
          .where(
            and(
              tcpaFilter,
              sql`${smsContacts.providerListIds} && ARRAY[${providerListIds.join(',')}]::text[]`
            )
          );
      }
    } else {
      // No segments - send to all TCPA-compliant contacts
      targetContacts = await db
        .select()
        .from(smsContacts)
        .where(tcpaFilter);
    }

    if (targetContacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts found for campaign' },
        { status: 400 }
      );
    }

    // For scheduled campaigns - MVP: scheduling not yet implemented
    if (!result.data.sendNow && result.data.scheduledFor) {
      return NextResponse.json(
        { 
          error: 'Campaign scheduling not yet implemented. Use sendNow: true for immediate sending.',
          note: 'Schedule feature will be added in post-MVP iteration'
        },
        { status: 501 } // Not Implemented
      );
    }

    // Send immediately - create campaign run and send messages
    const run = await db.transaction(async (tx) => {
      // Create campaign run
      const [campaignRun] = await tx
        .insert(smsCampaignRuns)
        .values({
          campaignId,
          startedAt: new Date(),
          totalRecipients: targetContacts.length,
          targetSegmentIds: campaign.segments?.map(s => s.segmentId) || [],
        })
        .returning();

      // Update campaign status
      await tx
        .update(smsCampaigns)
        .set({ status: 'active' })
        .where(eq(smsCampaigns.id, campaignId));

      // Get first message (for broadcast, or first in sequence for drip)
      const firstMessage = campaign.messages.sort((a, b) => a.sequenceNumber - b.sequenceNumber)[0];

      if (!firstMessage) {
        throw new Error('Campaign has no messages');
      }

      // Send messages to all contacts
      let sentCount = 0;
      let deliveredCount = 0;
      let failedCount = 0;

      for (const contact of targetContacts) {
        try {
          // Send SMS
          await sendSMS({
            to: contact.phone,
            message: firstMessage.body,
          });

          // Log message event
          await tx.insert(smsMessageEvents).values({
            campaignRunId: campaignRun.id,
            contactId: contact.id,
            phone: contact.phone,
            direction: 'outbound',
            body: firstMessage.body,
            status: 'sent',
            sentAt: new Date(),
            provider: 'simpletexting',
            messageOrder: 0,
            dedupeHash: `${campaignRun.id}-${contact.id}-0`, // Simple hash for now
          });

          sentCount++;
          deliveredCount++; // Optimistic - will be updated by webhook
        } catch (error) {
          console.error('[Campaign Send] Failed to send to:', contact.phone, error);
          
          // Log failure
          await tx.insert(smsMessageEvents).values({
            campaignRunId: campaignRun.id,
            contactId: contact.id,
            phone: contact.phone,
            direction: 'outbound',
            body: firstMessage.body,
            status: 'failed',
            failedAt: new Date(),
            failureReason: error instanceof Error ? error.message : 'Unknown error',
            provider: 'simpletexting',
            messageOrder: 0,
            dedupeHash: `${campaignRun.id}-${contact.id}-0`,
          });

          failedCount++;
        }
      }

      // Update campaign run stats
      await tx
        .update(smsCampaignRuns)
        .set({
          sentCount,
          deliveredCount,
          failedCount,
          completedAt: new Date(),
        })
        .where(eq(smsCampaignRuns.id, campaignRun.id));

      return campaignRun;
    });

    console.log('[Campaign Send] Campaign sent:', campaignId, run.sentCount, 'messages');

    return NextResponse.json({
      message: 'Campaign sent successfully',
      runId: run.id,
      sentCount: run.sentCount,
      deliveredCount: run.deliveredCount,
      failedCount: run.failedCount,
      totalRecipients: targetContacts.length,
    }, { status: 201 });
  } catch (error) {
    console.error('[Campaign Send API] Error:', error);
    return NextResponse.json({ error: 'Failed to send campaign' }, { status: 500 });
  }
}
