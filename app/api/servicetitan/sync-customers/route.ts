import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    console.log("[ServiceTitan Sync] Manual sync triggered by admin");

    const { syncServiceTitanCustomers } = await import("@/server/lib/serviceTitanSync");

    // Start sync in background to avoid timeout
    // Run sync asynchronously
    syncServiceTitanCustomers()
      .then(() => {
        console.log(`[ServiceTitan Sync] ✅ Manual sync completed`);
      })
      .catch(error => {
        console.error(`[ServiceTitan Sync] ❌ Manual sync failed:`, error);
      });

    return NextResponse.json({ 
      message: "Customer sync started. Check server logs for progress." 
    });
  } catch (error: any) {
    console.error("[ServiceTitan Sync] Error:", error);
    return NextResponse.json(
      { error: "Failed to start customer sync" },
      { status: 500 }
    );
  }
}
