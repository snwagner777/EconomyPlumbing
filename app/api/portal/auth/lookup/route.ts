import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lookupType, lookupValue } = body;
    
    if (!lookupType || !lookupValue) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // TODO: Implement actual customer lookup via ServiceTitan
    // For now, return placeholder success
    const token = Math.random().toString(36).substring(7);
    
    return NextResponse.json({
      success: true,
      token,
      message: `Verification code sent to ${lookupValue}`,
    });
  } catch (error: any) {
    console.error('[Portal Lookup] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Lookup failed' },
      { status: 500 }
    );
  }
}
