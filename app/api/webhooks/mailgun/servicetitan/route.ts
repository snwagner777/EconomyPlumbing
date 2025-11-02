import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/server/db';
import { invoiceProcessingLog, estimateProcessingLog } from '@shared/schema';

const MAILGUN_SIGNING_KEY = process.env.MAILGUN_SIGNING_KEY || '';

function verifyMailgunSignature(timestamp: string, token: string, signature: string): boolean {
  if (!MAILGUN_SIGNING_KEY) {
    console.error('[Mailgun Webhook] MAILGUN_SIGNING_KEY not configured');
    return false;
  }

  const data = timestamp + token;
  const hash = crypto
    .createHmac('sha256', MAILGUN_SIGNING_KEY)
    .update(data)
    .digest('hex');

  return hash === signature;
}

function detectDocumentType(subject: string, filename: string): 'invoice' | 'estimate' | 'unknown' {
  const subjectLower = subject.toLowerCase();
  const filenameLower = filename.toLowerCase();
  
  // Check for invoice indicators
  const invoiceKeywords = ['invoice', 'receipt', 'payment', 'completed job'];
  const isInvoice = invoiceKeywords.some(keyword => 
    subjectLower.includes(keyword) || filenameLower.includes(keyword)
  );
  
  if (isInvoice) {
    return 'invoice';
  }
  
  // Check for estimate indicators
  const estimateKeywords = ['estimate', 'quote', 'proposal', 'bid'];
  const isEstimate = estimateKeywords.some(keyword => 
    subjectLower.includes(keyword) || filenameLower.includes(keyword)
  );
  
  if (isEstimate) {
    return 'estimate';
  }
  
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract signature verification fields
    const timestamp = formData.get('timestamp') as string;
    const token = formData.get('token') as string;
    const signature = formData.get('signature') as string;
    
    if (!timestamp || !token || !signature) {
      console.error('[Mailgun Webhook] Missing signature fields');
      return NextResponse.json(
        { error: 'Missing signature fields' },
        { status: 401 }
      );
    }
    
    // Verify signature
    if (!verifyMailgunSignature(timestamp, token, signature)) {
      console.error('[Mailgun Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }
    
    // Extract email metadata
    const emailFrom = formData.get('From') as string || formData.get('from') as string;
    const emailSubject = formData.get('Subject') as string || formData.get('subject') as string;
    const messageId = formData.get('Message-Id') as string || formData.get('message-id') as string;
    
    console.log('[Mailgun Webhook] Received email:', {
      from: emailFrom,
      subject: emailSubject,
      messageId
    });
    
    // Find PDF attachment
    let pdfAttachment: File | null = null;
    let pdfFilename = '';
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('attachment-') && value instanceof File) {
        if (value.type === 'application/pdf' || value.name.toLowerCase().endsWith('.pdf')) {
          pdfAttachment = value;
          pdfFilename = value.name;
          break;
        }
      }
    }
    
    if (!pdfAttachment) {
      console.log('[Mailgun Webhook] No PDF attachment found - ignoring email');
      return NextResponse.json({ message: 'No PDF attachment found' }, { status: 200 });
    }
    
    console.log('[Mailgun Webhook] Found PDF:', {
      filename: pdfFilename,
      size: pdfAttachment.size,
      type: pdfAttachment.type
    });
    
    // Detect document type
    const documentType = detectDocumentType(emailSubject || '', pdfFilename);
    
    console.log('[Mailgun Webhook] Detected document type:', documentType);
    
    if (documentType === 'unknown') {
      console.warn('[Mailgun Webhook] Could not determine document type - defaulting to invoice');
    }
    
    // Route to appropriate processing based on detected type
    if (documentType === 'estimate') {
      // Log to estimate_processing_log
      await db.insert(estimateProcessingLog).values({
        emailFrom: emailFrom || 'unknown',
        emailSubject: emailSubject || 'No subject',
        pdfFilename: pdfFilename,
        attachmentSize: pdfAttachment.size,
        status: 'pending'
      });
      
      console.log('[Mailgun Webhook] Logged estimate to database');
      
      return NextResponse.json({ 
        message: 'Estimate received and logged',
        documentType: 'estimate',
        filename: pdfFilename
      }, { status: 200 });
      
    } else {
      // Log to invoice_processing_log (default for invoice or unknown)
      await db.insert(invoiceProcessingLog).values({
        emailFrom: emailFrom || 'unknown',
        emailSubject: emailSubject || 'No subject',
        pdfFilename: pdfFilename,
        attachmentSize: pdfAttachment.size,
        status: 'pending'
      });
      
      console.log('[Mailgun Webhook] Logged invoice to database');
      
      return NextResponse.json({ 
        message: 'Invoice received and logged',
        documentType: documentType === 'unknown' ? 'invoice (default)' : 'invoice',
        filename: pdfFilename
      }, { status: 200 });
    }
    
  } catch (error) {
    console.error('[Mailgun Webhook] Processing error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
