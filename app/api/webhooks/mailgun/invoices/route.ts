/**
 * Mailgun Webhook Handler for ServiceTitan Invoice PDFs
 * 
 * Processes invoice emails with PDF attachments:
 * 1. Verifies Mailgun signature
 * 2. Extracts PDF attachment
 * 3. Parses PDF for customer data
 * 4. Matches customer in database
 * 5. Creates job completion record
 * 6. Triggers review request campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/server/db';
import { invoiceProcessingLog, serviceTitanContacts, jobCompletions, reviewRequests } from '@shared/schema';
import { parsePDF } from '@/server/lib/pdfParser';
import { sql, or, and, eq } from 'drizzle-orm';
import { sendSMS } from '@/server/lib/sms';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for PDF processing

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Initialize log entry
  const logEntry: any = {
    receivedAt: new Date(),
    status: 'pending',
    errorMessage: null,
  };
  
  try {
    // Parse multipart form data
    const formData = await request.formData();
    
    // Extract email metadata
    logEntry.emailSubject = formData.get('subject') as string || null;
    logEntry.emailFrom = formData.get('sender') as string || formData.get('from') as string || null;
    
    console.log('[Invoice Webhook] Received email:', {
      subject: logEntry.emailSubject,
      from: logEntry.emailFrom,
      time: new Date().toISOString()
    });
    
    // Verify Mailgun signature
    const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    if (!signingKey) {
      logEntry.status = 'failed';
      logEntry.errorMessage = 'Webhook signing key not configured';
      await db.insert(invoiceProcessingLog).values(logEntry);
      
      return NextResponse.json(
        { error: 'Webhook signing key not configured' },
        { status: 500 }
      );
    }
    
    const timestamp = formData.get('timestamp') as string;
    const token = formData.get('token') as string;
    const signature = formData.get('signature') as string;
    
    if (!timestamp || !token || !signature) {
      logEntry.status = 'failed';
      logEntry.errorMessage = 'Missing signature components';
      await db.insert(invoiceProcessingLog).values(logEntry);
      
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }
    
    // Verify timestamp (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    const timestampAge = currentTime - parseInt(timestamp);
    
    if (timestampAge > 300) { // 5 minutes
      logEntry.status = 'failed';
      logEntry.errorMessage = `Timestamp too old: ${timestampAge}s`;
      await db.insert(invoiceProcessingLog).values(logEntry);
      
      return NextResponse.json(
        { error: 'Timestamp expired' },
        { status: 401 }
      );
    }
    
    // Verify HMAC signature
    const encodedToken = crypto
      .createHmac('sha256', signingKey)
      .update(timestamp + token)
      .digest('hex');
    
    if (encodedToken !== signature) {
      logEntry.status = 'failed';
      logEntry.errorMessage = 'Invalid signature';
      await db.insert(invoiceProcessingLog).values(logEntry);
      
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }
    
    console.log('[Invoice Webhook] Signature verified');
    
    // Find PDF attachment
    let pdfFile: File | null = null;
    let pdfFilename: string | null = null;
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.name.toLowerCase().endsWith('.pdf')) {
        pdfFile = value;
        pdfFilename = value.name;
        break;
      }
    }
    
    if (!pdfFile || !pdfFilename) {
      logEntry.status = 'failed';
      logEntry.errorMessage = 'No PDF attachment found';
      await db.insert(invoiceProcessingLog).values(logEntry);
      
      // Return 500 so Mailgun can retry or alert operators
      return NextResponse.json(
        {
          success: false,
          message: 'No PDF attachment found'
        },
        { status: 500 }
      );
    }
    
    logEntry.pdfFilename = pdfFilename;
    logEntry.attachmentSize = pdfFile.size;
    
    console.log('[Invoice Webhook] Found PDF:', pdfFilename, `(${(pdfFile.size / 1024).toFixed(2)} KB)`);
    
    // Convert PDF File to Buffer for parsing
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    // Parse PDF to extract invoice data
    console.log('[Invoice Webhook] Parsing PDF...');
    const parsedData = await parsePDF(pdfBuffer, 'invoice');
    
    console.log('[Invoice Webhook] PDF parsed:', {
      customerName: parsedData.customerName,
      customerPhone: parsedData.customerPhone,
      customerEmail: parsedData.customerEmail,
      invoiceNumber: parsedData.documentNumber,
      totalAmount: parsedData.totalAmount ? `$${(parsedData.totalAmount / 100).toFixed(2)}` : null,
      confidence: parsedData.confidence,
      errors: parsedData.extractionErrors.length
    });
    
    // Update log with parsed data
    logEntry.extractedData = parsedData;
    logEntry.status = 'parsed';
    
    // Match customer in ServiceTitan contacts database
    let matchedCustomerId: number | null = null;
    let matchSource: 'phone' | 'email' | null = null;
    
    if (parsedData.customerPhone || parsedData.customerEmail) {
      // Helper to normalize phone for comparison (last 10 digits)
      const normalizePhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        return digits.length >= 10 ? digits.slice(-10) : digits;
      };
      
      // Try phone match first (more reliable than email)
      if (parsedData.customerPhone) {
        const normalizedPhone = normalizePhone(parsedData.customerPhone);
        const phoneContacts = await db
          .select({ customerId: serviceTitanContacts.customerId })
          .from(serviceTitanContacts)
          .where(
            and(
              eq(serviceTitanContacts.normalizedValue, normalizedPhone),
              or(
                eq(serviceTitanContacts.contactType, 'Phone'),
                eq(serviceTitanContacts.contactType, 'MobilePhone')
              )
            )
          )
          .limit(1);
        
        if (phoneContacts.length > 0) {
          matchedCustomerId = phoneContacts[0].customerId;
          matchSource = 'phone';
          console.log('[Invoice Webhook] Matched customer by phone:', matchedCustomerId);
        }
      }
      
      // If no phone match, try email
      if (!matchedCustomerId && parsedData.customerEmail) {
        const normalizedEmail = parsedData.customerEmail.toLowerCase();
        const emailContacts = await db
          .select({ customerId: serviceTitanContacts.customerId })
          .from(serviceTitanContacts)
          .where(
            and(
              eq(serviceTitanContacts.normalizedValue, normalizedEmail),
              eq(serviceTitanContacts.contactType, 'Email')
            )
          )
          .limit(1);
        
        if (emailContacts.length > 0) {
          matchedCustomerId = emailContacts[0].customerId;
          matchSource = 'email';
          console.log('[Invoice Webhook] Matched customer by email:', matchedCustomerId);
        }
      }
      
      if (!matchedCustomerId) {
        console.log('[Invoice Webhook] No customer match found');
      }
    }
    
    logEntry.matchedCustomerId = matchedCustomerId;
    
    // If we matched a customer and have invoice number, create job completion and trigger review request
    let jobCompletionCreated = false;
    let reviewRequestCreated = false;
    
    if (matchedCustomerId && parsedData.documentNumber && parsedData.customerEmail) {
      // Check for existing job completion with this invoice number (idempotency)
      const existingJobs = await db
        .select({ id: jobCompletions.id })
        .from(jobCompletions)
        .where(
          and(
            eq(jobCompletions.customerId, matchedCustomerId),
            eq(jobCompletions.invoiceNumber, parsedData.documentNumber)
          )
        )
        .limit(1);
      
      if (existingJobs.length === 0) {
        console.log('[Invoice Webhook] Creating job completion and review request in transaction...');
        
        // Use transaction to ensure atomicity
        await db.transaction(async (tx) => {
          // Create job completion record with source='webhook'
          const [newJob] = await tx.insert(jobCompletions).values({
            customerId: matchedCustomerId,
            invoiceNumber: parsedData.documentNumber!,
            completedDate: parsedData.documentDate || new Date(),
            totalAmount: parsedData.totalAmount,
            source: 'webhook',
            sourceMetadata: {
              emailFrom: logEntry.emailFrom,
              emailSubject: logEntry.emailSubject,
              pdfFilename: pdfFilename,
              confidence: parsedData.confidence,
              extractionErrors: parsedData.extractionErrors,
              matchSource: matchSource,
            },
          }).returning();
          
          jobCompletionCreated = true;
          console.log('[Invoice Webhook] Job completion created:', newJob.id);
          
          // Create review request record with source='webhook'
          // Schema requires: jobCompletionId, customerId, customerEmail, status (has default), source (has default), sourceMetadata (optional)
          const [newReviewRequest] = await tx.insert(reviewRequests).values({
            jobCompletionId: newJob.id,
            customerId: matchedCustomerId,
            customerEmail: parsedData.customerEmail!,
            status: 'queued', // Will be picked up by review request scheduler
            source: 'webhook',
            sourceMetadata: {
              invoiceNumber: parsedData.documentNumber,
              totalAmount: parsedData.totalAmount,
              pdfFilename: pdfFilename,
              customerName: parsedData.customerName,
              customerPhone: parsedData.customerPhone,
            },
          }).returning();
          
          reviewRequestCreated = true;
          console.log('[Invoice Webhook] Review request created:', newReviewRequest.id, '- queued for scheduler');
        });
        
      } else {
        console.log('[Invoice Webhook] Job completion already exists for invoice:', parsedData.documentNumber);
      }
    } else {
      if (!matchedCustomerId) {
        console.log('[Invoice Webhook] No customer match - cannot create job completion');
      }
      if (!parsedData.documentNumber) {
        console.log('[Invoice Webhook] No invoice number - cannot create job completion');
      }
      if (!parsedData.customerEmail) {
        console.log('[Invoice Webhook] No customer email - cannot create review request');
      }
    }
    
    // Update log with processing results
    logEntry.status = reviewRequestCreated ? 'completed' : (jobCompletionCreated ? 'processed' : 'parsed');
    
    // Save log entry
    const [savedLog] = await db.insert(invoiceProcessingLog).values(logEntry).returning();
    
    console.log('[Invoice Webhook] Processing completed:', {
      logId: savedLog.id,
      jobCompletionCreated,
      reviewRequestCreated,
      processingTime: Date.now() - startTime
    });
    
    return NextResponse.json({
      success: true,
      logId: savedLog.id,
      fileName: pdfFilename,
      matched: !!matchedCustomerId,
      matchSource: matchSource,
      jobCompletionCreated,
      reviewRequestCreated,
      processingTime: Date.now() - startTime
    });
    
  } catch (error: any) {
    console.error('[Invoice Webhook] Error:', error);
    
    logEntry.status = 'failed';
    logEntry.errorMessage = error.message;
    
    try {
      await db.insert(invoiceProcessingLog).values(logEntry);
    } catch (dbError) {
      console.error('[Invoice Webhook] Failed to log error:', dbError);
    }
    
    return NextResponse.json(
      { error: 'Processing failed', message: error.message },
      { status: 500 }
    );
  }
}
