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
import { invoiceProcessingLog } from '@shared/schema';

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
    
    // TODO: Will implement PDF parsing, customer matching, and campaign triggering in next tasks
    // For now, mark as "received" since parsing hasn't happened yet
    logEntry.status = 'pending'; // Will change to 'parsed' after actual parsing
    
    // Save log entry
    const [savedLog] = await db.insert(invoiceProcessingLog).values(logEntry).returning();
    
    console.log('[Invoice Webhook] Logged successfully:', savedLog.id);
    
    return NextResponse.json({
      success: true,
      logId: savedLog.id,
      fileName: pdfFilename,
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
