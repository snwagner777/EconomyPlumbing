import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { jobCompletions } from '@/shared/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('customer_portal_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { customerId, availableCustomerIds } = session;

    if (!customerId) {
      return NextResponse.json({ error: 'No customer ID in session' }, { status: 400 });
    }

    // Verify this customer is in the authorized list
    if (!availableCustomerIds.includes(parseInt(customerId))) {
      return NextResponse.json({ error: 'Unauthorized customer access' }, { status: 403 });
    }

    // Fetch recent job completions for this customer (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentJobs = await db
      .select()
      .from(jobCompletions)
      .where(eq(jobCompletions.customerId, parseInt(customerId)))
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
