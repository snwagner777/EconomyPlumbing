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
import pdfParse from 'pdf-parse';

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
 * Extract invoice number from email subject, PDF filename, or PDF content
 * ServiceTitan invoice emails typically have format: "Invoice #12345 from Economy Plumbing"
 * But also sends: "Your $0.00 Invoice from Economy Plumbing Services, LLC"
 */
export async function extractInvoiceNumber(subject: string, pdfBuffer?: Buffer, filename?: string): Promise<string | null> {
  // Try to extract from subject line
  const subjectMatch = subject.match(/Invoice\s*#?\s*(\d+)/i);
  if (subjectMatch) {
    return subjectMatch[1];
  }

  // Try alternative formats in subject
  const altMatch = subject.match(/#(\d{5,})/); // Match any 5+ digit number with #
  if (altMatch) {
    return altMatch[1];
  }

  // Try to extract from PDF filename (e.g., "Invoice 12345.pdf", "Invoice-12345.pdf", "Invoice #12345.pdf")
  if (filename) {
    const filenameMatch = filename.match(/Invoice[^0-9]*(\d{3,})/i);
    if (filenameMatch) {
      console.log(`[Invoice Processor] Extracted invoice number from filename: ${filenameMatch[1]}`);
      return filenameMatch[1];
    }
  }

  // Try to parse PDF content if available using pdf-parse
  if (pdfBuffer) {
    try {
      console.log(`[Invoice Processor] Parsing PDF content (${pdfBuffer.length} bytes)`);
      
      const pdfData = await pdfParse(pdfBuffer);
      const pdfText = pdfData.text;
      
      console.log(`[Invoice Processor] Extracted ${pdfText.length} chars from PDF`);
      
      // Look for common invoice number patterns in PDF
      const pdfPatterns = [
        /Invoice\s*#?\s*(\d{3,})/i,
        /Invoice\s*Number:?\s*(\d{3,})/i,
        /Invoice\s*ID:?\s*(\d{3,})/i,
        /#(\d{5,})/, // Match 5+ digit numbers with # (conservative)
      ];
      
      for (const pattern of pdfPatterns) {
        const match = pdfText.match(pattern);
        if (match) {
          console.log(`[Invoice Processor] Extracted invoice number from PDF content: ${match[1]}`);
          return match[1];
        }
      }
      
      console.warn(`[Invoice Processor] PDF parsed but no invoice number found in ${pdfText.length} chars`);
    } catch (error) {
      console.error('[Invoice Processor] Error parsing PDF:', error);
    }
  }

  console.warn('[Invoice Processor] Could not extract invoice number from subject, filename, or PDF:', subject);
  return null;
}
