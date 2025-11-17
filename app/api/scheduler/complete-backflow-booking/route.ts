/**
 * DISABLED: Complete Backflow Booking After Payment API
 * 
 * Payment integrations have been removed from the scheduler.
 * This endpoint is no longer available.
 */

import { NextRequest, NextResponse } from 'next/server';

/* PAYMENT INTEGRATION DISABLED - Entire file commented out

import Stripe from 'stripe';
import { schedulerRequests, trackingNumbers, insertSchedulerRequestSchema } from '@shared/schema';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { serviceTitanJobs } from '@/server/lib/servicetitan/jobs';
import { serviceTitanSettings } from '@/server/lib/servicetitan/settings';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const requestSchema = z.object({
  sessionId: z.string(),
});

... (350+ lines of payment processing code removed for brevity)

*/

// Return 404 for all requests
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Payment integration disabled' },
    { status: 404 }
  );
}
