import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { jobCompletions } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

interface PortalSessionData {
  customerId?: string;
  availableCustomerIds?: number[];
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'customer_portal_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<PortalSessionData>(cookieStore, sessionOptions);

    const { customerId, availableCustomerIds } = session;

    if (!customerId) {
      return NextResponse.json({ error: 'Unauthorized - no session' }, { status: 401 });
    }

    // Verify this customer is in the authorized list
    if (!availableCustomerIds || !availableCustomerIds.includes(parseInt(customerId))) {
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
