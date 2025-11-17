import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanPhotoJobs } from '../../../../../shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Update job status to queued for retry
    const updated = await db
      .update(serviceTitanPhotoJobs)
      .set({
        status: 'queued',
        errorMessage: null,
        retryCount: 0,
      })
      .where(eq(serviceTitanPhotoJobs.id, jobId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      job: updated[0]
    });
  } catch (error) {
    console.error('[Photo Fetch Jobs Retry API] Error retrying job:', error);
    return NextResponse.json(
      { error: 'Failed to retry job' },
      { status: 500 }
    );
  }
}
