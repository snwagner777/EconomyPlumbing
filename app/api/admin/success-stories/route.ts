/**
 * Admin Success Stories API
 * CRUD operations for success stories
 */

import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { customerSuccessStories } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
};

async function checkAdmin() {
  const cookieStore = await cookies();
  const session = await getIronSession(cookieStore, sessionOptions);
  return !!(session as any).isAuthenticated;
}

export async function GET() {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stories = await db.select().from(customerSuccessStories).orderBy(desc(customerSuccessStories.submittedAt));
    return NextResponse.json({ stories });
  } catch (error: any) {
    console.error('[Admin Success Stories] Error fetching stories:', error);
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
    const [story] = await db.insert(customerSuccessStories).values(body).returning();
    
    return NextResponse.json({ success: true, story });
  } catch (error: any) {
    console.error('[Admin Success Stories] Error creating story:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
