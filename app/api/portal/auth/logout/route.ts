import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    await session.destroy();
    console.log('[Portal Auth] Session destroyed successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Portal Auth] Logout error:", error);
    return NextResponse.json({ success: true }); // Return success anyway to prevent UI errors
  }
}
