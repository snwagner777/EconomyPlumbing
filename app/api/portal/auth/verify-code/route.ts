import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactValue, code, token, lookupType } = body;
    
    if (!contactValue || !code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // TODO: Implement actual OTP verification using token and lookupType
    // - Verify the token matches the lookup session
    // - Verify the code against stored OTP
    // - Return actual customer data from ServiceTitan
    
    // For now, return placeholder customer
    const mockCustomer = {
      id: 12345,
      name: 'John Doe',
      email: contactValue.includes('@') ? contactValue : 'customer@example.com',
      phone: contactValue.includes('@') ? '(512) 555-0123' : contactValue,
    };
    
    return NextResponse.json({
      success: true,
      customers: [mockCustomer],
    });
  } catch (error: any) {
    console.error('[Portal Verify] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
