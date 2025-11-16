import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Get unified session
    const session = await getSession();

    // Check if user has an active session
    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const targetCustomerId = parseInt(customerId);
    const availableCustomerIds = session.customerPortalAuth.availableCustomerIds || [session.customerPortalAuth.customerId];

    // Validate that user has access to this account
    if (!availableCustomerIds.includes(targetCustomerId)) {
      console.log(
        `[Portal] Account switch denied - Customer ${targetCustomerId} not in available accounts:`,
        availableCustomerIds
      );
      return NextResponse.json(
        { error: 'Access denied to this account' },
        { status: 403 }
      );
    }

    // Update unified session
    session.customerPortalAuth.customerId = targetCustomerId;
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
