/**
 * Sample Customer Data API
 * 
 * Returns real customer + job data from jobCompletions table
 * Provides authentic ServiceTitan data for email preview generation
 */

import { NextResponse } from 'next/server';
import { jobCompletions } from '@shared/schema';
import { sql, desc } from 'drizzle-orm';

export async function GET() {
  const { db } = await import('@/server/db');
  try {
    // Get a recent completed job with full customer and service details
    const [jobCompletion] = await db
      .select()
      .from(jobCompletions)
      .orderBy(desc(jobCompletions.completionDate))
      .limit(1);

    if (!jobCompletion) {
      // Fallback to sample data if no job completions exist
      return NextResponse.json({
        customerId: 12345,
        customerName: 'John Smith',
        serviceType: 'Water Heater Installation',
        jobAmount: 185000, // $1,850.00 in cents
        jobDate: new Date(),
        location: 'Austin, TX',
      });
    }

    // Format real job completion data to match mockJobDetails structure
    const sampleCustomer = {
      customerId: jobCompletion.customerId,
      customerName: jobCompletion.customerName,
      serviceType: jobCompletion.serviceName || 'Plumbing Service',
      jobAmount: jobCompletion.invoiceTotal || 0, // Already in cents
      jobDate: jobCompletion.completionDate,
      location: `${jobCompletion.customerName}'s location`, // Could enhance with actual address if needed
    };

    return NextResponse.json(sampleCustomer);
  } catch (error) {
    console.error('[Sample Customer API] Error:', error);
    
    // Fallback to sample data on error
    return NextResponse.json({
      customerId: 12345,
      customerName: 'John Smith',
      serviceType: 'Water Heater Installation',
      jobAmount: 185000,
      jobDate: new Date(),
      location: 'Austin, TX',
    });
  }
}
