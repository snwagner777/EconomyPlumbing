import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { serviceTitanEstimates } from '@/server/lib/servicetitan/estimates';

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'customer_portal_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

interface SessionData {
  customerId?: number;
  availableCustomerIds?: number[];
}

/**
 * GET /api/portal/estimates
 * Fetch estimates for authenticated customer with optional filtering
 * Query params:
 *   - status: Filter by status (Open, Sold, Dismissed)
 *   - includeInactive: Include dismissed estimates (default: false)
 *   - page: Page number (default: 1)
 *   - pageSize: Items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Validate session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    console.log(`[Portal Estimates] Fetching estimates for customer ${session.customerId}`);

    // Fetch estimates from ServiceTitan
    const rawEstimates = await serviceTitanEstimates.getEstimates(session.customerId, includeInactive);

    // Normalize estimates to consistent format for frontend
    const estimates = rawEstimates.map(est => ({
      id: est.id,
      jobId: est.jobId,
      projectId: est.projectId,
      name: est.name || est.summary || `Estimate #${est.id}`,
      estimateNumber: est.estimateNumber || `EST-${est.id}`,
      summary: est.summary || est.name || '',
      jobNumber: est.jobNumber || '',
      expiresOn: est.expiresOn || '',
      status: est.status || 'Open',
      soldBy: est.soldBy || '',
      soldOn: est.soldOn || '',
      items: est.items || [],
      subtotal: est.subtotal || 0,
      total: est.total || 0,
      active: est.active ?? true,
      createdOn: est.createdOn,
      modifiedOn: est.modifiedOn,
      customerId: est.customerId,
    }));

    // CRITICAL: Filter out sold estimates - only show Open and Dismissed
    let filteredEstimates = estimates.filter(est => est.status !== 'Sold');
    
    // Apply additional status filter if provided
    if (status) {
      filteredEstimates = filteredEstimates.filter(est => est.status === status);
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEstimates = filteredEstimates.slice(startIndex, endIndex);

    console.log(`[Portal Estimates] Found ${filteredEstimates.length} estimates for customer ${session.customerId}`);

    return NextResponse.json({
      data: paginatedEstimates,
      total: filteredEstimates.length,
      page,
      pageSize,
    });
  } catch (error: any) {
    console.error('[Portal Estimates] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load estimates' },
      { status: 500 }
    );
  }
}
