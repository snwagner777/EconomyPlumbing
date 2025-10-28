/**
 * Customer Portal API - Job History
 * 
 * Get customer's service history and completed jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/server/db';
import { jobCompletions } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.customerPortalAuth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;

    // Get job history
    const jobs = await db
      .select()
      .from(jobCompletions)
      .where(eq(jobCompletions.serviceTitanCustomerId, customerId))
      .orderBy(desc(jobCompletions.completedDate));

    return NextResponse.json({
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error('[Customer Portal Jobs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job history' },
      { status: 500 }
    );
  }
}
