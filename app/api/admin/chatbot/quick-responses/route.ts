import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authMiddleware';
import { db } from '@/server/db';
import { chatbotQuickResponses } from '@shared/schema';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const responses = await db
      .select()
      .from(chatbotQuickResponses)
      .orderBy(chatbotQuickResponses.sortOrder);
    
    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching quick responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch quick responses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { label, message, category, sortOrder, icon } = await req.json();
    
    if (!label || !message) {
      return NextResponse.json(
        { error: "Label and message required" },
        { status: 400 }
      );
    }
    
    const [response] = await db
      .insert(chatbotQuickResponses)
      .values({ label, message, category, sortOrder: sortOrder || 0, icon })
      .returning();
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating quick response:", error);
    return NextResponse.json(
      { error: "Failed to create quick response" },
      { status: 500 }
    );
  }
}
