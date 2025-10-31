import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

export interface SessionData {
  isAuthenticated: boolean;
  username?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_production',
  cookieName: 'admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function isAuthenticated() {
  const session = await getSession();
  return session.isAuthenticated === true;
}

export async function login(username: string, password: string): Promise<boolean> {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

  if (username === adminUsername && password === adminPassword) {
    const session = await getSession();
    session.isAuthenticated = true;
    session.username = username;
    await session.save();
    return true;
  }
  
  return false;
}

export async function logout() {
  const session = await getSession();
  session.destroy();
}
