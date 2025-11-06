import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

interface SessionData {
  customerId?: number;
  availableCustomerIds?: number[];
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'customer_portal_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Get session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    // Check if user has an active session
    if (!session.customerId || !session.availableCustomerIds) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const targetCustomerId = parseInt(customerId);

    // Validate that user has access to this account
    if (!session.availableCustomerIds.includes(targetCustomerId)) {
      console.log(
        `[Portal] Account switch denied - Customer ${targetCustomerId} not in available accounts:`,
        session.availableCustomerIds
      );
      return NextResponse.json(
        { error: 'Access denied to this account' },
        { status: 403 }
      );
    }

    // Switch to the new account
    session.customerId = targetCustomerId;
    await session.save();

    console.log(`[Portal] Account switched to customer ${targetCustomerId}`);

    return NextResponse.json({
      success: true,
      customerId: targetCustomerId,
    });
  } catch (error: any) {
    console.error('[Portal] Switch account error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to switch account',
      },
      { status: 500 }
    );
  }
}
