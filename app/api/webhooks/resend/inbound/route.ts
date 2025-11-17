/**
 * Resend Inbound Email Webhook
 * 
 * Receives incoming emails at mail.plumbersthatcare.com domain
 * 
 * Flow:
 * 1. Verify Svix signature from Resend
 * 2. Parse email metadata (from, subject, etc.)
 * 3. Fetch attachments via Resend API (not included in webhook payload)
 * 4. Route to processors:
 *    - Invoices → Create photo fetch jobs
 *    - Estimates → Log for reference
 *    - Customer data → Parse XLSX
 * 5. Forward ALL emails to Zoom chat for monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { getUncachableResendClient } from '@/server/email';
import { processInvoice, extractInvoiceNumber } from '@/server/webhooks/inbound/invoiceProcessor';
import { processEstimate, extractEstimateNumber } from '@/server/webhooks/inbound/estimateProcessor';
import { processCustomerData, isCustomerDataExport } from '@/server/webhooks/inbound/customerDataProcessor';
import { rateLimiter } from '@/server/lib/rateLimiter';

const webhookSecret = process.env.RESEND_WEBHOOK_SIGNING_SECRET;
const ZOOM_FORWARD_EMAIL = 'ST-Alerts-828414d7c3d94e90@teamchat.zoom.us';
const RESEND_RATE_LIMIT = 1; // 1 request/second to stay safely under 2/sec limit and avoid 429 errors

export async function POST(req: NextRequest) {
  console.log('[Resend Inbound] Webhook received');

  try {
    if (!webhookSecret) {
      console.error('[Resend Inbound] RESEND_WEBHOOK_SIGNING_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Get raw body and headers for signature verification
    const body = await req.text();
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('[Resend Inbound] Missing Svix headers');
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    // Verify webhook signature with Svix
    const wh = new Webhook(webhookSecret);
    let event: any;

    try {
      event = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err: any) {
      console.error('[Resend Inbound] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('[Resend Inbound] Event type:', event.type);

    // Only process email.received events
    if (event.type !== 'email.received') {
      console.log('[Resend Inbound] Ignoring event type:', event.type);
      return NextResponse.json({ received: true });
    }

    const emailData = event.data;
    const from = emailData.from;
    const subject = emailData.subject || '';
    const emailId = emailData.email_id;

    console.log('[Resend Inbound] Email received');
    console.log('  From:', from);
    console.log('  Subject:', subject);
    console.log('  Email ID:', emailId);

    // Forward to Zoom chat (non-blocking)
    forwardToZoom(emailData).catch(err => 
      console.error('[Resend Inbound] Error forwarding to Zoom:', err)
    );

    // Fetch attachments if present (not included in webhook payload)
    let attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
    
    if (emailData.attachments && emailData.attachments.length > 0) {
      try {
        console.log(`[Resend Inbound] Fetching ${emailData.attachments.length} attachments`);
        attachments = await fetchAttachments(emailId, emailData.attachments);
      } catch (attachmentError) {
        console.error('[Resend Inbound] Error fetching attachments:', attachmentError);
        // Continue processing - attachment fetch failure shouldn't block webhook acknowledgment
      }
    }

    // Route to appropriate processor (wrap in try/catch to prevent 500 errors)
    try {
      const emailText = emailData.text || emailData.html || '';
      await routeEmail(from, subject, attachments, emailText);
    } catch (routeError) {
      console.error('[Resend Inbound] Error routing email:', routeError);
      // Log error but still return 200 to prevent Resend retries
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Resend Inbound] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Retry a fetch request with exponential backoff for 429 errors
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      if (attempt < maxRetries) {
        const retryAfter = response.headers.get('retry-after');
        const delayMs = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        
        console.warn(`[Resend Inbound] Rate limit hit (429), retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      } else {
        console.error(`[Resend Inbound] Rate limit hit (429) after ${maxRetries} retries, giving up`);
        return response;
      }
    }
    
    return response;
  }
  
  throw new Error('Unexpected retry logic error');
}

/**
 * Fetch email attachments via Resend API
 * Resend webhook only includes attachment metadata, not content
 * 
 * Downloads sequentially with size limits to prevent memory exhaustion
 * Includes retry logic with exponential backoff for 429 rate limit errors
 */
async function fetchAttachments(
  emailId: string,
  attachmentMeta: Array<{ id: string; filename: string; content_type: string }>
): Promise<Array<{ filename: string; content: Buffer; contentType: string }>> {
  const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
  const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB per attachment
  const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total
  let totalSize = 0;

  // Get API key from Replit connector (same as email sending)
  let apiKey: string;
  try {
    const { client } = await getUncachableResendClient();
    // Extract API key from the client (it's in the client's config)
    apiKey = (client as any).key;
  } catch (error) {
    console.error('[Resend Inbound] Failed to get Resend credentials from connector:', error);
    return attachments;
  }

  // Download sequentially to prevent memory exhaustion
  for (const meta of attachmentMeta) {
    try {
      console.log(`[Resend Inbound] Fetching attachment: ${meta.filename}`);

      // Call Resend API to get attachment content (rate-limited with retry logic)
      // API: GET /emails/{email_id}/attachments/{attachment_id}
      const response = await rateLimiter.enqueue(
        'resend',
        async () => fetchWithRetry(
          `https://api.resend.com/emails/${emailId}/attachments/${meta.id}`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          }
        ),
        RESEND_RATE_LIMIT
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content length before downloading
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      if (contentLength > MAX_ATTACHMENT_SIZE) {
        console.warn(`[Resend Inbound] Skipping oversized attachment ${meta.filename} (${contentLength} bytes)`);
        continue;
      }

      if (totalSize + contentLength > MAX_TOTAL_SIZE) {
        console.warn(`[Resend Inbound] Total size limit exceeded, skipping remaining attachments`);
        break;
      }

      const arrayBuffer = await response.arrayBuffer();
      const content = Buffer.from(arrayBuffer);

      totalSize += content.length;

      attachments.push({
        filename: meta.filename,
        content,
        contentType: meta.content_type,
      });

      console.log(`[Resend Inbound] Fetched ${meta.filename} (${content.length} bytes)`);
    } catch (error) {
      console.error(`[Resend Inbound] Error fetching attachment ${meta.filename}:`, error);
      // Continue with next attachment
    }
  }

  return attachments;
}

/**
 * Route email to appropriate processor based on content
 */
async function routeEmail(
  from: string,
  subject: string,
  attachments: Array<{ filename: string; content: Buffer; contentType: string }>,
  emailText?: string
): Promise<void> {
  try {
    // PRIORITY 1: Check for job completion alerts (plain text from ServiceTitan automation)
    // These should be processed BEFORE invoices to trigger all workflows
    const { extractJobId, processJobCompletion } = await import('@/server/webhooks/inbound/jobCompletionProcessor');
    const jobId = extractJobId(subject, emailText);
    if (jobId) {
      console.log(`[Resend Inbound] Processing job completion: ${jobId}`);
      await processJobCompletion({
        jobId,
        from,
        subject,
      });
      // Don't return - continue to check for invoice/photo processing
    }

    // PRIORITY 2: Check for invoice PDFs
    const invoicePdf = attachments.find(att => 
      /invoice.*\.pdf$/i.test(att.filename) && att.contentType === 'application/pdf'
    );

    if (invoicePdf) {
      const invoiceNumber = await extractInvoiceNumber(subject, invoicePdf.content, invoicePdf.filename);
      if (invoiceNumber) {
        console.log(`[Resend Inbound] Processing invoice: ${invoiceNumber}`);
        await processInvoice({
          invoiceNumber,
          pdfBuffer: invoicePdf.content,
          from,
          subject,
        });
        return;
      } else {
        console.warn(`[Resend Inbound] Found invoice PDF (${invoicePdf.filename}) but could not extract invoice number`);
      }
    }

    // Check for estimate PDFs
    const estimatePdf = attachments.find(att => 
      /estimate.*\.pdf$/i.test(att.filename) && att.contentType === 'application/pdf'
    );

    if (estimatePdf) {
      const estimateNumber = extractEstimateNumber(subject);
      if (estimateNumber) {
        console.log(`[Resend Inbound] Processing estimate: ${estimateNumber}`);
        await processEstimate({
          estimateNumber,
          pdfBuffer: estimatePdf.content,
          from,
          subject,
        });
        return;
      }
    }

    // Check for customer data XLSX exports
    const xlsxFile = attachments.find(att => 
      /\.(xlsx|xls)$/i.test(att.filename)
    );

    if (xlsxFile && isCustomerDataExport(subject, xlsxFile.filename)) {
      console.log(`[Resend Inbound] Processing customer data: ${xlsxFile.filename}`);
      await processCustomerData({
        xlsxBuffer: xlsxFile.content,
        from,
        subject,
        fileName: xlsxFile.filename,
      });
      return;
    }

    console.log('[Resend Inbound] No matching processor for this email');
  } catch (error) {
    console.error('[Resend Inbound] Error routing email:', error);
    throw error;
  }
}

/**
 * Forward all incoming emails to Zoom chat for monitoring
 * Includes retry logic with exponential backoff for 429 rate limit errors
 */
async function forwardToZoom(emailData: any): Promise<void> {
  const maxRetries = 3;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Resend Inbound] Starting Zoom forward for: ${emailData.subject} (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      const { client: resend, fromEmail } = await getUncachableResendClient();

      // Rate-limit the email send to prevent 429 errors
      const result = await rateLimiter.enqueue(
        'resend',
        async () => resend.emails.send({
          from: fromEmail,
          to: ZOOM_FORWARD_EMAIL,
          subject: `FWD: ${emailData.subject}`,
          html: `
            <p><strong>Forwarded from ServiceTitan</strong></p>
            <p><strong>From:</strong> ${emailData.from}</p>
            <p><strong>Subject:</strong> ${emailData.subject}</p>
            <p><strong>Date:</strong> ${new Date().toISOString()}</p>
            <hr>
            ${emailData.html || emailData.text || '(No content)'}
          `,
        }),
        RESEND_RATE_LIMIT
      );

      console.log('[Resend Inbound] Forwarded to Zoom successfully, result:', JSON.stringify(result));
      return; // Success - exit retry loop
    } catch (error: any) {
      // Check if it's a rate limit error (429)
      const is429Error = error?.message?.includes('429') || 
                        error?.statusCode === 429 || 
                        error?.status === 429;
      
      if (is429Error && attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.warn(`[Resend Inbound] Rate limit hit (429) on Zoom forward, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      console.error('[Resend Inbound] Error forwarding to Zoom:', error);
      console.error('[Resend Inbound] Error details:', error instanceof Error ? error.message : JSON.stringify(error));
      // Don't throw - forwarding failure shouldn't block webhook processing
      return;
    }
  }
}
