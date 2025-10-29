/**
 * Replit OAuth Login - Redirect to Replit's auth page
 * This mimics the old Express route for compatibility
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Use the current request URL to construct the redirect
  // This ensures we use the correct domain (not localhost)
  const url = new URL('/api/auth/login', req.url);
  return NextResponse.redirect(url);
}
