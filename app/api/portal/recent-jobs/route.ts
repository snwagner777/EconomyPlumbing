import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/server/db';
import { jobCompletions } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json({ error: 'Unauthorized - no session' }, { status: 401 });
    }

    const customerId = session.customerPortalAuth.customerId;
    const availableCustomerIds = session.customerPortalAuth.availableCustomerIds || [customerId];

    // Verify this customer is in the authorized list
    if (!availableCustomerIds.includes(customerId)) {
      return NextResponse.json({ error: 'Unauthorized customer access' }, { status: 403 });
    }

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
  } catch (error) {
    console.error('[Portal] Error fetching recent jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent jobs' },
      { status: 500 }
    );
  }
}
