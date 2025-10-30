import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'src/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    // Destroy session
    session.destroy();
    
    return NextResponse.json({ 
      success: true, 
      message: "Session cleared successfully. Please close this tab and try logging in again." 
    });
  } catch (error: any) {
    console.error("[Admin] Session clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear session" },
      { status: 500 }
    );
  }
}
