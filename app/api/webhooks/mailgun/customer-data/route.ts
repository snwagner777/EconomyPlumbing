/**
 * Mailgun Webhook Handler - Customer Data XLSX Import
 * 
 * Receives emails with XLSX attachments containing ServiceTitan customer data
 * Replaces direct API integration with hourly email-based imports
 * 
 * CRITICAL: Must handle multipart/form-data with Busboy
 */

import { NextRequest, NextResponse } from 'next/server';
import Busboy from 'busboy';
import { Readable } from 'stream';
import { createHmac } from 'crypto';
import * as xlsx from 'xlsx';
import { storage } from '@/server/storage';

interface BusboyFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type');
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Get boundary from content-type header
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return NextResponse.json({ error: 'No boundary found' }, { status: 400 });
    }

    // Convert Request to buffer FIRST before piping to Busboy
    const buffer = await req.arrayBuffer();

    // Parse multipart data with Busboy
    const { fields, files } = await new Promise<{
      fields: Record<string, string>;
      files: BusboyFile[];
    }>((resolve, reject) => {
      const busboy = Busboy({
        headers: {
          'content-type': contentType,
        },
      });

      const fields: Record<string, string> = {};
      const files: BusboyFile[] = [];

      busboy.on('field', (name, value) => {
        fields[name] = value;
      });

      busboy.on('file', (name, file, info) => {
        const chunks: Buffer[] = [];
        file.on('data', (chunk) => chunks.push(chunk));
        file.on('end', () => {
          files.push({
            buffer: Buffer.concat(chunks),
            filename: info.filename,
            mimetype: info.mimeType,
          });
        });
      });

      busboy.on('finish', () => resolve({ fields, files }));
      busboy.on('error', (err) => reject(err));
      
      // Pipe buffer to busboy as a readable stream
      Readable.from(Buffer.from(buffer)).pipe(busboy);
    });

    // Verify Mailgun signature
    const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    if (!signingKey) {
      return NextResponse.json({ error: 'Signing key not configured' }, { status: 500 });
    }

    const timestamp = fields.timestamp;
    const token = fields.token;
    const signature = fields.signature;

    if (!timestamp || !token || !signature) {
      return NextResponse.json({ error: 'Missing signature components' }, { status: 401 });
    }

    // Verify timestamp (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    const timestampAge = currentTime - parseInt(timestamp);

    if (timestampAge > 300) { // 5 minutes
      return NextResponse.json({ error: 'Timestamp too old' }, { status: 401 });
    }

    // Verify signature
    const computedSignature = createHmac('sha256', signingKey)
      .update(timestamp + token)
      .digest('hex');

    if (computedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Find XLSX attachment
    const xlsxFile = files.find(f => 
      f.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    if (!xlsxFile) {
      return NextResponse.json({ error: 'No XLSX attachment found' }, { status: 400 });
    }

    console.log('[Mailgun] Processing XLSX file:', xlsxFile.filename);

    // Process XLSX file
    const workbook = xlsx.read(xlsxFile.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    console.log('[Mailgun] Found', rows.length, 'rows in XLSX');

    // Parse and validate all rows first (before any database operations)
    const customersToImport: any[] = [];
    let skippedCount = 0;

    let customersWithPhone = 0;
    let customersWithEmail = 0;
    let customersWithBoth = 0;

    for (const row of rows as any[]) {
      // Map XLSX columns to database fields matching schema exactly
      // Note: XLSX uses "Phone Number" (with space) not "Phone"
      const customerData: any = {
        id: row['Customer ID'] ? parseInt(row['Customer ID'].toString()) : null,
        name: row['Customer Name'] || 'Unknown',
        type: row['Type'] || 'Residential',
        email: row['Email'] || null,
        phone: row['Phone Number']?.toString() || null, // "Phone Number" with space!
        street: null, // Address data fetched from ServiceTitan API when needed
        city: null,
        state: null,
        zip: null,
        active: row['Active'] !== false && row['Active'] !== 'false' && row['Active'] !== 'FALSE' && row['Active'] !== 'False',
      };

      // Skip rows without required fields (id and at least phone or email)
      if (!customerData.id || (!customerData.phone && !customerData.email)) {
        skippedCount++;
        continue;
      }

      // Track contact method statistics
      if (customerData.phone && customerData.email) customersWithBoth++;
      else if (customerData.phone) customersWithPhone++;
      else if (customerData.email) customersWithEmail++;

      customersToImport.push(customerData);
    }

    console.log('[Mailgun] Parsed customers breakdown:', {
      valid: customersToImport.length,
      skipped: skippedCount,
      total: rows.length,
      withBothPhoneEmail: customersWithBoth,
      withPhoneOnly: customersWithPhone,
      withEmailOnly: customersWithEmail,
    });

    // FULL REPLACE with transaction safety: All-or-nothing import
    console.log('[Mailgun] Starting transactional full replace import...');
    const importedCount = await storage.replaceAllCustomersXlsx(customersToImport);

    console.log('[Mailgun] Full replace import complete:', {
      imported: importedCount,
      skipped: skippedCount,
      total: rows.length,
    });

    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      total: rows.length,
    });
  } catch (error) {
    console.error('[Mailgun] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
