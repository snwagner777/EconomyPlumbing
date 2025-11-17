import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { chatbotAnalytics, chatbotConversations } from '@shared/schema';
import { desc, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    // Get common questions
    const commonQuestions = await db
      .select()
      .from(chatbotAnalytics)
      .orderBy(desc(chatbotAnalytics.count))
      .limit(20);
    
    // Get conversation stats
    const [stats] = await db
      .select({
        total: sql`count(*)`,
        handoffs: sql`count(*) filter (where handoff_requested = true)`,
        avgRating: sql`avg(rating)`,
        withFeedback: sql`count(*) filter (where feedback_positive > 0 or feedback_negative > 0)`,
      })
      .from(chatbotConversations);
    
    // Get category breakdown
    const categories = await db
      .select({
        category: chatbotAnalytics.category,
        count: sql`sum(${chatbotAnalytics.count})`,
      })
      .from(chatbotAnalytics)
      .groupBy(chatbotAnalytics.category)
      .orderBy(desc(sql`sum(${chatbotAnalytics.count})`));
    
    return NextResponse.json({
      commonQuestions,
      stats,
      categories,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
