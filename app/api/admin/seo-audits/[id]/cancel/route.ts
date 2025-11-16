import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { seoAuditJobs } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [job] = await db
      .select()
      .from(seoAuditJobs)
      .where(eq(seoAuditJobs.id, params.id))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'Audit job not found' },
        { status: 404 }
      );
    }

    if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed job' },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(seoAuditJobs)
      .set({
        status: 'cancelled',
        finishedAt: new Date(),
      })
      .where(eq(seoAuditJobs.id, params.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[SEO Audits API] Error cancelling job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel audit job' },
      { status: 500 }
    );
  }
}
