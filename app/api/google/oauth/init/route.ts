import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'src/lib/session';
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
    
    const auth = GoogleMyBusinessAuth.getInstance();
    const authUrl = auth.getAuthUrl();
    console.log('[GMB OAuth] Redirecting to:', authUrl);
    console.log('[GMB OAuth] Client ID:', process.env.GOOGLE_OAUTH_CLIENT_ID?.substring(0, 20) + '...');
    
    // Redirect user to Google OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to initialize OAuth: " + error.message },
      { status: 500 }
    );
  }
}
