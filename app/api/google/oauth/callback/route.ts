import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'src/lib/session';
import { GoogleMyBusinessAuth } from '@/server/lib/googleMyBusinessAuth';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Require admin authentication for OAuth callback
    const session = await getSession();
    if (!session.user) {
      return new NextResponse('Unauthorized - Admin access required', { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    // Log what we received from Google
    console.log('[GMB OAuth] Callback received:', { code: !!code, error });
    
    // Check if Google returned an error
    if (error) {
      console.error('[GMB OAuth] Google returned error:', error);
      return new NextResponse(`Google OAuth error: ${error}`, { status: 400 });
    }
    
    if (!code) {
      console.error('[GMB OAuth] No authorization code received');
      return new NextResponse('Missing authorization code', { status: 400 });
    }

    const auth = GoogleMyBusinessAuth.getInstance();
    const tokens = await auth.getTokenFromCode(code);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      throw new Error('Invalid tokens received');
    }

    // Set credentials for API calls
    auth.setCredentials(tokens);

    // Auto-fetch account and location IDs from Google
    let accountId: string | null = null;
    let locationId: string | null = null;

    try {
      const client = auth.getClient();
      const accessTokenRaw = await client.getAccessToken();
      const token = typeof accessTokenRaw === 'string' ? accessTokenRaw : accessTokenRaw?.token;

      if (token) {
        // Fetch accounts
        const accountsResponse = await fetch('https://mybusiness.googleapis.com/v4/accounts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          const accounts = accountsData.accounts || [];
          
          if (accounts.length > 0) {
            // Extract account ID from name (format: accounts/{accountId})
            const accountMatch = accounts[0].name?.match(/accounts\/([^/]+)$/);
            accountId = accountMatch ? accountMatch[1] : null;

            if (accountId) {
              // Fetch locations for this account
              const locationsResponse = await fetch(
                `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations`,
                { headers: { 'Authorization': `Bearer ${token}` } }
              );

              if (locationsResponse.ok) {
                const locationsData = await locationsResponse.json();
                const locations = locationsData.locations || [];
                
                if (locations.length > 0) {
                  // Extract location ID from name (format: accounts/{accountId}/locations/{locationId})
                  const locationMatch = locations[0].name?.match(/locations\/([^/]+)$/);
                  locationId = locationMatch ? locationMatch[1] : null;
                  
                  console.log('[OAuth] Auto-fetched IDs:', { accountId, locationId });
                }
              }
            }
          }
        }
      }
    } catch (fetchError: any) {
      console.warn('[OAuth] Could not auto-fetch account/location IDs:', fetchError.message);
    }

    // Check if token already exists
    const existingToken = await storage.getGoogleOAuthToken('google_my_business');
    
    if (existingToken) {
      // Update existing token
      await storage.updateGoogleOAuthToken(existingToken.id, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: new Date(tokens.expiry_date),
        ...(accountId && { accountId }),
        ...(locationId && { locationId }),
      });
    } else {
      // Save new token with auto-fetched IDs
      await storage.saveGoogleOAuthToken({
        service: 'google_my_business',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: new Date(tokens.expiry_date),
        accountId,
        locationId,
      });
    }

    // Redirect to setup completion page
    return NextResponse.redirect(new URL('/admin/gmb-setup?success=true', req.url));
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return new NextResponse(`OAuth failed: ${error.message}`, { status: 500 });
  }
}
