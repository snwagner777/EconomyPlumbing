import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Portal] Fetching arrival windows from ServiceTitan');

    // Get ServiceTitan API
    const { ServiceTitanAPI } = await import('@/server/lib/serviceTitan');
    const serviceTitan = new ServiceTitanAPI({
      tenantId: process.env.SERVICETITAN_TENANT_ID!,
      clientId: process.env.SERVICETITAN_CLIENT_ID!,
      clientSecret: process.env.SERVICETITAN_CLIENT_SECRET!,
      appKey: process.env.SERVICETITAN_APP_KEY!,
    });

    const windows = await serviceTitan.getArrivalWindows();

    console.log(`[Portal] Found ${windows.length} arrival windows`);

    return NextResponse.json({ windows });
  } catch (error: any) {
    console.error('[Portal] Get arrival windows error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arrival windows' },
      { status: 500 }
    );
  }
}
