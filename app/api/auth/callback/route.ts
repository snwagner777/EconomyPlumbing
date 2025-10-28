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

    // Get OIDC configuration
    const config = await client.discovery(
      new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
      process.env.REPL_ID!
    );

    // Exchange authorization code for tokens
    const tokens = await client.authorizationCodeGrant(
      config,
      new URL(req.url),
      {
        pkceCodeVerifier: searchParams.get('code_verifier') || undefined,
        expectedState: searchParams.get('state') || undefined,
      }
    );

    // Get user claims
    const claims = tokens.claims();
    
    console.log('[OAuth] Callback for email:', claims.email);

    // Verify email is whitelisted
    if (!claims.email) {
      console.error('[OAuth] No email in claims');
      return NextResponse.redirect('/admin/oauth-login?error=no_email');
    }

    const isWhitelisted = await storage.isEmailWhitelisted(claims.email);
    
    if (!isWhitelisted) {
      console.error('[OAuth] Email not whitelisted:', claims.email);
      return NextResponse.redirect('/admin/oauth-login?error=unauthorized');
    }

    // Upsert OAuth user in database
    await storage.upsertOAuthUser({
      id: claims.sub!,
      email: claims.email,
      firstName: claims.first_name,
      lastName: claims.last_name,
      profileImageUrl: claims.profile_image_url,
    });

    // Create session
    const session = await getSession();
    session.user = {
      id: claims.sub!,
      email: claims.email,
      firstName: claims.first_name,
      lastName: claims.last_name,
      profileImageUrl: claims.profile_image_url,
      claims,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: claims.exp,
    };
    session.isAdmin = true;

    await session.save();

    console.log('[OAuth] Login successful, redirecting to /admin');
    return NextResponse.redirect('/admin');
  } catch (error) {
    console.error('[OAuth] Error processing callback:', error);
    return NextResponse.redirect('/admin/oauth-login?error=callback_failed');
  }
}
