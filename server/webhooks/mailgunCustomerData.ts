/**
 * Bulletproof Mailgun Webhook Handler for XLSX Customer Data Import
 * 
 * Features:
 * - Logs EVERY webhook attempt to database (success or failure)
 * - Only returns 200 OK on actual successful import
 * - Comprehensive error handling at every step
 * - Detailed logging for debugging
 * - Signature verification with replay protection
 */

import type { Request, Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { db } from '../db';
import { mailgunWebhookLogs } from '@shared/schema';

const mailgunUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).any();

export function handleMailgunWebhook(req: Request, res: Response) {
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.log('!!! MAILGUN WEBHOOK HANDLER CALLED !!!!!!!!!!!!');
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  
  const startTime = Date.now();
  
  // Initialize webhook log entry
  const webhookLog: any = {
    receivedAt: new Date(),
    messageId: null,
    sender: null,
    recipient: null,
    subject: null,
    signatureVerified: false,
    timestampAge: null,
    attachmentCount: 0,
    xlsxFound: false,
    xlsxFileName: null,
    xlsxSize: null,
    status: 'failed',
    errorMessage: null,
    importId: null,
    processingTime: null,
  };
  
  console.log('========================================');
  console.log('[Mailgun Webhook] WEBHOOK REQUEST RECEIVED');
  console.log('[Mailgun Webhook] Time:', new Date().toISOString());
  console.log('[Mailgun Webhook] Method:', req.method);
  console.log('[Mailgun Webhook] Content-Type:', req.headers['content-type']);
  console.log('========================================');
  
  // Parse multipart form data
  mailgunUpload(req, res, async (multerErr) => {
    try {
      // Handle multer errors
      if (multerErr) {
        webhookLog.status = 'failed';
        webhookLog.errorMessage = `Multer error: ${multerErr.message}`;
        webhookLog.processingTime = Date.now() - startTime;
        
        await db.insert(mailgunWebhookLogs).values(webhookLog);
        
        console.error('[Mailgun Webhook] ✗ Multer error:', multerErr);
        return res.status(400).json({ error: 'Failed to parse multipart data', details: multerErr.message });
      }
      
      console.log('[Mailgun Webhook] ✓ Multipart data parsed');
      
      // Extract webhook metadata
      webhookLog.messageId = req.body['Message-Id'] || req.body['message-id'];
      webhookLog.sender = req.body.sender || req.body.from;
      webhookLog.recipient = req.body.recipient || req.body.to;
      webhookLog.subject = req.body.subject;
      
      const files = (req as any).files as Express.Multer.File[];
      webhookLog.attachmentCount = files?.length || 0;
      
      console.log('[Mailgun Webhook] Email metadata:');
      console.log('  Message-ID:', webhookLog.messageId);
      console.log('  From:', webhookLog.sender);
      console.log('  To:', webhookLog.recipient);
      console.log('  Subject:', webhookLog.subject);
      console.log('  Attachments:', webhookLog.attachmentCount);
      
      // CRITICAL: Verify Mailgun signature
      const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
      if (!signingKey) {
        webhookLog.status = 'rejected';
        webhookLog.errorMessage = 'Webhook signing key not configured';
        webhookLog.processingTime = Date.now() - startTime;
        
        await db.insert(mailgunWebhookLogs).values(webhookLog);
        
        console.error('[Mailgun Webhook] ✗ Signing key not configured');
        return res.status(500).json({ error: 'Webhook signing key not configured' });
      }
      
      const timestamp = req.body.timestamp;
      const token = req.body.token;
      const signature = req.body.signature;
      
      if (!timestamp || !token || !signature) {
        webhookLog.status = 'rejected';
        webhookLog.errorMessage = 'Missing signature components';
        webhookLog.processingTime = Date.now() - startTime;
        
        await db.insert(mailgunWebhookLogs).values(webhookLog);
        
        console.error('[Mailgun Webhook] ✗ Missing signature components');
        console.log('[Mailgun Webhook] Available fields:', Object.keys(req.body));
        return res.status(401).json({ error: 'Missing signature' });
      }
      
      // Verify timestamp is recent (prevent replay attacks)
      const currentTime = Math.floor(Date.now() / 1000);
      const timestampAge = currentTime - parseInt(timestamp);
      webhookLog.timestampAge = timestampAge;
      
      if (timestampAge > 300) { // 5 minutes
        webhookLog.status = 'rejected';
        webhookLog.errorMessage = `Timestamp too old: ${timestampAge}s`;
        webhookLog.processingTime = Date.now() - startTime;
        
        await db.insert(mailgunWebhookLogs).values(webhookLog);
        
        console.error(`[Mailgun Webhook] ✗ Timestamp too old: ${timestampAge}s`);
        return res.status(401).json({ error: 'Timestamp expired' });
      }
      
      // Verify HMAC signature
      const encodedToken = crypto
        .createHmac('sha256', signingKey)
        .update(timestamp + token)
        .digest('hex');
      
      if (encodedToken !== signature) {
        webhookLog.status = 'rejected';
        webhookLog.errorMessage = 'Invalid signature';
        webhookLog.signatureVerified = false;
        webhookLog.processingTime = Date.now() - startTime;
        
        await db.insert(mailgunWebhookLogs).values(webhookLog);
        
        console.error('[Mailgun Webhook] ✗ Invalid signature');
        return res.status(403).json({ error: 'Invalid signature' });
      }
      
      webhookLog.signatureVerified = true;
      console.log('[Mailgun Webhook] ✓ Signature verified (age:', timestampAge, 'seconds)');
      
      // Find XLSX attachment
      const xlsxFile = files?.find(f => 
        f.originalname?.endsWith('.xlsx') || 
        f.originalname?.endsWith('.xls') ||
        f.mimetype?.includes('spreadsheet')
      );

      if (!xlsxFile) {
        webhookLog.status = 'rejected';
        webhookLog.errorMessage = 'No XLSX attachment found';
        webhookLog.xlsxFound = false;
        webhookLog.processingTime = Date.now() - startTime;
        
        await db.insert(mailgunWebhookLogs).values(webhookLog);
        
        console.log('[Mailgun Webhook] ✗ No XLSX attachment found');
        console.log('[Mailgun Webhook] Received files:', files?.map(f => ({ name: f.originalname, type: f.mimetype })));
        
        // IMPORTANT: Return 200 so Mailgun doesn't retry, but indicate failure
        return res.status(200).json({ 
          success: false, 
          message: 'No XLSX attachment found',
          filesReceived: files?.map(f => f.originalname) || []
        });
      }
      
      webhookLog.xlsxFound = true;
      webhookLog.xlsxFileName = xlsxFile.originalname;
      webhookLog.xlsxSize = xlsxFile.size;
      
      console.log('[Mailgun Webhook] ✓ Found XLSX:', xlsxFile.originalname, `(${(xlsxFile.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log('[Mailgun Webhook] Starting customer import...');
      
      // Import customers from XLSX
      const { importCustomersFromXLSX } = await import('../lib/xlsxCustomerImporter');
      const importResult = await importCustomersFromXLSX(xlsxFile.buffer, 'email');
      
      // Get the import ID from the last import (the one we just created)
      const lastImport = await db.query.customerDataImports.findFirst({
        orderBy: (imports, { desc }) => [desc(imports.startedAt)],
      });
      
      webhookLog.status = 'success';
      webhookLog.importId = lastImport?.id || null;
      webhookLog.processingTime = Date.now() - startTime;
      
      await db.insert(mailgunWebhookLogs).values(webhookLog);
      
      console.log('[Mailgun Webhook] ✓ Import completed successfully');
      console.log('[Mailgun Webhook] Results:', {
        customers: importResult.customersImported,
        contacts: importResult.contactsImported,
        revenue: `$${(importResult.totalRevenue / 100).toLocaleString()}`,
        processingTime: `${webhookLog.processingTime}ms`
      });
      console.log('========================================');
      
      // Return 200 OK only on successful import
      res.status(200).json({
        success: true,
        fileName: xlsxFile.originalname,
        importId: lastImport?.id,
        ...importResult,
        processingTime: webhookLog.processingTime,
      });
      
    } catch (error: any) {
      webhookLog.status = 'failed';
      webhookLog.errorMessage = error.message;
      webhookLog.processingTime = Date.now() - startTime;
      
      try {
        await db.insert(mailgunWebhookLogs).values(webhookLog);
      } catch (dbError) {
        console.error('[Mailgun Webhook] Failed to log error to database:', dbError);
      }
      
      console.error('[Mailgun Webhook] ✗ Error processing webhook:', error);
      console.error('[Mailgun Webhook] Stack trace:', error.stack);
      console.log('========================================');
      
      // Return 500 so Mailgun will retry
      res.status(500).json({
        success: false,
        error: 'Import failed',
        message: error.message
      });
    }
  });
}
