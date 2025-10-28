/**
 * OAuth Logout Route
 * 
 * Destroys session and redirects to Replit logout
 */

import { NextRequest, NextResponse } from 'next/server';
import * as client from 'openid-client';
import { destroySession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const hostname = req.headers.get('host') || '';

    // Destroy local session
    await destroySession();

    // Get OIDC configuration for end session URL
    const config = await client.discovery(
      new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
      process.env.REPL_ID!
    );

    // Build end session URL
    const endSessionUrl = client.buildEndSessionUrl(config, {
      client_id: process.env.REPL_ID!,
      post_logout_redirect_uri: `https://${hostname}`,
    });

    // Redirect to Replit logout
    return NextResponse.redirect(endSessionUrl.href);
  } catch (error) {
    console.error('[OAuth] Error during logout:', error);
    return NextResponse.redirect('/');
  }
}
