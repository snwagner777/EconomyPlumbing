import { NextResponse } from 'next/server';
import { getPortalSession } from '@/server/lib/customer-portal/portal-session';
import { jobCompletions } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { db } = await import('@/server/db');
  try {
    const { customerId, availableCustomerIds } = await getPortalSession();

    // Fetch recent job completions for this customer (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentJobs = await db
      .select()
      .from(jobCompletions)
      .where(eq(jobCompletions.customerId, customerId))
      .orderBy(desc(jobCompletions.completionDate))
      .limit(10);

    // Filter to only show jobs from last 6 months
    const filteredJobs = recentJobs.filter(job => 
      new Date(job.completionDate) >= sixMonthsAgo
    );

    return NextResponse.json({ jobs: filteredJobs });
  } catch (error: any) {
    console.error('[Portal] Error fetching recent jobs:', error);
    
    // Handle session errors
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }
    
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Unauthorized - This account does not belong to you' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch recent jobs' },
      { status: 500 }
    );
  }
}
