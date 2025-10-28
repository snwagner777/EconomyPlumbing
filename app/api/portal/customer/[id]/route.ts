import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      );
    }
    
    // TODO: Fetch actual customer data from ServiceTitan
    // For now, return mock data
    const mockData = {
      id: parseInt(id),
      name: 'John Doe',
      email: 'customer@example.com',
      phone: '(512) 555-0123',
      address: '123 Main St, Austin, TX 78701',
      appointments: [],
      invoices: [],
      memberships: [],
      referrals: [],
      credits: 0,
    };
    
    return NextResponse.json(mockData);
  } catch (error: any) {
    console.error('[Portal Customer Data] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load customer data' },
      { status: 500 }
    );
  }
}
