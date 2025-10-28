/**
 * ServiceTitan OAuth - Initiate Authentication
 * 
 * Starts OAuth flow for customer portal login
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const hostname = req.headers.get('host') || '';
    
    // Generate state for CSRF protection
    const state = randomBytes(32).toString('hex');
    
    // Store state in session
    const session = await getSession();
    session.serviceTitanOAuthState = state;
    await session.save();

    // Build ServiceTitan OAuth URL
    const authUrl = new URL('https://auth.servicetitan.io/connect/authorize');
    authUrl.searchParams.set('client_id', process.env.SERVICETITAN_CLIENT_ID || '');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', `https://${hostname}/api/servicetitan/callback`);
    authUrl.searchParams.set('scope', 'openid profile email offline_access');
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('[ServiceTitan OAuth] Error:', error);
    return NextResponse.redirect('/customer-portal/login?error=auth_failed');
  }
}
