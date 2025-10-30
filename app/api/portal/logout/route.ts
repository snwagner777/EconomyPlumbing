import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'src/lib/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    // Clear customer portal auth
    if (session.customerPortalAuth) {
      session.customerPortalAuth = undefined;
      await session.save();
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Portal] Logout error:", error);
    return NextResponse.json({ success: true }); // Return success anyway
  }
}
