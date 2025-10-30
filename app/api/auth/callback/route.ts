/**
 * OAuth Callback Route
 * 
 * Handles OAuth callback from Replit
 * Verifies user email is whitelisted and creates session
 */

import { NextRequest, NextResponse } from 'next/server';
import * as client from 'openid-client';
import { getSession } from '@/lib/session';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hostname = req.headers.get('host') || '';
    const returnedState = searchParams.get('state');

    console.log('[OAuth] Callback received');
    console.log('[OAuth] Returned state:', returnedState?.substring(0, 10) + '...');

    // Get session to verify OAuth state and code verifier
    const session = await getSession();
    
    console.log('[OAuth] Session state:', session.oauthState?.substring(0, 10) + '...');
    console.log('[OAuth] Has code verifier:', !!session.oauthCodeVerifier);
    
    // Verify CSRF state token
    if (!session.oauthState || !returnedState || session.oauthState !== returnedState) {
      console.error('[OAuth] State mismatch or missing - possible CSRF attack');
      console.error('[OAuth] Session state:', session.oauthState);
      console.error('[OAuth] Returned state:', returnedState);
      return NextResponse.redirect(new URL('/admin-login?error=csrf_failed', req.url));
    }

    // Verify code verifier exists in session
    if (!session.oauthCodeVerifier) {
      console.error('[OAuth] Code verifier missing from session');
      return NextResponse.redirect(new URL('/admin-login?error=verifier_missing', req.url));
    }

    // Use actual request host for OAuth redirect (REPLIT_DEV_DOMAIN only for local dev)
    const callbackHostname = (process.env.NODE_ENV === 'development' ? process.env.REPLIT_DEV_DOMAIN : null) || req.headers.get('host') || '';
    const redirectUri = `https://${callbackHostname}/api/auth/callback`;
    
    console.log('[OAuth] Using redirect_uri for token exchange:', redirectUri);

    // Get OIDC configuration
    const config = await client.discovery(
      new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
      process.env.REPL_ID!
    );

    // Exchange authorization code for tokens with session-stored verifiers
    const tokens = await client.authorizationCodeGrant(
      config,
      new URL(req.url),
      {
        pkceCodeVerifier: session.oauthCodeVerifier,
        expectedState: session.oauthState,
      }
    );

    // Clear OAuth state from session after successful exchange
    delete session.oauthState;
    delete session.oauthCodeVerifier;

    // Get user claims
    const claims = tokens.claims();
    
    console.log('[OAuth] Callback for email:', claims?.email);

    // Verify email is whitelisted
    if (!claims || !claims.email || typeof claims.email !== 'string') {
      console.error('[OAuth] No email in claims');
      return NextResponse.redirect(new URL('/admin-login?error=no_email', req.url));
    }

    if (!claims.sub || typeof claims.sub !== 'string') {
      console.error('[OAuth] Invalid subject in claims');
      return NextResponse.redirect(new URL('/admin-login?error=invalid_claims', req.url));
    }

    const isWhitelisted = await storage.isEmailWhitelisted(claims.email);
    
    if (!isWhitelisted) {
      console.error('[OAuth] Email not whitelisted:', claims.email);
      return NextResponse.redirect(new URL('/admin-login?error=unauthorized', req.url));
    }

    // Upsert OAuth user in database
    await storage.upsertOAuthUser({
      id: claims.sub,
      email: claims.email,
      firstName: typeof claims.first_name === 'string' ? claims.first_name : undefined,
      lastName: typeof claims.last_name === 'string' ? claims.last_name : undefined,
      profileImageUrl: typeof claims.profile_image_url === 'string' ? claims.profile_image_url : undefined,
    });

    // Update session with user data
    session.user = {
      id: claims.sub,
      email: claims.email,
      firstName: typeof claims.first_name === 'string' ? claims.first_name : undefined,
      lastName: typeof claims.last_name === 'string' ? claims.last_name : undefined,
      profileImageUrl: typeof claims.profile_image_url === 'string' ? claims.profile_image_url : undefined,
      claims,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: typeof claims.exp === 'number' ? claims.exp : undefined,
    };
    session.isAdmin = true;

    await session.save();

    console.log('[OAuth] Login successful, redirecting to /admin');
    // Use the actual request hostname (not localhost)
    const adminUrl = new URL('/admin', req.url);
    console.log('[OAuth] Redirect URL:', adminUrl.href);
    return NextResponse.redirect(adminUrl);
  } catch (error) {
    console.error('[OAuth] Error processing callback:', error);
    return NextResponse.redirect(new URL('/admin-login?error=callback_failed', req.url));
  }
}
