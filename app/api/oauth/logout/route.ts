/**
 * OAuth Logout Route
 * 
 * Handles logout and redirects to Replit's end session URL
 */

import { NextRequest, NextResponse } from 'next/server';
import * as client from 'openid-client';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    // Get session and destroy it
    const session = await getSession();
    session.destroy();
    
    // Get OIDC configuration
    const config = await client.discovery(
      new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
      process.env.REPL_ID!
    );
    
    // Build end session URL
    const hostname = process.env.REPLIT_DEV_DOMAIN || req.headers.get('host') || '';
    const endSessionUrl = client.buildEndSessionUrl(config, {
      client_id: process.env.REPL_ID!,
      post_logout_redirect_uri: `https://${hostname}`,
    });
    
    console.log('[OAuth] Logout successful, redirecting to Replit end session');
    return NextResponse.redirect(endSessionUrl.href);
  } catch (error) {
    console.error('[OAuth] Error during logout:', error);
    // Even if there's an error, redirect to home
    return NextResponse.redirect(new URL('/', req.url));
  }
}
