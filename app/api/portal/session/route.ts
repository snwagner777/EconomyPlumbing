import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Implement session checking with Next.js session management
  // For now, return no session
  return NextResponse.json({ customerId: null }, { status: 200 });
}
