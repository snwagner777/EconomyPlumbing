import type { InsertServiceTitanMembership } from "@shared/schema";

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
   * Search for customer by email or phone
   */
  async searchCustomer(email: string, phone: string): Promise<ServiceTitanCustomer | null> {
    try {
      console.log(`[ServiceTitan] Searching for customer - email: "${email}", phone: "${phone}"`);
      
      // Search by email if provided
      if (email && email.trim()) {
        console.log('[ServiceTitan] Searching by email...');
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

      // If not found by email, search by phone
      if (phone && phone.trim()) {
        console.log('[ServiceTitan] Searching by phone...');
        
        // Normalize the search phone number
        const normalizedSearchPhone = this.normalizePhone(phone);
        console.log(`[ServiceTitan] Normalized search phone: "${normalizedSearchPhone}"`);
        
        // ServiceTitan's phone API doesn't filter properly, so we need to check contacts
        const phoneResults = await this.request<{ data: ServiceTitanCustomer[] }>(
          `/customers?phoneNumber=${encodeURIComponent(phone)}`
        );
        
        if (!phoneResults.data || phoneResults.data.length === 0) {
          console.log('[ServiceTitan] No customers returned from phone search');
          return null;
        }

        console.log(`[ServiceTitan] Phone search returned ${phoneResults.data.length} customers to check`);
        
        // Cap at 50 customers to avoid excessive API calls
        const customersToCheck = phoneResults.data.slice(0, 50);
        console.log(`[ServiceTitan] Checking first ${customersToCheck.length} customers`);
        
        // Check customers in batches of 5 concurrent requests
        const BATCH_SIZE = 5;
        for (let i = 0; i < customersToCheck.length; i += BATCH_SIZE) {
          const batch = customersToCheck.slice(i, i + BATCH_SIZE);
          console.log(`[ServiceTitan] Checking batch ${Math.floor(i / BATCH_SIZE) + 1} (customers ${i + 1}-${Math.min(i + BATCH_SIZE, customersToCheck.length)})`);
          
          // Process batch in parallel
          const results = await Promise.allSettled(
            batch.map(async (customer) => {
              try {
                const contacts = await this.getCustomerContacts(customer.id);
                
                // Check if any contact phone matches
                for (const contact of contacts) {
                  if (contact.phoneNumber) {
                    const normalizedContactPhone = this.normalizePhone(contact.phoneNumber);
                    if (normalizedContactPhone === normalizedSearchPhone) {
                      console.log(`[ServiceTitan] MATCH FOUND! Customer ${customer.id} (${customer.name}) has matching phone`);
                      return customer;
                    }
                  }
                }
                return null;
              } catch (error) {
                console.error(`[ServiceTitan] Error checking customer ${customer.id}:`, error);
                return null;
              }
            })
          );
          
          // Check if we found a match in this batch
          for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
              return result.value;
            }
          }
        }
        
        console.log(`[ServiceTitan] No matching customer found after checking ${customersToCheck.length} customers`);
        if (phoneResults.data.length > 50) {
          console.log(`[ServiceTitan] WARNING: ${phoneResults.data.length - 50} additional customers were not checked`);
        }
      }

      console.log('[ServiceTitan] Customer not found by email or phone');
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
   * Get customer appointments
   */
  async getCustomerAppointments(customerId: number): Promise<any[]> {
    try {
      // Use jpm (jobs, projects, memberships) API for appointments
      const jpmUrl = `https://api.servicetitan.io/jpm/v2/tenant/${this.config.tenantId}/jobs?customerId=${customerId}&pageSize=50`;
      const result = await this.request<{ data: any[] }>(jpmUrl, {}, true);
      
      console.log('[ServiceTitan] Jobs response structure:', JSON.stringify(result, null, 2).substring(0, 500));
      
      // Map jobs to appointment format based on actual ServiceTitan response
      const jobs = result.data || [];
      return jobs.map((job: any) => ({
        id: job.id,
        start: job.createdOn || null,
        end: job.completedOn || null,
        status: job.jobStatus || 'Unknown',
        arrivalWindowStart: null,
        arrivalWindowEnd: null,
        jobType: 'Service Call',
        jobNumber: job.jobNumber || job.id?.toString(),
        summary: job.summary || `Job #${job.jobNumber || job.id}`,
      }));
    } catch (error) {
      console.error('[ServiceTitan] Get customer appointments error:', error);
      // Return empty array on error rather than throwing
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

// Export the class for direct use
export { ServiceTitanAPI };
