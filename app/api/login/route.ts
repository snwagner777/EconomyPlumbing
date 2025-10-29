/**
 * Replit OAuth Login - Redirect to OAuth route
 * This mimics the old Express route for compatibility
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Redirect to the actual OAuth login route
  const url = new URL('/api/oauth/login', req.url);
  return NextResponse.redirect(url);
}
