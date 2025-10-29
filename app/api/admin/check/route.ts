/**
 * Admin Auth Check API
 * Returns whether the current user is authenticated as admin
 */

import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'plumbing_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
    
    const isAdmin = !!(session as any).isAdmin && !!(session as any).user?.claims?.email;
    
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('[Admin Check] Error:', error);
    return NextResponse.json({ isAdmin: false });
  }
}
