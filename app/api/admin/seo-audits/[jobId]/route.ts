import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { db } from '@/server/db';
import { seoAuditJobs, seoAuditResults } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [job] = await db
      .select()
      .from(seoAuditJobs)
      .where(eq(seoAuditJobs.id, params.jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Audit job not found' },
        { status: 404 }
      );
    }

    const [result] = await db
      .select()
      .from(seoAuditResults)
      .where(eq(seoAuditResults.jobId, params.jobId))
      .limit(1);

    return NextResponse.json({
      ...job,
      result: result || null,
    });
  } catch (error) {
    console.error('[SEO Audits API] Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit job' },
      { status: 500 }
    );
  }
}
