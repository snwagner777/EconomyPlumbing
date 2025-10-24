import XLSX from 'xlsx';
import { db } from '../db';
import { customersXlsx, contactsXlsx, customerDataImports } from '@shared/schema';
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
    
    // Step 1: Create staging tables (drop first to ensure clean slate)
    console.log('[XLSX Import] Creating staging tables...');
    console.log('[XLSX Import] Dropping existing staging tables...');
    await tx.execute(sql.raw(`DROP TABLE IF EXISTS staging_customers`));
    console.log('[XLSX Import] Dropped staging_customers');
    await tx.execute(sql.raw(`DROP TABLE IF EXISTS staging_contacts`));
    console.log('[XLSX Import] Dropped staging_contacts');
    
    // Explicitly create staging tables to avoid LIKE issues with array types
    console.log('[XLSX Import] Creating staging_customers table...');
    await tx.execute(sql.raw(`
      CREATE TEMPORARY TABLE staging_customers (
        id integer PRIMARY KEY,
        name text NOT NULL,
        type text NOT NULL,
        email text,
        phone text,
        mobile_phone text,
        street text,
        city text,
        state text,
        zip text,
        active boolean NOT NULL DEFAULT true,
        balance text,
        job_count integer NOT NULL DEFAULT 0,
        last_service_date timestamp,
        last_service_type text,
        lifetime_value integer NOT NULL DEFAULT 0,
        customer_tags text[],
        preferred_contact_method text,
        last_synced_at timestamp NOT NULL DEFAULT NOW()
      )
    `));
    console.log('[XLSX Import] Created staging_customers');
    
    console.log('[XLSX Import] Creating staging_contacts table...');
    await tx.execute(sql.raw(`
      CREATE TEMPORARY TABLE staging_contacts (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id integer NOT NULL,
        contact_type text NOT NULL,
        value text NOT NULL,
        normalized_value text NOT NULL,
        is_primary boolean NOT NULL DEFAULT false,
        last_synced_at timestamp NOT NULL DEFAULT NOW()
      )
    `));
    console.log('[XLSX Import] Created staging_contacts');
    
    // Step 2: Parse and insert into staging tables
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

          // Convert Excel serial date to JavaScript Date
          // Excel stores dates as serial numbers (days since 1900-01-01)
          let lastServiceDate: Date | null = null;
          const rawDate = row['Last Job Completed'];
          if (rawDate) {
            if (typeof rawDate === 'number') {
              // Excel serial date: convert to milliseconds since Unix epoch
              // Formula: (excelSerial - 25569) * 86400 * 1000
              // 25569 = days between 1900-01-01 and 1970-01-01
              lastServiceDate = new Date((rawDate - 25569) * 86400 * 1000);
            } else if (typeof rawDate === 'string') {
              // String date: parse directly
              lastServiceDate = new Date(rawDate);
            }
          }

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
            lastServiceDate,
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

      // Insert into staging tables using Drizzle's parameterized inserts
      if (customerBatch.length > 0) {
        // Use parameterized INSERT with special handling for arrays
        for (const customer of customerBatch) {
          // Convert JavaScript array to PostgreSQL array literal
          const tagsArray = customer.customerTags && customer.customerTags.length > 0
            ? sql.raw(`ARRAY[${customer.customerTags.map((t: string) => `'${t.replace(/'/g, "''")}'`).join(',')}]::text[]`)
            : sql.raw(`ARRAY[]::text[]`);
          
          await tx.execute(sql`
            INSERT INTO staging_customers (
              id, name, type, email, phone, mobile_phone, street, city, state, zip,
              active, balance, job_count, last_service_date, last_service_type,
              lifetime_value, customer_tags, preferred_contact_method, last_synced_at
            ) VALUES (
              ${customer.id}, ${customer.name}, ${customer.type}, ${customer.email},
              ${customer.phone}, ${customer.mobilePhone}, ${customer.street}, ${customer.city},
              ${customer.state}, ${customer.zip}, ${customer.active}, ${customer.balance},
              ${customer.jobCount}, ${customer.lastServiceDate}, ${customer.lastServiceType},
              ${customer.lifetimeValue}, ${tagsArray}, ${customer.preferredContactMethod},
              ${customer.lastSyncedAt}
            )
          `);
        }
      }
      
      if (contactBatch.length > 0) {
        for (const contact of contactBatch) {
          await tx.execute(sql`
            INSERT INTO staging_contacts (
              customer_id, contact_type, value, normalized_value, is_primary, last_synced_at
            ) VALUES (
              ${contact.customerId}, ${contact.contactType}, ${contact.value},
              ${contact.normalizedValue}, ${contact.isPrimary}, NOW()
            )
          `);
        }
        contactsImported += contactBatch.length;
      }

      console.log(`[XLSX Import] Staged: ${imported}/${rows.length} customers (${contactsImported} contacts)`);
    }

    // Step 3: Verify staging data
    const stagedCustomerCount = await tx.execute(sql`SELECT COUNT(*) FROM staging_customers`);
    const stagedContactCount = await tx.execute(sql`SELECT COUNT(*) FROM staging_contacts`);
    
    console.log(`[XLSX Import] Verification: ${stagedCustomerCount.rows[0].count} customers, ${stagedContactCount.rows[0].count} contacts in staging`);
    
    if (Number(stagedCustomerCount.rows[0].count) === 0) {
      throw new Error('No customers were successfully staged - aborting import');
    }

    // Step 4: Atomically swap staging → production
    // CRITICAL: This is the only point where production data changes
    console.log('[XLSX Import] Swapping staging → production tables (XLSX tables)...');
    
    await tx.execute(sql`TRUNCATE TABLE contacts_xlsx CASCADE`);
    await tx.execute(sql`TRUNCATE TABLE customers_xlsx CASCADE`);
    
    await tx.execute(sql`
      INSERT INTO customers_xlsx 
      SELECT * FROM staging_customers
    `);
    
    await tx.execute(sql`
      INSERT INTO contacts_xlsx 
      SELECT * FROM staging_contacts
    `);
    
    console.log('[XLSX Import] XLSX production tables updated successfully');

    const duration = Date.now() - startTime;

    // Step 5: Record import in history
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
