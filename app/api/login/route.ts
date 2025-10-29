/**
 * Replit OAuth Login - Redirect to Replit's auth page
 * This mimics the old Express route for compatibility
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // For now, redirect to the Next.js OAuth route
  // TODO: Replace with proper Replit Auth connector setup
  return NextResponse.redirect(new URL('/api/auth/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'));
}
