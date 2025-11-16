/**
 * Customer Data Export Processor
 * 
 * Handles incoming customer data XLSX exports from ServiceTitan via Resend inbound webhook
 * 
 * ServiceTitan can email scheduled customer/contact exports in XLSX format
 * This processor can parse and sync that data to the database
 */

import * as XLSX from 'xlsx';

export interface ProcessCustomerDataOptions {
  xlsxBuffer: Buffer;
  from: string;
  subject: string;
  fileName: string;
}

/**
 * Process customer data XLSX export
 */
export async function processCustomerData(options: ProcessCustomerDataOptions): Promise<void> {
  const { xlsxBuffer, from, subject, fileName } = options;

  console.log(`[Customer Data Processor] Processing customer data export: ${fileName}`);

  try {
    // Parse XLSX
    const workbook = XLSX.read(xlsxBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`[Customer Data Processor] Parsed ${data.length} rows from ${fileName}`);

    // TODO: Process and sync customer data to database
    // For now, just log it - this can be extended based on specific needs
    // Common use cases:
    // - Sync customer tags/custom fields
    // - Update customer marketing preferences
    // - Import new customer records

    console.log(`[Customer Data Processor] Logged customer data from ${fileName}`);
  } catch (error) {
    console.error(`[Customer Data Processor] Error processing customer data ${fileName}:`, error);
    throw error;
  }
}

/**
 * Detect if email contains customer data export
 */
export function isCustomerDataExport(subject: string, fileName?: string): boolean {
  const keywords = ['customer', 'export', 'contacts', 'data export'];
  const subjectLower = subject.toLowerCase();
  const fileNameLower = fileName?.toLowerCase() || '';

  return keywords.some(keyword => 
    subjectLower.includes(keyword) || fileNameLower.includes(keyword)
  ) && (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls'));
}
