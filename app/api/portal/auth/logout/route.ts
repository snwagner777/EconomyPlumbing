import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: Clear session cookie
  return NextResponse.json({ success: true });
}
