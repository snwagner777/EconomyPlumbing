import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { syncServiceTitanCustomers, resetSyncLock } = await import('@/server/lib/serviceTitanSync');
    
    // Reset lock first (in case it's stuck)
    resetSyncLock();
    
    // Trigger sync in background
    syncServiceTitanCustomers().catch(error => {
      console.error("[Admin] Background sync error:", error);
    });
    
    return NextResponse.json({ success: true, message: "Sync started (lock reset)" });
  } catch (error: any) {
    console.error("[Admin] Trigger sync error:", error);
    return NextResponse.json(
      { error: "Failed to start sync" },
      { status: 500 }
    );
  }
}
