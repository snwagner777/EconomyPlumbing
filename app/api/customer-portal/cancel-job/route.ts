/**
 * Customer Portal API - Cancel Job
 * 
 * Allows customers to cancel their upcoming appointments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';
import { schedulerRequests } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const cancelSchema = z.object({
  jobId: z.number(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const session = await getSession();
    
    if (!session.customerPortalAuth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { jobId, reason } = cancelSchema.parse(body);

    const authenticatedCustomerId = session.customerPortalAuth.customerId;

    // CRITICAL: Verify job belongs to authenticated customer before canceling
    const job = await serviceTitanJobs.getJob(jobId);
    
    if (job.customerId !== authenticatedCustomerId) {
      console.warn(`[Customer Portal] Authorization failure: Customer ${authenticatedCustomerId} attempted to cancel job ${jobId} belonging to customer ${job.customerId}`);
      return NextResponse.json(
        { error: 'Appointment not found' }, // Don't reveal whether job exists
        { status: 404 }
      );
    }

    // Cancel job in ServiceTitan
    // Using reasonId = 0 (default) and customer-provided memo
    await serviceTitanJobs.cancelJob(jobId, {
      reasonId: 0,
      memo: reason || 'Canceled by customer via portal',
    });

    // Update local database if this job was booked through scheduler
    await db.update(schedulerRequests)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(schedulerRequests.serviceTitanJobId, jobId));

    console.log(`[Customer Portal] Job ${jobId} canceled by customer ${authenticatedCustomerId}`);

    return NextResponse.json({
      success: true,
      message: 'Appointment canceled successfully',
    });
  } catch (error: any) {
    console.error('[Customer Portal Cancel Job] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
