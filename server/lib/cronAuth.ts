/**
 * Cron Authentication Middleware
 * 
 * Validates that cron requests are authorized using CRON_SECRET.
 * Prevents unauthorized execution of background worker endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';

export function validateCronAuth(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[Cron Auth] Missing or invalid Authorization header');
    return NextResponse.json(
      { error: 'Unauthorized - Missing Authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error('[Cron Auth] CRON_SECRET not configured in environment');
    return NextResponse.json(
      { error: 'Server misconfiguration - CRON_SECRET not set' },
      { status: 500 }
    );
  }

  if (token !== expectedSecret) {
    console.error('[Cron Auth] Invalid CRON_SECRET provided');
    return NextResponse.json(
      { error: 'Unauthorized - Invalid credentials' },
      { status: 401 }
    );
  }

  // Authentication successful
  return null;
}
