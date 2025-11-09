/**
 * Admin API - SMS Marketing Statistics
 * 
 * Dashboard stats for SMS marketing overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { db } from '@/server/db';
import { smsContacts, smsCampaigns, smsMessageEvents, smsConversations } from '@shared/schema';
import { eq, and, gte, sql, count } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total opted-in contacts
    const [{ optedInCount }] = await db
      .select({ optedInCount: count() })
      .from(smsContacts)
      .where(eq(smsContacts.optedIn, true));

    // Get total campaigns
    const [{ totalCampaigns }] = await db
      .select({ totalCampaigns: count() })
      .from(smsCampaigns);

    // Get active campaigns
    const [{ activeCampaigns }] = await db
      .select({ activeCampaigns: count() })
      .from(smsCampaigns)
      .where(eq(smsCampaigns.status, 'active'));

    // Get messages sent in period
    const [{ messagesSent }] = await db
      .select({ messagesSent: count() })
      .from(smsMessageEvents)
      .where(
        and(
          eq(smsMessageEvents.direction, 'outbound'),
          gte(smsMessageEvents.createdAt, startDate)
        )
      );

    // Get delivery stats
    const [{ deliveredCount }] = await db
      .select({ deliveredCount: count() })
      .from(smsMessageEvents)
      .where(
        and(
          eq(smsMessageEvents.direction, 'outbound'),
          eq(smsMessageEvents.status, 'delivered'),
          gte(smsMessageEvents.createdAt, startDate)
        )
      );

    // Get failed messages
    const [{ failedCount }] = await db
      .select({ failedCount: count() })
      .from(smsMessageEvents)
      .where(
        and(
          eq(smsMessageEvents.direction, 'outbound'),
          eq(smsMessageEvents.status, 'failed'),
          gte(smsMessageEvents.createdAt, startDate)
        )
      );

    // Get inbound replies
    const [{ repliesCount }] = await db
      .select({ repliesCount: count() })
      .from(smsMessageEvents)
      .where(
        and(
          eq(smsMessageEvents.direction, 'inbound'),
          gte(smsMessageEvents.createdAt, startDate)
        )
      );

    // Get unread conversations
    const [{ unreadConversations }] = await db
      .select({ unreadConversations: count() })
      .from(smsConversations)
      .where(sql`${smsConversations.unreadCount} > 0`);

    // Calculate rates
    const deliveryRate = messagesSent > 0 ? ((deliveredCount / messagesSent) * 100).toFixed(2) : '0';
    const replyRate = messagesSent > 0 ? ((repliesCount / messagesSent) * 100).toFixed(2) : '0';

    return NextResponse.json({
      period: { days, startDate },
      contacts: {
        total: optedInCount,
        optedIn: optedInCount,
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
      },
      messages: {
        sent: messagesSent,
        delivered: deliveredCount,
        failed: failedCount,
        replies: repliesCount,
      },
      rates: {
        delivery: parseFloat(deliveryRate),
        reply: parseFloat(replyRate),
      },
      inbox: {
        unreadConversations,
      },
    });
  } catch (error) {
    console.error('[Admin SMS Stats API] Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
