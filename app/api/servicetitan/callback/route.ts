/**
 * ServiceTitan OAuth - Callback Handler
 * 
 * Handles OAuth callback and creates customer portal session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Verify state for CSRF protection
    const session = await getSession();
    if (!state || state !== session.serviceTitanOAuthState) {
      console.error('[ServiceTitan Callback] Invalid state');
      return NextResponse.redirect('/customer-portal/login?error=invalid_state');
    }

    if (!code) {
      console.error('[ServiceTitan Callback] No authorization code');
      return NextResponse.redirect('/customer-portal/login?error=no_code');
    }

    // Exchange code for tokens
    const hostname = req.headers.get('host') || '';
    const tokenResponse = await fetch('https://auth.servicetitan.io/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `https://${hostname}/api/servicetitan/callback`,
        client_id: process.env.SERVICETITAN_CLIENT_ID || '',
        client_secret: process.env.SERVICETITAN_CLIENT_SECRET || '',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('[ServiceTitan Callback] Token exchange failed');
      return NextResponse.redirect('/customer-portal/login?error=token_failed');
    }

    const tokens = await tokenResponse.json();
    
    // Get user info
    const userInfoResponse = await fetch('https://auth.servicetitan.io/connect/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('[ServiceTitan Callback] User info fetch failed');
      return NextResponse.redirect('/customer-portal/login?error=userinfo_failed');
    }

    const userInfo = await userInfoResponse.json();
    
    // Extract customer ID from claims
    const customerId = userInfo.sub || userInfo.customer_id;
    
    if (!customerId) {
      console.error('[ServiceTitan Callback] No customer ID in claims');
      return NextResponse.redirect('/customer-portal/login?error=no_customer_id');
    }

    // Verify customer exists in our database
    const customer = await storage.getCustomerByServiceTitanId(parseInt(customerId, 10));
    
    if (!customer) {
      console.error('[ServiceTitan Callback] Customer not found in database');
      return NextResponse.redirect('/customer-portal/login?error=customer_not_found');
    }

    // Create customer portal session
    session.customerPortalAuth = {
      customerId: parseInt(customerId, 10),
      customerName: customer.name,
      email: customer.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
    };

    // Clear OAuth state
    delete session.serviceTitanOAuthState;
    
    await session.save();

    console.log('[ServiceTitan Callback] Login successful for customer:', customerId);
    return NextResponse.redirect('/customer-portal/dashboard');
  } catch (error) {
    console.error('[ServiceTitan Callback] Error:', error);
    return NextResponse.redirect('/customer-portal/login?error=callback_failed');
  }
}
