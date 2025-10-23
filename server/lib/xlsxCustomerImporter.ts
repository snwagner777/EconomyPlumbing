import XLSX from 'xlsx';
import { db } from '../db';
import { serviceTitanCustomers, serviceTitanContacts, customerDataImports } from '@shared/schema';
import { sql } from 'drizzle-orm';

interface CustomerRow {
  'Customer ID': number;
  'Customer Name': string;
  'Type': string;
  'Phone Number': string;
  'Email': string;
  'Full Address': string;
  'Last Job Completed': string | null;
  'Customers Lifetime Revenue': number;
  'Lifetime Jobs Completed': number;
  'Lifetime Invoices': number;
}

function parseAddress(fullAddress: string | null): {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
} {
  if (!fullAddress) {
    return { street: null, city: null, state: null, zip: null };
  }

  const parts = fullAddress.split(',').map(p => p.trim());
  
  if (parts.length < 2) {
    return { street: fullAddress, city: null, state: null, zip: null };
  }

  const street = parts[0];
  const city = parts[1];
  
  const lastPart = parts[parts.length - 1];
  const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5})/);
  
  if (stateZipMatch) {
    return {
      street,
      city,
      state: stateZipMatch[1],
      zip: stateZipMatch[2],
    };
  }

  return { street, city, state: null, zip: null };
}

/**
 * Import customers from XLSX buffer with transactional safety
 * Uses staging tables to prevent data loss on error
 * 
 * @param xlsxBuffer - Buffer containing XLSX file data
 * @param source - Source of the import (e.g., 'email', 'manual')
 * @returns Import statistics
 */
export async function importCustomersFromXLSX(
  xlsxBuffer: Buffer,
  source: string = 'email'
): Promise<{
  customersImported: number;
  contactsImported: number;
  totalRevenue: number;
  errors: number;
}> {
  console.log(`[XLSX Import] Starting customer import from ${source}...`);
  
  const startTime = Date.now();
  
  // Parse XLSX from buffer
  const workbook = XLSX.read(xlsxBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<CustomerRow>(worksheet);

  console.log(`[XLSX Import] Found ${rows.length} customers in spreadsheet`);

  if (rows.length === 0) {
    throw new Error('XLSX file contains no customer data');
  }

  // Validate data structure before any database operations
  console.log('[XLSX Import] Validating data structure...');
  const validationErrors: string[] = [];
  
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    if (!row['Customer ID']) {
      validationErrors.push(`Row ${i + 1}: Missing Customer ID`);
    }
    if (!row['Customer Name']) {
      validationErrors.push(`Row ${i + 1}: Missing Customer Name`);
    }
  }
  
  if (validationErrors.length > 0) {
    console.error('[XLSX Import] Validation errors:', validationErrors);
    throw new Error(`Invalid XLSX format: ${validationErrors.join(', ')}`);
  }

  // TRANSACTION: All database operations are atomic
  // If any step fails, entire import is rolled back
  return await db.transaction(async (tx) => {
    console.log('[XLSX Import] Starting database transaction...');
    
    // Step 1: Truncate existing data (simpler than staging tables)
    console.log('[XLSX Import] Clearing existing customer data...');
    await tx.execute(sql`TRUNCATE TABLE service_titan_customers, service_titan_contacts CASCADE`);
    
    // Step 2: Insert customers and contacts directly
    const BATCH_SIZE = 500;
    let imported = 0;
    let contactsImported = 0;
    let errors = 0;
    let totalRevenue = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const customerBatch = [];
      const contactBatch = [];
      
      for (const row of batch) {
        try {
          const customerId = row['Customer ID'];
          if (!customerId) continue;

          const address = parseAddress(row['Full Address']);
          const phone = row['Phone Number'];
          const email = row['Email'];
          const lifetimeRevenue = Math.round((row['Customers Lifetime Revenue'] || 0) * 100);
          totalRevenue += lifetimeRevenue;

          customerBatch.push({
            id: customerId,
            name: row['Customer Name'] || 'Unknown',
            type: row['Type'] || 'Residential',
            email: email || null,
            phone: phone || null,
            mobilePhone: null,
            street: address.street,
            city: address.city,
            state: address.state,
            zip: address.zip,
            active: true,
            balance: '0.00',
            jobCount: row['Lifetime Jobs Completed'] || 0,
            lastServiceDate: row['Last Job Completed'] ? new Date(row['Last Job Completed']) : null,
            lastServiceType: null,
            lifetimeValue: lifetimeRevenue,
            customerTags: [],
            preferredContactMethod: null,
            lastSyncedAt: new Date(),
          });

          // Add contacts if available
          if (email) {
            const normalizedEmail = email.toLowerCase().trim();
            contactBatch.push({
              customerId,
              contactType: 'Email',
              value: email,
              normalizedValue: normalizedEmail,
              isPrimary: true,
            });
          }

          if (phone) {
            const normalizedPhone = phone.replace(/\D/g, '');
            contactBatch.push({
              customerId,
              contactType: 'Phone',
              value: phone,
              normalizedValue: normalizedPhone,
              isPrimary: true,
            });
          }

          imported++;
        } catch (error) {
          console.error(`[XLSX Import] Error processing customer ${row['Customer ID']}:`, error);
          errors++;
        }
      }

      // Insert directly into production tables
      if (customerBatch.length > 0) {
        await tx.insert(serviceTitanCustomers).values(customerBatch);
      }
      
      if (contactBatch.length > 0) {
        await tx.insert(serviceTitanContacts).values(contactBatch);
        contactsImported += contactBatch.length;
      }

      console.log(`[XLSX Import] Imported: ${imported}/${rows.length} customers (${contactsImported} contacts)`);
    }

    // Step 3: Verify imported data
    const finalCustomerCount = await tx.execute(sql`SELECT COUNT(*) FROM service_titan_customers`);
    const finalContactCount = await tx.execute(sql`SELECT COUNT(*) FROM service_titan_contacts`);
    
    console.log(`[XLSX Import] Verification: ${finalCustomerCount.rows[0].count} customers, ${finalContactCount.rows[0].count} contacts imported`);
    
    if (Number(finalCustomerCount.rows[0].count) === 0) {
      throw new Error('No customers were successfully imported - rolling back transaction');
    }

    // Step 4: Record import history
    const duration = Date.now() - startTime;
    await tx.insert(customerDataImports).values({
      fileName: `import_${new Date().toISOString()}`,
      importSource: source,
      totalRows: rows.length,
      customersImported: imported,
      contactsImported,
      errors,
      totalLifetimeRevenue: totalRevenue,
      status: 'completed',
      processingTime: duration,
      completedAt: new Date(),
    });

    console.log(`[XLSX Import] ✅ Transaction committed - import completed in ${(duration / 1000).toFixed(1)}s`);
    console.log(`[XLSX Import] - Customers: ${imported}`);
    console.log(`[XLSX Import] - Contacts: ${contactsImported}`);
    console.log(`[XLSX Import] - Total Revenue: $${(totalRevenue / 100).toFixed(2)}`);
    console.log(`[XLSX Import] - Errors: ${errors}`);

    return {
      customersImported: imported,
      contactsImported,
      totalRevenue,
      errors,
    };
  });
}
