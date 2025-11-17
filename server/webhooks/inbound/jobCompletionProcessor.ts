/**
 * Job Completion Email Processor
 * 
 * Handles incoming job completion emails from ServiceTitan automation
 * 
 * Flow:
 * 1. ServiceTitan automation sends email when job completes
 * 2. Extract job ID from email
 * 3. Fetch full job details from ServiceTitan API
 * 4. Create jobCompletions record (triggers review requests)
 * 5. Link to existing serviceTitanPhotoJobs if invoice was sent
 * 6. Seed referral nurture campaign if applicable
 */

import { db } from '../../db';
import { jobCompletions, reviewRequests, serviceTitanPhotoJobs } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { serviceTitanCRM } from '../../lib/servicetitan/crm';
import { serviceTitanJobs } from '../../lib/servicetitan/jobs';

export interface ProcessJobCompletionOptions {
  jobId: number;
  from: string;
  subject: string;
}

/**
 * Process job completion email and create all necessary records
 */
export async function processJobCompletion(options: ProcessJobCompletionOptions): Promise<void> {
  const { jobId, from, subject } = options;

  console.log(`[Job Completion Processor] Processing job ${jobId}`);

  try {
    // Check if job completion already exists (idempotency)
    const existing = await db
      .select()
      .from(jobCompletions)
      .where(eq(jobCompletions.jobId, jobId))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[Job Completion Processor] Job completion already exists for job ${jobId}`);
      return;
    }

    // Fetch full job details from ServiceTitan
    console.log(`[Job Completion Processor] Fetching job details from ServiceTitan API`);
    const job = await serviceTitanJobs.getJob(jobId);

    if (!job) {
      console.error(`[Job Completion Processor] Job ${jobId} not found in ServiceTitan`);
      return;
    }

    // Fetch customer details
    const customer = await serviceTitanCRM.getCustomer(job.customerId);
    
    if (!customer) {
      console.error(`[Job Completion Processor] Customer ${job.customerId} not found in ServiceTitan`);
      return;
    }

    // Get customer contacts for email/phone
    const contacts = await serviceTitanCRM.getCustomerContacts(job.customerId);
    
    // Extract email - check direct value first, then methods array
    let primaryEmail: string | null = null;
    for (const contact of contacts) {
      // Try direct value property first (some contact types)
      const directValue = (contact as any).value;
      if (directValue && typeof directValue === 'string' && directValue.includes('@')) {
        primaryEmail = directValue;
        break;
      }
      
      // Check methods array for ANY email type (Email, PrimaryEmail, WorkEmail, etc.)
      if (contact.methods && Array.isArray(contact.methods)) {
        for (const method of contact.methods) {
          // Accept any method type containing 'Email' (case insensitive)
          if (method.type && method.type.toLowerCase().includes('email') && method.value) {
            primaryEmail = method.value;
            break;
          }
        }
        if (primaryEmail) break;
      }
    }
    
    // Extract phone - check direct value first, then methods array
    let primaryPhone: string | null = null;
    for (const contact of contacts) {
      // Try direct value property first (some contact types)
      const directValue = (contact as any).value || (contact as any).phoneSettings?.phoneNumber;
      if (directValue && typeof directValue === 'string') {
        primaryPhone = directValue;
        break;
      }
      
      // Check methods array for Phone/MobilePhone type
      if (contact.methods && Array.isArray(contact.methods)) {
        for (const method of contact.methods) {
          if ((method.type === 'MobilePhone' || method.type === 'Phone') && method.value) {
            primaryPhone = method.value;
            break;
          }
        }
        if (primaryPhone) break;
      }
    }

    // Detect if this is a quote-only job (no actual work performed)
    // ServiceTitan sends $0 invoices for estimates/quotes
    // This will be refined when invoice processor updates the record
    const invoiceTotal = 0; // Will be updated by invoice processor
    const isQuoteOnly = false; // Conservative default - assume paid work

    // Create job completion record
    const [jobCompletion] = await db
      .insert(jobCompletions)
      .values({
        jobId: jobId,
        invoiceNumber: null, // Will be updated by invoice processor
        customerId: job.customerId,
        customerName: customer.name,
        customerEmail: primaryEmail,
        customerPhone: primaryPhone,
        serviceName: job.summary || 'Plumbing Service',
        invoiceTotal: Math.round(invoiceTotal * 100), // Convert to cents (updated by invoice processor)
        completionDate: new Date(), // Webhook notification time (when we learned about completion)
        technicianName: null, // Not available in basic job object
        jobNotes: null, // Not available in basic job object
        isQuoteOnly: isQuoteOnly,
        source: 'webhook',
        sourceMetadata: {
          from,
          subject,
          jobNumber: job.jobNumber,
        },
      })
      .returning();

    console.log(`[Job Completion Processor] Created job completion ${jobCompletion.id} for job ${jobId}`);

    // Create initial review request (drip campaign will handle sending)
    if (primaryEmail && !isQuoteOnly) {
      const [reviewRequest] = await db
        .insert(reviewRequests)
        .values({
          jobCompletionId: jobCompletion.id,
          customerId: job.customerId,
          customerEmail: primaryEmail,
          status: 'queued',
          // Scheduler will send emails based on jobCompletion.completionDate:
          // Email 1: 1 day after completion
          // Email 2: 7 days after completion
          // Email 3: 14 days after completion
          // Email 4: 21 days after completion
        })
        .returning();

      console.log(`[Job Completion Processor] Created review request ${reviewRequest.id} (drip campaign will start 24 hours after job completion)`);
    } else {
      console.log(`[Job Completion Processor] Skipping review request - ${!primaryEmail ? 'no email' : 'quote only'}`);
    }

    // Note: Invoice data linkage will be handled by the invoice processor
    console.log(`[Job Completion Processor] Job completion created - invoice linkage will be handled by invoice processor`);

    // TODO: Seed referral nurture campaign if customer meets criteria
    // This will be handled by the referral nurture scheduler

  } catch (error) {
    console.error(`[Job Completion Processor] Error processing job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Extract job ID from email subject or body
 * Expected formats:
 * - "Job Completed: 12345"
 * - "Job #12345 Completed"
 * - Plain text body with "Job ID: 12345"
 */
export function extractJobId(subject: string, body?: string): number | null {
  // Try subject first
  const subjectPatterns = [
    /Job\s*(?:Completed|Complete)[:\s]*#?(\d+)/i,
    /Job\s*#?(\d+)\s*(?:Completed|Complete)/i,
    /\bJob\s*(?:ID|Number)[:\s]*#?(\d+)/i,
  ];

  for (const pattern of subjectPatterns) {
    const match = subject.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  // Try body if provided
  if (body) {
    const bodyPatterns = [
      /Job\s*ID[:\s]*(\d+)/i,
      /Job\s*Number[:\s]*(\d+)/i,
      /\bJob[:\s]*(\d+)/i,
    ];

    for (const pattern of bodyPatterns) {
      const match = body.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
  }

  console.warn('[Job Completion Processor] Could not extract job ID from:', subject);
  return null;
}
