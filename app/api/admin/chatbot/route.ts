/**
 * Admin Chatbot Settings API
 * Manage chatbot quick responses and settings
 */

import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { chatbotQuickResponses } from '@shared/schema';
import { desc, eq } from 'drizzle-orm';

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'plumbing_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30,
  },
};

async function checkAdmin() {
  const cookieStore = await cookies();
  const session = await getIronSession(cookieStore, sessionOptions);
  return !!(session as any).isAdmin && !!(session as any).user?.claims?.email;
}

export async function GET() {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quickResponses = await db
      .select()
      .from(chatbotQuickResponses)
      .orderBy(chatbotQuickResponses.sortOrder);
    
    return NextResponse.json({ quickResponses });
  } catch (error: any) {
    console.error('[Admin Chatbot] Error fetching quick responses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const [quickResponse] = await db
      .insert(chatbotQuickResponses)
      .values(body)
      .returning();
    
    return NextResponse.json({ success: true, quickResponse });
  } catch (error: any) {
    console.error('[Admin Chatbot] Error creating quick response:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;
    
    const [quickResponse] = await db
      .update(chatbotQuickResponses)
      .set(updates)
      .where(eq(chatbotQuickResponses.id, id))
      .returning();

    return NextResponse.json({ success: true, quickResponse });
  } catch (error: any) {
    console.error('[Admin Chatbot] Error updating quick response:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }
    
    await db.delete(chatbotQuickResponses).where(eq(chatbotQuickResponses.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Chatbot] Error deleting quick response:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
