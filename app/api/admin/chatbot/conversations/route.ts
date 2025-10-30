import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authMiddleware';
import { db } from '@/server/db';
import { chatbotConversations } from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '1');
    const archived = searchParams.get('archived') || 'false';
    const handoff = searchParams.get('handoff') || 'all';
    
    const limit = 20;
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const whereConditions = [];
    
    // Filter by archived status
    if (archived === 'true') {
      whereConditions.push(eq(chatbotConversations.archived, true));
    } else if (archived === 'false') {
      whereConditions.push(eq(chatbotConversations.archived, false));
    }
    
    // Filter by handoff status
    if (handoff === 'true') {
      whereConditions.push(eq(chatbotConversations.handoffRequested, true));
    } else if (handoff === 'false') {
      whereConditions.push(eq(chatbotConversations.handoffRequested, false));
    }
    
    // Execute query with conditions
    const conversations = whereConditions.length > 0
      ? await db
          .select()
          .from(chatbotConversations)
          .where(sql`${whereConditions.map(c => sql`${c}`).reduce((a, b) => sql`${a} AND ${b}`)}`)
          .orderBy(desc(chatbotConversations.startedAt))
          .limit(limit)
          .offset(offset)
      : await db
          .select()
          .from(chatbotConversations)
          .orderBy(desc(chatbotConversations.startedAt))
          .limit(limit)
          .offset(offset);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(chatbotConversations)
      .where(archived === 'true' 
        ? eq(chatbotConversations.archived, true)
        : archived === 'false'
        ? eq(chatbotConversations.archived, false)
        : sql`true`);
    
    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
