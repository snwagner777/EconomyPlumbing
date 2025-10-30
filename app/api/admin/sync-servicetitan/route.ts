import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { syncServiceTitanCustomers } from '@/server/lib/serviceTitanSync';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    console.log("[Admin] Manual ServiceTitan sync triggered");
    
    // Trigger sync in background (don't wait)
    syncServiceTitanCustomers().catch(error => {
      console.error("[Admin] Background sync failed:", error);
    });
    
    return NextResponse.json({
      success: true,
      message: "ServiceTitan customer sync started in background. Check logs for progress."
    });
  } catch (error: any) {
    console.error("[Admin] Error triggering sync:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
