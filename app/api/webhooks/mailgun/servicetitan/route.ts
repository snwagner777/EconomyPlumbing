import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/server/db';
import { invoiceProcessingLog, estimateProcessingLog, customersXlsx } from '@shared/schema';
import { parsePDF } from '@/server/lib/pdfParser';
import { or, sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for PDF processing

const MAILGUN_SIGNING_KEY = process.env.MAILGUN_WEBHOOK_SIGNING_KEY || process.env.MAILGUN_SIGNING_KEY || '';

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
    
    // Convert PDF File to Buffer for parsing
    const arrayBuffer = await pdfAttachment.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    // Parse PDF to extract data
    const actualDocType = (documentType === 'unknown' ? 'invoice' : documentType) as 'invoice' | 'estimate';
    console.log('[Mailgun Webhook] Parsing PDF as:', actualDocType);
    
    const parsedData = await parsePDF(pdfBuffer, actualDocType);
    
    console.log('[Mailgun Webhook] PDF parsed:', {
      customerName: parsedData.customerName,
      customerPhone: parsedData.customerPhone,
      customerEmail: parsedData.customerEmail,
      documentNumber: parsedData.documentNumber,
      totalAmount: parsedData.totalAmount ? `$${(parsedData.totalAmount / 100).toFixed(2)}` : null,
      confidence: parsedData.confidence,
      errors: parsedData.extractionErrors.length
    });
    
    // Match customer in database by phone or email
    let matchedCustomerId: number | null = null;
    
    if (parsedData.customerPhone || parsedData.customerEmail) {
      const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
      
      // Build array of search conditions (filter out undefined)
      const searchConditions = [];
      
      if (parsedData.customerPhone) {
        searchConditions.push(
          sql`regexp_replace(${customersXlsx.phone}, '[^0-9]', '', 'g') = ${normalizePhone(parsedData.customerPhone)}`
        );
      }
      
      if (parsedData.customerEmail) {
        searchConditions.push(
          sql`LOWER(${customersXlsx.email}) LIKE LOWER(${'%' + parsedData.customerEmail + '%'})`
        );
      }
      
      // Only query if we have at least one condition
      if (searchConditions.length > 0) {
        const customers = await db
          .select({ id: customersXlsx.id, name: customersXlsx.name })
          .from(customersXlsx)
          .where(
            searchConditions.length === 1 
              ? searchConditions[0] 
              : or(...searchConditions)
          )
          .limit(1);
        
        if (customers.length > 0) {
          matchedCustomerId = customers[0].id;
          console.log('[Mailgun Webhook] Matched customer:', matchedCustomerId, '-', customers[0].name);
        } else {
          console.log('[Mailgun Webhook] No customer match found');
        }
      }
    }
    
    // Create log entry with parsed data
    const logEntry = {
      emailFrom: emailFrom || 'unknown',
      emailSubject: emailSubject || 'No subject',
      pdfFilename: pdfFilename,
      attachmentSize: pdfAttachment.size,
      status: 'parsed' as const,
      extractedData: parsedData,
      matchedCustomerId,
    };
    
    // Route to appropriate processing based on detected type
    if (actualDocType === 'estimate') {
      // Check if this is a $0 quote (skip follow-up for free estimates)
      const isZeroQuote = parsedData.totalAmount === 0 || parsedData.totalAmount === null;
      
      if (isZeroQuote) {
        console.log('[Mailgun Webhook] Skipping $0 estimate - no follow-up needed');
        await db.insert(estimateProcessingLog).values({
          ...logEntry,
          status: 'skipped',
          skipReason: 'zero_amount',
        });
        
        return NextResponse.json({ 
          message: 'Zero-amount estimate received - skipped',
          documentType: 'estimate',
          skipped: true,
          filename: pdfFilename
        }, { status: 200 });
      }
      
      // Log estimate
      await db.insert(estimateProcessingLog).values(logEntry);
      
      // TODO: Trigger quote follow-up campaign
      console.log('[Mailgun Webhook] TODO: Trigger quote follow-up campaign for customer:', matchedCustomerId);
      
      console.log('[Mailgun Webhook] Estimate logged successfully');
      
      return NextResponse.json({ 
        message: 'Estimate received and logged',
        documentType: 'estimate',
        customerMatched: !!matchedCustomerId,
        filename: pdfFilename
      }, { status: 200 });
      
    } else {
      // Log invoice
      await db.insert(invoiceProcessingLog).values(logEntry);
      
      // TODO: Trigger review request campaign
      console.log('[Mailgun Webhook] TODO: Trigger review request campaign for customer:', matchedCustomerId);
      
      console.log('[Mailgun Webhook] Invoice logged successfully');
      
      return NextResponse.json({ 
        message: 'Invoice received and logged',
        documentType: 'invoice',
        customerMatched: !!matchedCustomerId,
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
