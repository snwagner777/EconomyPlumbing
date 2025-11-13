/**
 * ServiceTitan Lookup Adapter
 * 
 * Searches ServiceTitan CRM directly
 * Authoritative source of truth but slower
 */

import { serviceTitanAuth } from '@/server/lib/servicetitan/auth';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { CustomerMatch, CustomerLookupResult } from './types';
import { normalizePhone, normalizeEmail, isComplete10DigitPhone } from './utils';

const TENANT_ID = process.env.SERVICETITAN_TENANT_ID!;

interface ServiceTitanCustomerResponse {
  id: number;
  name: string;
  type: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  contacts?: Array<{
    id: number;
    type: string;
    value: string;
  }>;
}

export class ServiceTitanLookupAdapter {
  /**
   * Search ServiceTitan directly by phone or email
   */
  async search(options: {
    phone?: string;
    email?: string;
    includeInactive?: boolean;
    createPlaceholderIfMissing?: boolean;
  }): Promise<CustomerLookupResult> {
    const { phone, email, includeInactive = false, createPlaceholderIfMissing = false } = options;

    if (!phone && !email) {
      return { found: false, matches: [] };
    }

    console.log(`[ServiceTitan Adapter] Searching by ${phone ? 'phone' : 'email'}: ${phone || email}`);

    const normalizedPhone = phone ? normalizePhone(phone) : '';
    const normalizedEmail = email ? normalizeEmail(email) : '';

    let allMatches: ServiceTitanCustomerResponse[] = [];
    let phoneSearchError: any = null;
    let emailSearchError: any = null;

    // Search by phone
    if (normalizedPhone) {
      try {
        const phoneSearch = await serviceTitanAuth.makeRequest<{ data: ServiceTitanCustomerResponse[] }>(
          `crm/v2/tenant/${TENANT_ID}/customers?phone=${encodeURIComponent(normalizedPhone)}&active=${!includeInactive}`
        );
        allMatches = phoneSearch.data || [];
        console.log(`[ServiceTitan Adapter] Phone search found ${allMatches.length} customer(s)`);
      } catch (error: any) {
        console.error('[ServiceTitan Adapter] Phone search error:', error);
        phoneSearchError = error;
        // Don't return yet - try email if available
      }
    }

    // Search by email (if no phone matches OR phone search failed)
    if (allMatches.length === 0 && normalizedEmail) {
      try {
        const emailSearch = await serviceTitanAuth.makeRequest<{ data: ServiceTitanCustomerResponse[] }>(
          `crm/v2/tenant/${TENANT_ID}/customers?email=${encodeURIComponent(normalizedEmail)}&active=${!includeInactive}`
        );
        allMatches = emailSearch.data || [];
        console.log(`[ServiceTitan Adapter] Email search found ${allMatches.length} customer(s)`);
      } catch (error: any) {
        console.error('[ServiceTitan Adapter] Email search error:', error);
        emailSearchError = error;
      }
    }

    // If both searches failed, return structured error
    if (phoneSearchError && emailSearchError) {
      // Compute retryable as OR of both failures (if either is retryable, whole operation is retryable)
      const phoneRetryable = phoneSearchError.response?.status >= 500 || phoneSearchError.code === 'ECONNREFUSED';
      const emailRetryable = emailSearchError.response?.status >= 500 || emailSearchError.code === 'ECONNREFUSED';
      
      return {
        found: false,
        matches: [],
        error: {
          type: 'servicetitan_error',
          message: `ServiceTitan search failed (phone: ${phoneSearchError.message}, email: ${emailSearchError.message})`,
          retryable: phoneRetryable || emailRetryable,
        },
      };
    }

    // If only one search type was attempted and it failed, return that error
    if (phoneSearchError && !normalizedEmail) {
      return {
        found: false,
        matches: [],
        error: {
          type: 'servicetitan_error',
          message: `ServiceTitan phone search failed: ${phoneSearchError.message}`,
          retryable: phoneSearchError.response?.status >= 500 || phoneSearchError.code === 'ECONNREFUSED',
        },
      };
    }

    if (emailSearchError && !normalizedPhone) {
      return {
        found: false,
        matches: [],
        error: {
          type: 'servicetitan_error',
          message: `ServiceTitan email search failed: ${emailSearchError.message}`,
          retryable: emailSearchError.response?.status >= 500 || emailSearchError.code === 'ECONNREFUSED',
        },
      };
    }

    // No matches found - create placeholder if requested
    if (allMatches.length === 0) {
      if (createPlaceholderIfMissing) {
        // CRITICAL: Only create placeholder for complete, valid phone numbers
        // Require phone AND it must be complete 10 digits
        if (!phone || !isComplete10DigitPhone(phone)) {
          console.warn(`[ServiceTitan Adapter] Refusing to create placeholder - missing or incomplete phone: ${phone || 'none'}`);
          return {
            found: false,
            matches: [],
            error: {
              type: 'validation',
              message: 'Cannot create customer without complete 10-digit phone number',
              retryable: false,
            },
          };
        }

        console.log(`[ServiceTitan Adapter] Creating placeholder customer`);
        try {
          // Use existing ensureCustomer which handles all the logic correctly
          const newCustomer = await serviceTitanCRM.ensureCustomer({
            name: 'Web Visitor',
            phone: normalizedPhone || '0000000000',
            email: normalizedEmail,
            customerType: 'Residential',
            address: {
              street: 'To be provided',
              city: 'Austin',
              state: 'TX',
              zip: '78701',
            },
          });

          return {
            found: true,
            matches: [{
              customerId: newCustomer.id,
              serviceTitanId: newCustomer.id,
              name: 'Web Visitor',
              email: normalizedEmail || null,
              phone: normalizedPhone || null,
              type: 'Residential',
              address: {
                street: 'To be provided',
                city: 'Austin',
                state: 'TX',
                zip: '78701',
              },
              locations: [],
              customerTags: [],
              source: 'servicetitan',
            }],
            isPlaceholder: true,
          };
        } catch (error: any) {
          console.error('[ServiceTitan Adapter] Failed to create placeholder:', error);
          return {
            found: false,
            matches: [],
            error: {
              type: 'servicetitan_error',
              message: `Failed to create customer: ${error.message}`,
              retryable: false,
            },
          };
        }
      }

      return { found: false, matches: [] };
    }

    // Map ServiceTitan customers to standard format
    const matches: CustomerMatch[] = allMatches.map((customer) => {
      // ALWAYS prefer ServiceTitan's canonical contact data over user's search input
      // Extract phone from contacts (authoritative source)
      let customerPhone = '';
      if (customer.contacts) {
        const phoneContact = customer.contacts.find((c) =>
          c.type === 'MobilePhone' || c.type === 'Phone'
        );
        customerPhone = phoneContact ? normalizePhone(phoneContact.value) : '';
      }
      // Fallback to search input only if ServiceTitan has no phone
      if (!customerPhone && normalizedPhone) {
        customerPhone = normalizedPhone;
      }

      // Extract email from contacts (authoritative source)
      let customerEmail = '';
      if (customer.contacts) {
        const emailContact = customer.contacts.find((c) => c.type === 'Email');
        customerEmail = emailContact ? emailContact.value : '';
      }
      // Fallback to search input only if ServiceTitan has no email
      if (!customerEmail && normalizedEmail) {
        customerEmail = normalizedEmail;
      }

      return {
        customerId: customer.id,
        serviceTitanId: customer.id,
        name: customer.name,
        email: customerEmail || null,
        phone: customerPhone || null,
        type: (customer.type as 'Residential' | 'Commercial') || 'Residential',
        address: customer.address ? {
          street: customer.address.street,
          city: customer.address.city,
          state: customer.address.state,
          zip: customer.address.zip,
        } : undefined,
        locations: [], // Locations fetched separately if needed
        customerTags: [],
        source: 'servicetitan',
      };
    });

    return {
      found: true,
      matches,
    };
  }
}
