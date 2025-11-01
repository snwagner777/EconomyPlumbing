/**
 * Admin Auth Check API
 * Returns whether the current user is authenticated as admin
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    const isAdmin = session?.isAuthenticated || false;
    
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('[Admin Check] Error:', error);
    return NextResponse.json({ isAdmin: false });
  }
}
