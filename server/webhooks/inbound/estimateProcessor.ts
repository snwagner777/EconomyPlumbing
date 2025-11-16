/**
 * Estimate Email Processor
 * 
 * Handles incoming estimate PDFs from ServiceTitan via Resend inbound webhook
 * 
 * Estimates are stored for future reference but don't trigger photo fetches
 * (photos are fetched after job completion/invoice)
 */

export interface ProcessEstimateOptions {
  estimateNumber: string;
  customerId?: number;
  pdfBuffer?: Buffer;
  from: string;
  subject: string;
}

/**
 * Process estimate email
 */
export async function processEstimate(options: ProcessEstimateOptions): Promise<void> {
  const { estimateNumber, from, subject } = options;

  console.log(`[Estimate Processor] Processing estimate ${estimateNumber}`);

  try {
    // TODO: Store estimate data if needed
    // For now, just log it - estimates don't trigger photo fetches
    // Photo fetches only happen after invoice/job completion

    console.log(`[Estimate Processor] Logged estimate ${estimateNumber}`);
  } catch (error) {
    console.error(`[Estimate Processor] Error processing estimate ${estimateNumber}:`, error);
    throw error;
  }
}

/**
 * Extract estimate number from email subject
 * ServiceTitan estimate emails typically have format: "Estimate #12345 from Economy Plumbing"
 */
export function extractEstimateNumber(subject: string): string | null {
  // Try to extract from subject line
  const subjectMatch = subject.match(/Estimate\s*#?\s*(\d+)/i);
  if (subjectMatch) {
    return subjectMatch[1];
  }

  // Try alternative formats
  const altMatch = subject.match(/#(\d{5,})/); // Match any 5+ digit number with #
  if (altMatch) {
    return altMatch[1];
  }

  console.warn('[Estimate Processor] Could not extract estimate number from subject:', subject);
  return null;
}
