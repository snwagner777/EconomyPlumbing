import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { seoAuditJobs } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { db } = await import('@/server/db');
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { jobId } = params;

    const [job] = await db
      .update(seoAuditJobs)
      .set({ 
        status: 'cancelled',
        finishedAt: new Date().toISOString(),
      })
      .where(eq(seoAuditJobs.id, jobId))
      .returning();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Error cancelling SEO audit job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}
