/**
 * Invoice Email Processor
 * 
 * Handles incoming invoice PDFs from ServiceTitan via Resend inbound webhook
 * 
 * Flow:
 * 1. Receive invoice PDF via Resend webhook
 * 2. Extract invoice number from PDF or email subject
 * 3. Create serviceTitanPhotoJobs record (invoice number = job number)
 * 4. Background worker processes photo fetch queue
 */

import { db } from '../../db';
import { serviceTitanPhotoJobs } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export interface ProcessInvoiceOptions {
  invoiceNumber: string;
  customerId?: number;
  pdfBuffer?: Buffer;
  from: string;
  subject: string;
}

/**
 * Process invoice email and queue photo fetch job
 */
export async function processInvoice(options: ProcessInvoiceOptions): Promise<void> {
  const { invoiceNumber, customerId, from, subject } = options;

  console.log(`[Invoice Processor] Processing invoice ${invoiceNumber}`);

  try {
    // In ServiceTitan, invoice number = job number
    const jobId = parseInt(invoiceNumber, 10);

    if (isNaN(jobId)) {
      console.error(`[Invoice Processor] Invalid invoice/job number: ${invoiceNumber}`);
      return;
    }

    // Check if photo fetch job already exists
    const existing = await db
      .select()
      .from(serviceTitanPhotoJobs)
      .where(eq(serviceTitanPhotoJobs.jobId, jobId))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[Invoice Processor] Photo fetch job already exists for job ${jobId}`);
      
      // If existing job failed, reset it to queued for retry
      if (existing[0].status === 'failed') {
        await db
          .update(serviceTitanPhotoJobs)
          .set({
            status: 'queued',
            retryCount: 0,
            errorMessage: null,
          })
          .where(eq(serviceTitanPhotoJobs.id, existing[0].id));
        
        console.log(`[Invoice Processor] Reset failed job ${existing[0].id} to queued`);
      }
      
      return;
    }

    // Create photo fetch job
    const [newJob] = await db
      .insert(serviceTitanPhotoJobs)
      .values({
        jobId,
        invoiceNumber,
        customerId: customerId || null,
        status: 'queued',
      })
      .returning();

    console.log(`[Invoice Processor] Created photo fetch job ${newJob.id} for job ${jobId}`);
  } catch (error) {
    console.error(`[Invoice Processor] Error processing invoice ${invoiceNumber}:`, error);
    throw error;
  }
}

/**
 * Extract invoice number from email subject or PDF
 * ServiceTitan invoice emails typically have format: "Invoice #12345 from Economy Plumbing"
 */
export function extractInvoiceNumber(subject: string, pdfBuffer?: Buffer): string | null {
  // Try to extract from subject line
  const subjectMatch = subject.match(/Invoice\s*#?\s*(\d+)/i);
  if (subjectMatch) {
    return subjectMatch[1];
  }

  // Try alternative formats
  const altMatch = subject.match(/#(\d{5,})/); // Match any 5+ digit number with #
  if (altMatch) {
    return altMatch[1];
  }

  // TODO: If needed, could parse PDF to extract invoice number
  // For now, subject line matching is sufficient

  console.warn('[Invoice Processor] Could not extract invoice number from subject:', subject);
  return null;
}
