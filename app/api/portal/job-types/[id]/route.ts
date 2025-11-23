import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanSettings } from '@/server/lib/servicetitan/settings';
import { getPortalSession } from '@/server/lib/customer-portal/portal-session';

/**
 * GET /api/portal/job-types/[id]
 * Get friendly name for a job type ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Validate session
    await getPortalSession();

    const { id } = await params;
    const jobTypeId = parseInt(id, 10);
    if (isNaN(jobTypeId)) {
      return NextResponse.json({ error: 'Invalid job type ID' }, { status: 400 });
    }

    const jobTypes = await serviceTitanSettings.getJobTypes();
    const jobType = jobTypes.find((jt) => jt.id === jobTypeId);

    if (!jobType) {
      return NextResponse.json(
        { error: 'Job type not found', id: jobTypeId },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: jobType.id,
      name: jobType.name,
      code: jobType.code,
    });
  } catch (error: any) {
    console.error('[Job Types API] Error:', error);

    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to get job type' },
      { status: 500 }
    );
  }
}
