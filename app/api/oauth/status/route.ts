import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'src/lib/session';
import { storage } from '@/server/storage';
import { GoogleMyBusinessAuth } from '@/server/lib/googleMyBusinessAuth';

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Require admin authentication
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json(
        { message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }
    
    const token = await storage.getGoogleOAuthToken('google_my_business');
    
    if (!token) {
      return NextResponse.json({ 
        isAuthenticated: false,
        hasAccountId: false,
        hasLocationId: false,
      });
    }
    
    // Check if token is expired and refresh if needed
    const now = new Date();
    const isExpired = new Date(token.expiryDate) <= now;
    
    if (isExpired && token.refreshToken) {
      try {
        console.log('[OAuth Status] Token expired, refreshing...');
        const auth = GoogleMyBusinessAuth.getInstance();
        const newTokens = await auth.refreshAccessToken(token.refreshToken);
        
        if (newTokens.access_token && newTokens.expiry_date) {
          await storage.updateGoogleOAuthToken(token.id, {
            accessToken: newTokens.access_token,
            expiryDate: new Date(newTokens.expiry_date),
          });
          
          console.log('[OAuth Status] Token refreshed successfully');
          return NextResponse.json({
            isAuthenticated: true,
            hasAccountId: !!token.accountId,
            hasLocationId: !!token.locationId,
            accountId: token.accountId || null,
            locationId: token.locationId || null,
          });
        }
      } catch (refreshError) {
        console.error('[OAuth Status] Token refresh failed:', refreshError);
        return NextResponse.json({
          isAuthenticated: false,
          hasAccountId: false,
          hasLocationId: false,
          error: 'Token refresh failed'
        });
      }
    }
    
    return NextResponse.json({
      isAuthenticated: !isExpired,
      hasAccountId: !!token.accountId,
      hasLocationId: !!token.locationId,
      accountId: token.accountId || null,
      locationId: token.locationId || null,
    });
  } catch (error: any) {
    console.error('[OAuth Status] Error:', error);
    return NextResponse.json(
      { message: "Error checking OAuth status" },
      { status: 500 }
    );
  }
}
