/**
 * Session Management for Next.js App Router
 * 
 * Replaces express-session with iron-session for Next.js compatibility
 * Preserves all existing OAuth functionality
 */

import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    claims?: any;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  };
  isAdmin?: boolean;
}

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required');
}

const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: 'plumbing_session',
  ttl: 7 * 24 * 60 * 60, // 1 week (in seconds)
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60, // 1 week (in seconds)
    path: '/',
  },
};

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session.user && !!session.user.expires_at && session.user.expires_at > Math.floor(Date.now() / 1000);
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return !!session.isAdmin && await isAuthenticated();
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session.user;
}

/**
 * Destroy session (logout)
 */
export async function destroySession() {
  const session = await getSession();
  session.destroy();
}
