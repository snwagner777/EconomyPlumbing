/**
 * XLSX Lookup Adapter
 * 
 * Searches local customers_xlsx database
 * Fast but may be stale - use for quick lookups
 */

import { db } from '@/server/db';
import { customersXlsx } from '@shared/schema';
import { or, eq, and, sql } from 'drizzle-orm';
import { CustomerMatch, CustomerLookupResult } from './types';
import { normalizePhone, normalizeEmail } from './utils';

export class XlsxLookupAdapter {
  /**
   * Search customers_xlsx database by phone or email
   */
  async search(options: {
    phone?: string;
    email?: string;
    includeInactive?: boolean;
  }): Promise<CustomerLookupResult> {
    const { phone, email, includeInactive = false } = options;

    if (!phone && !email) {
      return { found: false, matches: [] };
    }

    console.log(`[XLSX Adapter] Searching by ${phone ? 'phone' : 'email'}: ${phone || email}`);

    const normalizedPhone = phone ? normalizePhone(phone) : '';
    const normalizedEmail = email ? normalizeEmail(email) : '';

    // Build query conditions
    const conditions = [];
    
    // Active filter (unless includeInactive is true)
    if (!includeInactive) {
      conditions.push(eq(customersXlsx.active, true));
    }

    // Search conditions (phone OR email)
    const searchConditions = [];
    if (normalizedEmail) {
      searchConditions.push(
        sql`${customersXlsx.email} ILIKE ${normalizedEmail}`
      );
    }
    if (normalizedPhone) {
      searchConditions.push(
        sql`regexp_replace(${customersXlsx.phone}, '[^0-9]', '', 'g') LIKE '%' || ${normalizedPhone} || '%'`
      );
    }

    if (searchConditions.length > 0) {
      conditions.push(or(...searchConditions));
    }

    // Execute search
    let customers;
    try {
      customers = await db
        .select()
        .from(customersXlsx)
        .where(and(...conditions));
    } catch (error: any) {
      console.error('[XLSX Adapter] Database query error:', error);
      return {
        found: false,
        matches: [],
        error: {
          type: 'database_error',
          message: `Database search failed: ${error.message}`,
          retryable: true,
        },
      };
    }

    if (customers.length === 0) {
      console.log(`[XLSX Adapter] No customers found`);
      return { found: false, matches: [] };
    }

    console.log(`[XLSX Adapter] Found ${customers.length} customer(s)`);

    // Map to standard CustomerMatch format
    const matches: CustomerMatch[] = customers.map((customer) => {
      const locations = customer.street ? [{
        id: customer.id,
        name: 'Primary Location',
        street: customer.street,
        city: customer.city || '',
        state: customer.state || '',
        zip: customer.zip || '',
        isPrimary: true,
      }] : [];

      return {
        customerId: customer.id,
        serviceTitanId: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        type: (customer.type as 'Residential' | 'Commercial') || 'Residential',
        address: customer.street ? {
          street: customer.street,
          city: customer.city || undefined,
          state: customer.state || undefined,
          zip: customer.zip || undefined,
        } : undefined,
        locations,
        customerTags: [],
        source: 'xlsx',
      };
    });

    return {
      found: true,
      matches,
    };
  }
}
