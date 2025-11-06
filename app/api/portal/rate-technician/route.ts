import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { jobCompletions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';

export async function POST(request: Request) {
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

    const { jobCompletionId, rating } = await request.json();

    if (!jobCompletionId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid job completion ID or rating' },
        { status: 400 }
      );
    }

    // Fetch the job completion to verify it belongs to this customer
    const [jobCompletion] = await db
      .select()
      .from(jobCompletions)
      .where(eq(jobCompletions.id, jobCompletionId))
      .limit(1);

    if (!jobCompletion) {
      return NextResponse.json({ error: 'Job completion not found' }, { status: 404 });
    }

    if (jobCompletion.customerId !== parseInt(customerId)) {
      return NextResponse.json(
        { error: 'Unauthorized - job does not belong to this customer' },
        { status: 403 }
      );
    }

    // Update the job completion with the rating
    await db
      .update(jobCompletions)
      .set({
        technicianRating: rating,
        ratedAt: new Date(),
      })
      .where(eq(jobCompletions.id, jobCompletionId));

    // Submit rating to ServiceTitan (don't fail if this errors)
    try {
      const serviceTitan = getServiceTitanAPI();
      await serviceTitan.submitTechnicianRating(jobCompletion.jobId, rating);
      console.log(`[Portal] Submitted rating ${rating} to ServiceTitan for job ${jobCompletion.jobId}`);
    } catch (stError) {
      console.error('[Portal] Error submitting rating to ServiceTitan:', stError);
      // Continue anyway - we've saved the rating locally
    }

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully',
      rating,
    });
  } catch (error) {
    console.error('[Portal] Error rating technician:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}
