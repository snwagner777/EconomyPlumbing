import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customersXlsx } from '@shared/schema';
import { gt, count } from 'drizzle-orm';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'portal_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Check session authentication
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (!session.portalCustomerId || !session.portalAvailableCustomerIds) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user has access to this customer ID
    const requestedCustomerId = parseInt(customerId);
    if (!session.portalAvailableCustomerIds.includes(requestedCustomerId)) {
      console.log(
        `[Portal] Customer stats denied - Customer ${requestedCustomerId} not in available accounts:`,
        session.portalAvailableCustomerIds
      );
      return NextResponse.json(
        { error: 'Access denied to this customer account' },
        { status: 403 }
      );
    }

    console.log('[Portal] Fetching customer stats for:', customerId);

    // Get LIVE job count from ServiceTitan API
    const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
    const serviceTitan = getServiceTitanAPI();

    // Fetch all jobs for this customer from API
    const jobs = await serviceTitan.getCustomerJobs(parseInt(customerId));

    // Count only COMPLETED jobs to match what the sync does
    const completedJobs = jobs.filter(
      (job: any) => job.status === 'Completed' && job.completedOn !== null
    );
    const serviceCount = completedJobs.length;

    console.log(
      `[Portal] Customer ${customerId}: Found ${jobs.length} total jobs, ${serviceCount} completed`
    );

    // Don't show stats if customer has 0 completed services
    if (serviceCount === 0) {
      console.log(`[Portal] Customer ${customerId} has 0 completed services`);
      return NextResponse.json({ serviceCount: 0, topPercentile: null });
    }

    // Calculate percentile ranking using database for performance
    // (Can't make 11,000+ API calls for comparison)

    // Get total number of customers with at least 1 service in the database
    const [totalResult] = await db
      .select({
        total: count(),
      })
      .from(customersXlsx)
      .where(gt(customersXlsx.jobCount, 0));

    const totalCustomersWithService = totalResult.total || 0;

    // If the database hasn't been populated with job data yet, don't show misleading percentiles
    if (totalCustomersWithService === 0) {
      console.log(
        `[Portal] Customer ${customerId}: Job sync hasn't run yet, skipping percentile calculation`
      );
      return NextResponse.json({
        serviceCount,
        topPercentile: null, // Don't show percentile if database is empty
      });
    }

    // Count how many customers have MORE services than this customer
    const [result] = await db
      .select({
        total: count(),
      })
      .from(customersXlsx)
      .where(gt(customersXlsx.jobCount, serviceCount));

    const customersWithMore = result.total || 0;

    // Calculate percentile (inverted - lower number = better rank)
    // If 4 out of 100 customers have more services, you're in the top 4%
    const topPercentile = Math.min(
      99,
      Math.round((customersWithMore / totalCustomersWithService) * 100)
    ); // Cap at 99% to prevent "Better than 100%"

    console.log(
      `[Portal] Customer ${customerId}: ${serviceCount} completed services, ${customersWithMore}/${totalCustomersWithService} customers have more → Top ${topPercentile}%`
    );

    return NextResponse.json({
      serviceCount,
      topPercentile, // e.g., "top 4%" means only 4% of customers have more services
    });
  } catch (error: any) {
    console.error('[Portal] Customer stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer stats' },
      { status: 500 }
    );
  }
}
