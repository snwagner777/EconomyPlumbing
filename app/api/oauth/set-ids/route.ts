import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function POST(req: NextRequest) {
  try {
    const { accountId, locationId } = await req.json();
    
    if (!accountId || !locationId) {
      return NextResponse.json(
        { message: 'Missing account ID or location ID' },
        { status: 400 }
      );
    }

    const token = await storage.getGoogleOAuthToken('google_my_business');
    
    if (!token) {
      return NextResponse.json(
        { message: 'No OAuth token found. Please authenticate first.' },
        { status: 404 }
      );
    }

    await storage.updateGoogleOAuthToken(token.id, {
      accountId,
      locationId,
    });

    return NextResponse.json({ message: 'Account and location IDs updated successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to update IDs: " + error.message },
      { status: 500 }
    );
  }
}
