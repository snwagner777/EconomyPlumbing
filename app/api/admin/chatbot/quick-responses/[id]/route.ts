import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { chatbotQuickResponses } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

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
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

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
