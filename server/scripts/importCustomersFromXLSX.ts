import XLSX from 'xlsx';
import { db } from '../db';
import { serviceTitanCustomers, serviceTitanContacts } from '@shared/schema';
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

  // Format: "1422 Dove Hill Drive, Cedar Park, TX 78613 USA"
  // or: "1901 Resaca Blvd., Austin, TX 78738"
  const parts = fullAddress.split(',').map(p => p.trim());
  
  if (parts.length < 2) {
    return { street: fullAddress, city: null, state: null, zip: null };
  }

  const street = parts[0];
  const city = parts[1];
  
  // Last part contains state, zip, and possibly country
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

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
}

function normalizeEmail(email: string | null): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

async function importCustomers() {
  console.log('[XLSX Import] Starting customer import...');
  
  // Read XLSX file
  const workbook = XLSX.readFile('attached_assets/Customer List_Dated 10_01_12 - 10_23_25-3_1761254397484.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<CustomerRow>(worksheet);

  console.log(`[XLSX Import] Found ${rows.length} customers to import`);

  // Clear existing data
  console.log('[XLSX Import] Clearing existing customer and contact data...');
  await db.delete(serviceTitanContacts);
  await db.delete(serviceTitanCustomers);
  console.log('[XLSX Import] Existing data cleared');

  let imported = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const customerId = row['Customer ID'];
      if (!customerId) {
        console.warn('[XLSX Import] Skipping row with no Customer ID');
        continue;
      }

      const address = parseAddress(row['Full Address']);
      const phone = row['Phone Number'];
      const email = row['Email'];
      
      // Convert lifetime revenue from dollars to cents
      const lifetimeRevenue = Math.round((row['Customers Lifetime Revenue'] || 0) * 100);

      // Insert customer
      await db.insert(serviceTitanCustomers).values({
        id: customerId,
        name: row['Customer Name'] || 'Unknown',
        type: row['Type'] || 'Residential',
        email: email || null,
        phone: phone || null,
        mobilePhone: null, // Will be populated from contacts if available
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

      // Insert contacts (phone and email)
      const contacts = [];
      
      if (phone) {
        contacts.push({
          customerId: customerId,
          contactType: 'Phone',
          value: phone,
          normalizedValue: normalizePhone(phone) || phone,
          isPrimary: true,
        });
      }

      if (email) {
        contacts.push({
          customerId: customerId,
          contactType: 'Email',
          value: email,
          normalizedValue: normalizeEmail(email) || email,
          isPrimary: true,
        });
      }

      if (contacts.length > 0) {
        await db.insert(serviceTitanContacts).values(contacts);
      }

      imported++;

      if (imported % 1000 === 0) {
        console.log(`[XLSX Import] Progress: ${imported}/${rows.length} customers imported`);
      }

    } catch (error: any) {
      errors++;
      console.error(`[XLSX Import] Error importing customer ${row['Customer ID']}:`, error.message);
    }
  }

  console.log('[XLSX Import] Import complete!');
  console.log(`[XLSX Import] Successfully imported: ${imported} customers`);
  console.log(`[XLSX Import] Errors: ${errors}`);
}

// Run the import
importCustomers()
  .then(() => {
    console.log('[XLSX Import] Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[XLSX Import] Script failed:', error);
    process.exit(1);
  });
