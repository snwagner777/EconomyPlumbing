import type { InsertServiceTitanMembership, InsertServiceTitanCustomer, InsertServiceTitanContact } from "@shared/schema";
import { db } from "@db";

interface ServiceTitanConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  appKey: string;
}

interface ServiceTitanCustomer {
  id: number;
  name?: string;
  email?: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface ServiceTitanMembership {
  id: number;
  customerId: number;
  membershipTypeId: number;
  status: string;
}

interface ServiceTitanInvoice {
  id: number;
  customerId: number;
  total: number;
  status: string;
}

class ServiceTitanAPI {
  private config: ServiceTitanConfig;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: ServiceTitanConfig) {
    this.config = config;
    this.baseUrl = `https://api.servicetitan.io/crm/v2/tenant/${config.tenantId}`;
  }

  /**
   * Authenticate with ServiceTitan OAuth 2.0
   */
  private async authenticate(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return; // Token still valid
    }

    const tokenUrl = 'https://auth.servicetitan.io/connect/token';
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min before expiry
    } catch (error) {
      console.error('[ServiceTitan] Authentication error:', error);
      throw error;
    }
  }

  /**
   * Make authenticated API request
   * @param endpoint - Either a relative endpoint (e.g., "/customers") or a full URL
   * @param options - Fetch options
   * @param useFullUrl - If true, endpoint is treated as a full URL instead of appending to baseUrl
   */
  private async request<T>(endpoint: string, options: RequestInit = {}, useFullUrl: boolean = false): Promise<T> {
    await this.authenticate();

    const url = useFullUrl ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'ST-App-Key': this.config.appKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    console.log('[ServiceTitan] API Request:', {
      url,
      method: options.method || 'GET',
      hasToken: !!this.accessToken,
      hasAppKey: !!this.config.appKey
    });

    try {
      const response = await fetch(url, { ...options, headers });

      console.log('[ServiceTitan] API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ServiceTitan] API Error Response:', errorText);
        throw new Error(`ServiceTitan API error: ${response.status} - ${errorText}`);
      }

      // Read the response body (ServiceTitan uses chunked encoding, so no content-length header)
      const responseText = await response.text();
      
      // Handle empty responses
      if (!responseText || responseText.trim() === '') {
        console.log('[ServiceTitan] Empty response body');
        return {} as T;
      }

      console.log('[ServiceTitan] Raw response text (first 1000 chars):', responseText.substring(0, 1000));
      
      try {
        const jsonData = JSON.parse(responseText);
        console.log('[ServiceTitan] Parsed JSON keys:', Object.keys(jsonData));
        console.log('[ServiceTitan] Has data property:', 'data' in jsonData);
        console.log('[ServiceTitan] Data length:', Array.isArray(jsonData?.data) ? jsonData.data.length : 'not an array');
        
        return jsonData;
      } catch (parseError) {
        console.error('[ServiceTitan] JSON parse error:', parseError);
        console.error('[ServiceTitan] Response text was:', responseText);
        throw new Error(`Failed to parse ServiceTitan response: ${parseError}`);
      }
    } catch (error) {
      console.error('[ServiceTitan] API request error:', error);
      throw error;
    }
  }

  /**
   * Normalize phone number to digits only for comparison
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Remove leading 1 for US numbers
    if (digits.length === 11 && digits.startsWith('1')) {
      return digits.substring(1);
    }
    return digits;
  }

  /**
   * Search for customer by email or phone (trying multiple approaches)
   */
  async searchCustomer(email: string, phone: string): Promise<ServiceTitanCustomer | null> {
    try {
      console.log(`[ServiceTitan] Searching for customer - email: "${email}", phone: "${phone}"`);
      
      let customerId: number | null = null;

      // Strategy 1: Try email search first if provided (most reliable)
      if (email && email.trim()) {
        console.log('[ServiceTitan] Strategy 1: Searching by email...');
        
        try {
          const emailResults = await this.request<{ data: ServiceTitanCustomer[] }>(
            `/customers?email=${encodeURIComponent(email.trim())}`
          );

          if (emailResults.data && emailResults.data.length > 0) {
            console.log(`[ServiceTitan] Found customer by email: ${emailResults.data[0].id}`);
            return emailResults.data[0];
          }
          console.log('[ServiceTitan] No customer found by email');
        } catch (error: any) {
          console.error('[ServiceTitan] Email search error:', error.message);
        }
      }

      // Strategy 2: Try Contacts Search API for phone (if available)
      if (!customerId && phone && phone.trim()) {
        console.log('[ServiceTitan] Strategy 2: Trying Contacts Search API for phone...');
        
        const normalizedPhone = this.normalizePhone(phone);
        console.log(`[ServiceTitan] Normalized phone: "${normalizedPhone}"`);
        
        try {
          const contactsSearchUrl = `https://api.servicetitan.io/crm/v2/tenant/${this.config.tenantId}/contacts/search`;
          const searchResults = await this.request<{ data: any[] }>(
            contactsSearchUrl,
            {
              method: 'POST',
              body: JSON.stringify({
                value: normalizedPhone,
                page: 1,
                pageSize: 10
              })
            },
            true
          );

          if (searchResults.data && searchResults.data.length > 0) {
            customerId = searchResults.data[0].customerId;
            console.log(`[ServiceTitan] Contacts Search found customerId: ${customerId}`);
          }
        } catch (error: any) {
          console.log('[ServiceTitan] Contacts Search API not available, trying alternative methods...');
        }
      }

      // Strategy 3: Optimized pagination search (check first 250 customers in 5 pages)
      if (!customerId && phone && phone.trim()) {
        console.log('[ServiceTitan] Strategy 3: Fast pagination search (250 customers max)...');
        
        const normalizedPhone = this.normalizePhone(phone);
        const MAX_PAGES = 5; // Only check 5 pages (250 customers) for speed
        const PAGE_SIZE = 50;
        const BATCH_SIZE = 10; // Check 10 customers at a time
        
        for (let page = 1; page <= MAX_PAGES; page++) {
          console.log(`[ServiceTitan] Checking page ${page}/${MAX_PAGES}...`);
          
          const pageResults = await this.request<{ data: ServiceTitanCustomer[], hasMore?: boolean }>(
            `/customers?page=${page}&pageSize=${PAGE_SIZE}`
          );
          
          if (!pageResults.data || pageResults.data.length === 0) {
            break;
          }

          // Check customers in batches
          for (let i = 0; i < pageResults.data.length; i += BATCH_SIZE) {
            const batch = pageResults.data.slice(i, i + BATCH_SIZE);
            
            const results = await Promise.allSettled(
              batch.map(async (customer) => {
                try {
                  const contacts = await this.getCustomerContacts(customer.id);
                  
                  for (const contact of contacts) {
                    const phoneValue = contact.value || contact.phoneSettings?.phoneNumber;
                    if (phoneValue && (contact.type === 'Phone' || contact.type === 'MobilePhone')) {
                      if (this.normalizePhone(phoneValue) === normalizedPhone) {
                        console.log(`[ServiceTitan] MATCH FOUND! Customer ${customer.id} (${customer.name})`);
                        return customer;
                      }
                    }
                  }
                  return null;
                } catch (error) {
                  return null;
                }
              })
            );
            
            // Check for match
            for (const result of results) {
              if (result.status === 'fulfilled' && result.value) {
                return result.value;
              }
            }
          }
          
          // Stop if no more pages
          if (pageResults.hasMore === false || pageResults.data.length < PAGE_SIZE) {
            break;
          }
        }
        
        console.log(`[ServiceTitan] No match found in first ${MAX_PAGES * PAGE_SIZE} customers`);
      }

      // If we found a customer ID from Contacts Search, fetch full details
      if (customerId) {
        console.log(`[ServiceTitan] Fetching customer details for ID: ${customerId}`);
        const customer = await this.request<ServiceTitanCustomer>(`/customers/${customerId}`);
        return customer;
      }

      console.log('[ServiceTitan] Customer not found by any method');
      return null;
    } catch (error: any) {
      console.error('[ServiceTitan] Search customer error:', error.message || error);
      throw error;
    }
  }

  /**
   * Create new customer (residential or commercial)
   */
  async createCustomer(data: {
    type: 'residential' | 'commercial';
    name?: string;
    companyName?: string;
    contactName?: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  }): Promise<ServiceTitanCustomer> {
    const address = {
      street: data.street,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: 'USA',
    };

    // Create contacts array for customer
    const customerContacts = [
      { type: 'Phone', value: data.phone, isPrimary: true },
      { type: 'Email', value: data.email, isPrimary: true }
    ];

    // Create location contacts array
    const locationContacts = [
      { type: 'Phone', value: data.phone, isPrimary: true },
      { type: 'Email', value: data.email, isPrimary: true }
    ];

    // Build the request payload according to ServiceTitan API v2 format
    const customerData = data.type === 'residential' 
      ? {
          request: {
            type: 'Residential',
            name: data.name,
            contacts: customerContacts,
            locations: [{
              name: 'Primary Residence',
              address: address,
              contacts: locationContacts
            }]
          }
        }
      : {
          request: {
            type: 'Commercial',
            companyName: data.companyName,
            contacts: customerContacts,
            locations: [{
              name: data.companyName || 'Primary Location',
              address: address,
              contacts: locationContacts
            }]
          }
        };

    try {
      const result = await this.request<{ data: ServiceTitanCustomer }>(
        '/customers',
        {
          method: 'POST',
          body: JSON.stringify(customerData),
        }
      );

      return result.data;
    } catch (error) {
      console.error('[ServiceTitan] Create customer error:', error);
      throw error;
    }
  }

  /**
   * Create invoice with membership pricebook item
   * This creates the membership and activates it for the customer
   */
  async createMembershipInvoice(
    customerId: number, 
    membershipTypeId: number,
    amount: number
  ): Promise<ServiceTitanInvoice> {
    try {
      const invoiceData = {
        customerId,
        items: [{
          skuId: membershipTypeId, // The membership pricebook item
          quantity: 1,
          price: amount,
        }],
        // Add other required invoice fields
      };

      const result = await this.request<{ data: ServiceTitanInvoice }>(
        '/accounting/v2/invoices',
        {
          method: 'POST',
          body: JSON.stringify(invoiceData),
        }
      );

      return result.data;
    } catch (error) {
      console.error('[ServiceTitan] Create membership invoice error:', error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(invoiceId: number, amount: number, paymentMethod: string = 'Credit Card'): Promise<void> {
    try {
      await this.request(
        `/invoices/${invoiceId}/payments`,
        {
          method: 'POST',
          body: JSON.stringify({
            amount,
            paymentMethod,
            status: 'Paid',
          }),
        }
      );
    } catch (error) {
      console.error('[ServiceTitan] Mark invoice paid error:', error);
      throw error;
    }
  }

  /**
   * Complete membership purchase workflow
   * 1. Search for customer
   * 2. Create customer if not found
   * 3. Create invoice with membership item (activates membership)
   * 4. Mark invoice as paid
   */
  async processMembershipPurchase(
    purchaseData: InsertServiceTitanMembership
  ): Promise<{
    customerId: number;
    membershipId: number;
    invoiceId: number;
  }> {
    try {
      // Validate membershipTypeId
      if (!purchaseData.serviceTitanMembershipTypeId) {
        throw new Error('ServiceTitan membership type ID is required but missing. Please configure the product with a valid ServiceTitan membership type ID.');
      }
      
      const membershipTypeId = parseInt(purchaseData.serviceTitanMembershipTypeId);
      if (isNaN(membershipTypeId)) {
        throw new Error(`Invalid ServiceTitan membership type ID: "${purchaseData.serviceTitanMembershipTypeId}". Must be a numeric ID.`);
      }
      
      // Step 1: Search for existing customer
      let customer = await this.searchCustomer(purchaseData.email, purchaseData.phone);

      // Step 2: Create customer if not found
      if (!customer) {
        console.log('[ServiceTitan] Customer not found, creating new customer...');
        customer = await this.createCustomer({
          type: purchaseData.customerType as 'residential' | 'commercial',
          name: purchaseData.customerName || undefined,
          companyName: purchaseData.companyName || undefined,
          contactName: purchaseData.contactPersonName || undefined,
          email: purchaseData.email,
          phone: purchaseData.phone,
          street: purchaseData.street,
          city: purchaseData.city,
          state: purchaseData.state,
          zip: purchaseData.zip,
        });
        console.log(`[ServiceTitan] Created customer with ID: ${customer.id}`);
      } else {
        console.log(`[ServiceTitan] Found existing customer with ID: ${customer.id}`);
      }

      // Step 3: Create invoice with membership pricebook item
      // This creates AND activates the membership
      console.log('[ServiceTitan] Creating membership invoice...');
      const invoice = await this.createMembershipInvoice(
        customer.id, 
        membershipTypeId,
        purchaseData.amount / 100 // Convert cents to dollars
      );
      console.log(`[ServiceTitan] Created invoice with ID: ${invoice.id}`);

      // Step 4: Mark invoice as paid
      console.log('[ServiceTitan] Marking invoice as paid...');
      await this.markInvoicePaid(invoice.id, purchaseData.amount / 100); // Convert cents to dollars
      console.log('[ServiceTitan] Invoice marked as paid');

      return {
        customerId: customer.id,
        membershipId: invoice.id, // The invoice ID serves as membership reference
        invoiceId: invoice.id,
      };
    } catch (error) {
      console.error('[ServiceTitan] Process membership purchase error:', error);
      throw error;
    }
  }

  /**
   * Get customer contacts (phone/email)
   */
  async getCustomerContacts(customerId: number): Promise<any[]> {
    try {
      const result = await this.request<{ data: any[] }>(
        `/customers/${customerId}/contacts`
      );
      return result.data || [];
    } catch (error) {
      console.error('[ServiceTitan] Get customer contacts error:', error);
      return [];
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: number): Promise<ServiceTitanCustomer> {
    try {
      // Customer endpoint returns object directly, not wrapped in {data: ...}
      const customerData: any = await this.request<any>(
        `/customers/${customerId}`
      );
      
      // Fetch customer contacts to get phone/email
      const contacts = await this.getCustomerContacts(customerId);
      
      // Extract primary phone and email from contacts
      const primaryContact = contacts.find((c: any) => c.type === 'Primary') || contacts[0];
      
      return {
        ...customerData,
        email: primaryContact?.email || '',
        phoneNumber: primaryContact?.phoneNumber || primaryContact?.phone || '',
      };
    } catch (error) {
      console.error('[ServiceTitan] Get customer error:', error);
      throw error;
    }
  }

  /**
   * Get customer appointments (actual scheduled visits)
   */
  async getCustomerAppointments(customerId: number): Promise<any[]> {
    try {
      // First, get all jobs for this customer
      const jpmUrl = `https://api.servicetitan.io/jpm/v2/tenant/${this.config.tenantId}/jobs?customerId=${customerId}&pageSize=50`;
      const jobsResult = await this.request<{ data: any[] }>(jpmUrl, {}, true);
      
      const jobs = jobsResult.data || [];
      
      // Then fetch appointments for each job
      const appointmentPromises = jobs.map(async (job: any) => {
        try {
          if (!job.firstAppointmentId && !job.lastAppointmentId) {
            return [];
          }
          
          // Try to fetch appointments from the appointments API
          const appointmentsUrl = `https://api.servicetitan.io/jpm/v2/tenant/${this.config.tenantId}/appointments?jobId=${job.id}&pageSize=50`;
          const appointmentsResult = await this.request<{ data: any[] }>(appointmentsUrl, {}, true);
          
          return (appointmentsResult.data || []).map((apt: any) => ({
            id: apt.id,
            start: apt.start || apt.scheduledOn || apt.arrivalWindowStart,
            end: apt.end || apt.arrivalWindowEnd,
            status: apt.appointmentStatus || apt.status || 'Scheduled',
            arrivalWindowStart: apt.arrivalWindowStart,
            arrivalWindowEnd: apt.arrivalWindowEnd,
            jobType: job.jobType || 'Service Call',
            jobNumber: job.jobNumber,
            summary: job.summary || apt.summary || `Appointment for Job #${job.jobNumber}`,
          }));
        } catch (error) {
          // If appointments API fails, fall back to job data
          console.log(`[ServiceTitan] Could not fetch appointments for job ${job.id}, using job data`);
          return [{
            id: job.id,
            start: job.createdOn,
            end: job.completedOn,
            status: job.jobStatus || 'Unknown',
            arrivalWindowStart: null,
            arrivalWindowEnd: null,
            jobType: 'Service Call',
            jobNumber: job.jobNumber,
            summary: job.summary || `Job #${job.jobNumber}`,
          }];
        }
      });
      
      const allAppointments = await Promise.all(appointmentPromises);
      return allAppointments.flat();
    } catch (error) {
      console.error('[ServiceTitan] Get customer appointments error:', error);
      return [];
    }
  }

  /**
   * Get customer invoices
   */
  async getCustomerInvoices(customerId: number): Promise<any[]> {
    try {
      // Use accounting API for invoices
      const accountingUrl = `https://api.servicetitan.io/accounting/v2/tenant/${this.config.tenantId}/invoices?customerId=${customerId}&pageSize=50`;
      const result = await this.request<{ data: any[] }>(accountingUrl, {}, true);
      
      console.log('[ServiceTitan] Invoices response structure:', JSON.stringify(result, null, 2).substring(0, 500));
      
      // Map invoices to display format based on actual ServiceTitan response
      const invoices = result.data || [];
      return invoices.map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.referenceNumber || invoice.id?.toString(),
        total: parseFloat(invoice.total || '0'),
        balance: parseFloat(invoice.balance || '0'),
        status: invoice.balance === '0.00' || invoice.balance === 0 ? 'Paid' : 'Outstanding',
        createdOn: invoice.invoiceDate || invoice.createdOn,
        dueDate: invoice.dueDate || null,
        jobNumber: invoice.referenceNumber || null,
        summary: invoice.summary || `Invoice #${invoice.referenceNumber || invoice.id}`,
      }));
    } catch (error) {
      console.error('[ServiceTitan] Get customer invoices error:', error);
      // Return empty array on error rather than throwing
      return [];
    }
  }
}

// Singleton instance
let serviceTitanAPI: ServiceTitanAPI | null = null;

export function getServiceTitanAPI(): ServiceTitanAPI {
  if (!serviceTitanAPI) {
    const clientId = process.env.SERVICETITAN_CLIENT_ID;
    const clientSecret = process.env.SERVICETITAN_CLIENT_SECRET;
    const tenantId = process.env.SERVICETITAN_TENANT_ID;
    const appKey = process.env.SERVICETITAN_APP_KEY;

    if (!clientId || !clientSecret || !tenantId || !appKey) {
      throw new Error('ServiceTitan credentials not configured');
    }

    serviceTitanAPI = new ServiceTitanAPI({
      clientId,
      clientSecret,
      tenantId,
      appKey,
    });
  }

  return serviceTitanAPI;
}

/**
 * Normalize phone number to digits only (strip formatting, country code)
 * (512) 555-1234 → 5125551234
 * +1-512-555-1234 → 5125551234
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, '');
  // Remove leading 1 (US country code) if present and 11 digits
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return digitsOnly.substring(1);
  }
  return digitsOnly;
}

/**
 * Normalize email to lowercase for consistent searching
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

// Export the class for direct use
export { ServiceTitanAPI };
