import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authMiddleware';
import { db } from '@/server/db';
import { chatbotQuickResponses } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const updates = await req.json();
    
    await db
      .update(chatbotQuickResponses)
      .set(updates)
      .where(eq(chatbotQuickResponses.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating quick response:", error);
    return NextResponse.json(
      { error: "Failed to update quick response" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    
    await db
      .delete(chatbotQuickResponses)
      .where(eq(chatbotQuickResponses.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quick response:", error);
    return NextResponse.json(
      { error: "Failed to delete quick response" },
      { status: 500 }
    );
  }
}
