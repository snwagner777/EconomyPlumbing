import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { customersXlsx, contactsXlsx, serviceTitanJobs } from '@shared/schema';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { isSyncRunning } = await import('@/server/lib/serviceTitanSync');

    // Get customer, contact, and job counts
    const [customerCount, contactCount, jobCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(customersXlsx),
      db.select({ count: sql<number>`count(*)` }).from(contactsXlsx),
      db.select({ count: sql<number>`count(*)` }).from(serviceTitanJobs)
    ]);

    // Get most recent sync timestamps
    const [recentCustomer, recentJob] = await Promise.all([
      db.select({ lastSynced: customersXlsx.lastSyncedAt })
        .from(customersXlsx)
        .orderBy(sql`${customersXlsx.lastSyncedAt} DESC`)
        .limit(1),
      db.select({ lastSynced: serviceTitanJobs.lastSyncedAt })
        .from(serviceTitanJobs)
        .orderBy(sql`${serviceTitanJobs.lastSyncedAt} DESC`)
        .limit(1)
    ]);

    // Check OAuth connection (all required env vars present)
    const hasClientId = !!process.env.SERVICETITAN_CLIENT_ID;
    const hasClientSecret = !!process.env.SERVICETITAN_CLIENT_SECRET;
    const hasTenantId = !!process.env.SERVICETITAN_TENANT_ID;
    const hasAppKey = !!process.env.SERVICETITAN_APP_KEY;
    
    console.log('[Sync Status] ServiceTitan OAuth check:', {
      hasClientId,
      hasClientSecret,
      hasTenantId,
      hasAppKey,
      clientIdLength: process.env.SERVICETITAN_CLIENT_ID?.length || 0,
      tenantIdLength: process.env.SERVICETITAN_TENANT_ID?.length || 0
    });
    
    const oauthConnected = hasClientId && hasClientSecret && hasTenantId && hasAppKey;

    return NextResponse.json({
      totalCustomers: Number(customerCount[0]?.count || 0),
      totalContacts: Number(contactCount[0]?.count || 0),
      totalJobs: Number(jobCount[0]?.count || 0),
      lastSyncTime: recentCustomer[0]?.lastSynced || null,
      lastJobSync: recentJob[0]?.lastSynced || null,
      isRunning: isSyncRunning(),
      oauthConnected,
    });
  } catch (error: any) {
    console.error("[Admin] Sync status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync status" },
      { status: 500 }
    );
  }
}
