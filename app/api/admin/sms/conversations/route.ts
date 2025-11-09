/**
 * Admin API - SMS Conversations (2-way Inbox)
 * 
 * Manage 2-way SMS conversations with customers
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { db } from '@/server/db';
import { smsConversations, smsMessageEvents } from '@shared/schema';
import { desc, eq, and, or, like, sql, count } from 'drizzle-orm';

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
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    // Build filters
    const filters = [];
    if (status) {
      filters.push(eq(smsConversations.status, status as any));
    }
    if (unreadOnly) {
      filters.push(sql`${smsConversations.unreadCount} > 0`);
    }
    if (search) {
      filters.push(
        or(
          like(smsConversations.phone, `%${search}%`),
          like(smsConversations.contactName, `%${search}%`)
        )
      );
    }

    // Get total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(smsConversations)
      .where(filters.length > 0 ? and(...filters) : undefined);

    // Get paginated conversations
    const conversations = await db
      .select()
      .from(smsConversations)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(smsConversations.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('[Admin SMS Conversations API] Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
