/**
 * Admin Page Metadata API
 * Manage SEO metadata for pages
 */

import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { pageMetadata } from '@shared/schema';
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

export async function GET(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (path) {
      // Get specific page metadata
      const [metadata] = await db
        .select()
        .from(pageMetadata)
        .where(eq(pageMetadata.path, path));
      
      return NextResponse.json({ metadata: metadata || null });
    }

    // Get all page metadata
    const allMetadata = await db.select().from(pageMetadata);
    return NextResponse.json({ metadata: allMetadata });
  } catch (error: any) {
    console.error('[Admin Page Metadata] Error fetching metadata:', error);
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
    const [metadata] = await db
      .insert(pageMetadata)
      .values(body)
      .returning();
    
    return NextResponse.json({ success: true, metadata });
  } catch (error: any) {
    console.error('[Admin Page Metadata] Error creating metadata:', error);
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
    const { path, ...updates } = body;
    
    const [metadata] = await db
      .update(pageMetadata)
      .set(updates)
      .where(eq(pageMetadata.path, path))
      .returning();

    return NextResponse.json({ success: true, metadata });
  } catch (error: any) {
    console.error('[Admin Page Metadata] Error updating metadata:', error);
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
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }
    
    await db.delete(pageMetadata).where(eq(pageMetadata.path, path));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Admin Page Metadata] Error deleting metadata:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
