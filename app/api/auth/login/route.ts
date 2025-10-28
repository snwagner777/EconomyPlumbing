/**
 * OAuth Login Route
 * 
 * Initiates Replit OAuth flow for admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import * as client from 'openid-client';

export async function GET(req: NextRequest) {
  try {
    const hostname = req.headers.get('host') || '';
    
    // Get OIDC configuration
    const config = await client.discovery(
      new URL(process.env.ISSUER_URL ?? 'https://replit.com/oidc'),
      process.env.REPL_ID!
    );

    // Generate authorization URL
    const authUrl = client.buildAuthorizationUrl(config, {
      client_id: process.env.REPL_ID!,
      redirect_uri: `https://${hostname}/api/auth/callback`,
      scope: 'openid email profile offline_access',
      prompt: 'login consent',
    });

    // Redirect to Replit OAuth
    return NextResponse.redirect(authUrl.href);
  } catch (error) {
    console.error('[OAuth] Error initiating login:', error);
    return NextResponse.redirect('/admin/oauth-login?error=failed');
  }
}
