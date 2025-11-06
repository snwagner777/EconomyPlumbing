/**
 * One-time script to import customer XLSX file directly
 */
import * as xlsx from 'xlsx';
import { storage } from '../server/storage';
import * as fs from 'fs';
import * as path from 'path';

async function importCustomerXlsx() {
  const filePath = path.join(process.cwd(), 'attached_assets/Customer List_Dated 11_03_25 - 11_06_25_1762439257635.xlsx');
  
  console.log('[Import] Reading XLSX file:', filePath);
  
  if (!fs.existsSync(filePath)) {
    throw new Error('XLSX file not found');
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet);

  console.log('[Import] Found', rows.length, 'rows in XLSX');

  // Parse and validate all rows first (before any database operations)
  const customersToImport: any[] = [];
  let skippedCount = 0;

  for (const row of rows as any[]) {
    // EXACT SAME MAPPING as Mailgun webhook (app/api/webhooks/mailgun/customer-data/route.ts)
    const customerData: any = {
      id: row['Customer ID'] ? parseInt(row['Customer ID'].toString()) : null,
      name: row['Customer Name'] || 'Unknown',
      type: row['Customer Type'] || 'Residential',
      email: row['Email'] || null,
      phone: row['Phone']?.toString() || null,
      street: row['Address'] || null,
      city: row['City'] || null,
      state: row['State'] || null,
      zip: row['ZIP']?.toString() || null,
      active: row['Active'] !== false && row['Active'] !== 'false' && row['Active'] !== 'FALSE' && row['Active'] !== 'False',
    };

    // Skip rows without required fields (id and at least phone or email)
    if (!customerData.id || (!customerData.phone && !customerData.email)) {
      skippedCount++;
      continue;
    }

    customersToImport.push(customerData);
  }

  console.log('[Import] Parsed', customersToImport.length, 'valid customers, skipped', skippedCount);

  // FULL REPLACE with transaction safety: All-or-nothing import
  console.log('[Import] Starting transactional full replace import...');
  const importedCount = await storage.replaceAllCustomersXlsx(customersToImport);

  console.log('[Import] Full replace import complete:', {
    imported: importedCount,
    skipped: skippedCount,
    total: rows.length,
  });

  return {
    imported: importedCount,
    skipped: skippedCount,
    total: rows.length,
  };
}

// Run the import
importCustomerXlsx()
  .then((result) => {
    console.log('[Import] SUCCESS:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Import] FAILED:', error);
    process.exit(1);
  });
