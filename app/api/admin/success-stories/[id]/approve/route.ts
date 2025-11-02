/**
 * Approve Success Story API
 * Generates collage and approves the story
 */

import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { customerSuccessStories } from '@shared/schema';
import { eq } from 'drizzle-orm';

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // For now, just approve without collage generation
    // TODO: Implement collage generation with object storage
    const [story] = await db
      .update(customerSuccessStories)
      .set({ 
        approved: true
      })
      .where(eq(customerSuccessStories.id, id))
      .returning();

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, story });
  } catch (error: any) {
    console.error('[Admin Success Stories] Error approving story:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
