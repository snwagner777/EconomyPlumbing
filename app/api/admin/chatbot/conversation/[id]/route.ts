import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authMiddleware';
import { db } from '@/server/db';
import { chatbotConversations, chatbotMessages } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    
    const [conversation] = await db
      .select()
      .from(chatbotConversations)
      .where(eq(chatbotConversations.id, id));
      
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    
    const messages = await db
      .select()
      .from(chatbotMessages)
      .where(eq(chatbotMessages.conversationId, id))
      .orderBy(chatbotMessages.createdAt);
    
    return NextResponse.json({
      conversation,
      messages,
    });
  } catch (error) {
    console.error("Error fetching conversation details:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const { archived, notes } = await req.json();
    
    const updates: any = {};
    if (archived !== undefined) updates.archived = archived;
    if (notes !== undefined) updates.notes = notes;
    
    await db
      .update(chatbotConversations)
      .set(updates)
      .where(eq(chatbotConversations.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}
