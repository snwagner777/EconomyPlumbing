/**
 * OAuth Login Route
 * 
 * Initiates Replit OAuth flow for admin authentication
 * with CSRF protection via session-stored state and PKCE
 */

import { NextRequest, NextResponse } from 'next/server';
import * as client from 'openid-client';
import { getSession } from '@/lib/session';
import { randomBytes } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const hostname = req.headers.get('host') || '';
    
    // Get OIDC configuration
    const config = await client.discovery(
      new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
      process.env.REPL_ID!
    );

    // Generate CSRF state and PKCE code verifier
    const state = randomBytes(32).toString('hex');
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

    // Store state and code verifier in session for callback verification
    const session = await getSession();
    session.oauthState = state;
    session.oauthCodeVerifier = codeVerifier;
    await session.save();

    // Generate authorization URL with PKCE
    const authUrl = client.buildAuthorizationUrl(config, {
      client_id: process.env.REPL_ID!,
      redirect_uri: `https://${hostname}/api/auth/callback`,
      scope: 'openid email profile offline_access',
      prompt: 'login consent',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    // Redirect to Replit OAuth
    return NextResponse.redirect(authUrl.href);
  } catch (error) {
    console.error('[OAuth] Error initiating login:', error);
    return NextResponse.redirect('/admin/oauth-login?error=failed');
  }
}
