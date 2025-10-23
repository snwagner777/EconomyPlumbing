import type { InsertServiceTitanMembership, InsertServiceTitanCustomer, InsertServiceTitanContact } from "@shared/schema";
import { db } from "../db";

interface ServiceTitanConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  appKey: string;
}

interface ServiceTitanContact {
  id: number;
  type: string;
  value: string;
  memo?: string;
  phoneSettings?: {
    phoneNumber: string;
    doNotText: boolean;
  };
}

interface ServiceTitanCustomer {
  id: number;
  name?: string;
  email?: string;
  phoneNumber?: string;
  contacts?: ServiceTitanContact[];
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
   * Search for ALL customers by email or phone via live API (for multi-account support)
   * Returns array of all matching customers, not just the first one
   */
  async searchAllCustomersLive(emailOrPhone: string): Promise<ServiceTitanCustomer[]> {
    try {
      const isEmail = emailOrPhone.includes('@');
      console.log(`[ServiceTitan] Live API search for ALL customers with ${isEmail ? 'email' : 'phone'}: "${emailOrPhone}"`);
      
      if (isEmail) {
        // Email search - returns all customers with this email
        const emailResults = await this.request<{ data: ServiceTitanCustomer[] }>(
          `/customers?email=${encodeURIComponent(emailOrPhone.trim())}`
        );

        if (emailResults.data && emailResults.data.length > 0) {
          console.log(`[ServiceTitan] Found ${emailResults.data.length} customer(s) with email ${emailOrPhone}`);
          return emailResults.data;
        }
      } else {
        // Phone search - use contacts search API
        const normalizedPhone = this.normalizePhone(emailOrPhone);
        console.log(`[ServiceTitan] Searching for phone: ${normalizedPhone}`);
        
        try {
          const contactsSearchUrl = `https://api.servicetitan.io/crm/v2/tenant/${this.config.tenantId}/contacts/search`;
          const searchResults = await this.request<{ data: any[] }>(
            contactsSearchUrl,
            {
              method: 'POST',
              body: JSON.stringify({
                value: normalizedPhone,
                page: 1,
                pageSize: 50 // Get up to 50 matching contacts
              })
            },
            true
          );

          if (searchResults.data && searchResults.data.length > 0) {
            // Get unique customer IDs
            const customerIds = Array.from(new Set(searchResults.data.map((c: any) => c.customerId)));
            console.log(`[ServiceTitan] Found ${customerIds.length} customer(s) with phone ${emailOrPhone}`);
            
            // Fetch full customer details for each ID
            const customers: ServiceTitanCustomer[] = [];
            for (const customerId of customerIds) {
              try {
                const customer = await this.request<ServiceTitanCustomer>(`/customers/${customerId}`);
                customers.push(customer);
              } catch (error) {
                console.error(`[ServiceTitan] Failed to fetch customer ${customerId}:`, error);
              }
            }
            return customers;
          }
        } catch (error: any) {
          console.error('[ServiceTitan] Contacts search error:', error);
        }
      }
      
      console.log('[ServiceTitan] No customers found via live API');
      return [];
    } catch (error) {
      console.error('[ServiceTitan] Live API search error:', error);
      return [];
    }
  }

  /**
   * Search for customer by email or phone (trying multiple approaches)
   * Returns FIRST matching customer only
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
      
      // ServiceTitan returns contacts with type 'Email', 'Phone', 'MobilePhone', etc.
      // Each contact has a 'value' field with the actual data
      const emailContact = contacts.find((c: any) => c.type === 'Email');
      const phoneContact = contacts.find((c: any) => c.type === 'Phone' || c.type === 'MobilePhone') || contacts.find((c: any) => c.phoneSettings);
      
      console.log(`[Portal Debug] Customer ${customerId} - Found ${contacts.length} contacts`);
      console.log(`[Portal Debug] Email contact:`, emailContact?.value || 'NONE');
      console.log(`[Portal Debug] Phone contact:`, phoneContact?.value || phoneContact?.phoneSettings?.phoneNumber || 'NONE');
      console.log(`[Portal Debug] Customer record email:`, customerData.email || 'NONE');
      console.log(`[Portal Debug] Customer record phoneNumber:`, customerData.phoneNumber || 'NONE');
      
      // Use contacts first, fall back to customer record fields if contacts are empty
      const result = {
        ...customerData,
        email: emailContact?.value || customerData.email || '',
        phoneNumber: phoneContact?.value || phoneContact?.phoneSettings?.phoneNumber || customerData.phoneNumber || '',
        contacts: contacts.map((c: any) => ({
          id: c.id,
          type: c.type,
          value: c.value || c.phoneSettings?.phoneNumber || '',
          memo: c.memo,
          phoneSettings: c.phoneSettings
        }))
      };
      
      console.log(`[Portal Debug] Final email field:`, result.email || 'EMPTY STRING');
      console.log(`[Portal Debug] Final phoneNumber field:`, result.phoneNumber || 'EMPTY STRING');
      console.log(`[Portal Debug] Returning ${result.contacts.length} contacts`);
      
      return result;
    } catch (error) {
      console.error('[ServiceTitan] Get customer error:', error);
      throw error;
    }
  }

  /**
   * Update customer contact information
   */
  async updateCustomerContacts(
    customerId: number,
    data: {
      email?: string;
      phone?: string;
    }
  ): Promise<void> {
    try {
      console.log(`[ServiceTitan] Updating customer ${customerId} contacts...`);
      
      // Get existing contacts
      const existingContacts = await this.getCustomerContacts(customerId);
      
      // Update or add email contact
      if (data.email) {
        const emailContact = existingContacts.find((c: any) => c.type === 'Email');
        if (emailContact) {
          // Update existing email
          await this.request(
            `/customers/${customerId}/contacts/${emailContact.id}`,
            {
              method: 'PUT',
              body: JSON.stringify({
                type: 'Email',
                value: data.email,
                memo: 'email'
              }),
            }
          );
        } else {
          // Create new email contact
          await this.request(
            `/customers/${customerId}/contacts`,
            {
              method: 'POST',
              body: JSON.stringify({
                type: 'Email',
                value: data.email,
                memo: 'email'
              }),
            }
          );
        }
      }
      
      // Update or add phone contact
      if (data.phone) {
        const phoneContact = existingContacts.find((c: any) => c.type === 'Phone' || c.type === 'MobilePhone');
        if (phoneContact) {
          // Update existing phone
          await this.request(
            `/customers/${customerId}/contacts/${phoneContact.id}`,
            {
              method: 'PUT',
              body: JSON.stringify({
                type: phoneContact.type,
                value: data.phone,
                memo: phoneContact.memo || 'Phone',
                phoneSettings: {
                  phoneNumber: data.phone,
                  doNotText: phoneContact.phoneSettings?.doNotText || false
                }
              }),
            }
          );
        } else {
          // Create new phone contact
          await this.request(
            `/customers/${customerId}/contacts`,
            {
              method: 'POST',
              body: JSON.stringify({
                type: 'Phone',
                value: data.phone,
                memo: 'Phone',
                phoneSettings: {
                  phoneNumber: data.phone,
                  doNotText: false
                }
              }),
            }
          );
        }
      }
      
      console.log('[ServiceTitan] Customer contacts updated successfully');
    } catch (error) {
      console.error('[ServiceTitan] Update customer contacts error:', error);
      throw error;
    }
  }

  /**
   * Delete a customer contact by ID
   */
  async deleteCustomerContact(customerId: number, contactId: number): Promise<void> {
    try {
      console.log(`[ServiceTitan] Deleting contact ${contactId} for customer ${customerId}...`);
      
      await this.request(
        `/customers/${customerId}/contacts/${contactId}`,
        {
          method: 'DELETE',
        }
      );
      
      console.log('[ServiceTitan] Contact deleted successfully');
    } catch (error) {
      console.error('[ServiceTitan] Delete contact error:', error);
      throw error;
    }
  }

  /**
   * Update location address
   */
  async updateLocation(
    locationId: number,
    data: {
      street: string;
      city: string;
      state: string;
      zip: string;
    }
  ): Promise<void> {
    try {
      console.log(`[ServiceTitan] Updating location ${locationId}...`);
      
      const address = {
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: 'USA',
      };
      
      await this.request(
        `/locations/${locationId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            address: address
          }),
        }
      );
      
      console.log('[ServiceTitan] Location updated successfully');
    } catch (error) {
      console.error('[ServiceTitan] Update location error:', error);
      throw error;
    }
  }

  /**
   * Get customer's primary location
   */
  async getCustomerPrimaryLocation(customerId: number): Promise<any> {
    try {
      const locationsUrl = `https://api.servicetitan.io/crm/v2/tenant/${this.config.tenantId}/locations?customerId=${customerId}`;
      const result = await this.request<{ data: any[] }>(locationsUrl, {}, true);
      
      // Return first location (primary)
      return result.data && result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.error('[ServiceTitan] Get customer primary location error:', error);
      throw error;
    }
  }

  /**
   * Get ALL locations for a customer (not just primary)
   */
  async getAllCustomerLocations(customerId: number): Promise<any[]> {
    try {
      const locationsUrl = `https://api.servicetitan.io/crm/v2/tenant/${this.config.tenantId}/locations?customerId=${customerId}`;
      const result = await this.request<{ data: any[] }>(locationsUrl, {}, true);
      
      console.log(`[ServiceTitan] Found ${result.data?.length || 0} locations for customer ${customerId}`);
      
      // Return all locations
      return result.data || [];
    } catch (error) {
      console.error('[ServiceTitan] Get all customer locations error:', error);
      throw error;
    }
  }

  /**
   * Get available arrival windows from ServiceTitan
   * This fetches recent appointments and extracts unique arrival windows
   */
  async getArrivalWindows(): Promise<Array<{ start: string; end: string; label: string }>> {
    try {
      // Fetch recent appointments to see what windows are being used
      const jpmUrl = `https://api.servicetitan.io/jpm/v2/tenant/${this.config.tenantId}/appointments?pageSize=100`;
      const result = await this.request<{ data: any[] }>(jpmUrl, {}, true);
      
      const appointments = result.data || [];
      
      // Extract unique arrival windows
      const windowsMap = new Map<string, { start: string; end: string }>();
      
      appointments.forEach((apt: any) => {
        if (apt.arrivalWindowStart && apt.arrivalWindowEnd) {
          const startTime = new Date(apt.arrivalWindowStart);
          const endTime = new Date(apt.arrivalWindowEnd);
          
          // Format as HH:MM
          const startStr = `${startTime.getUTCHours().toString().padStart(2, '0')}:${startTime.getUTCMinutes().toString().padStart(2, '0')}`;
          const endStr = `${endTime.getUTCHours().toString().padStart(2, '0')}:${endTime.getUTCMinutes().toString().padStart(2, '0')}`;
          
          const key = `${startStr}-${endStr}`;
          if (!windowsMap.has(key)) {
            windowsMap.set(key, { start: startStr, end: endStr });
          }
        }
      });
      
      // Convert to array and sort by start time
      const windows = Array.from(windowsMap.values()).sort((a, b) => {
        return a.start.localeCompare(b.start);
      });
      
      // Format with labels
      return windows.map(w => {
        const formatTime = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
          return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        };
        
        return {
          start: w.start,
          end: w.end,
          label: `${formatTime(w.start)} - ${formatTime(w.end)}`
        };
      });
    } catch (error) {
      console.error('[ServiceTitan] Get arrival windows error:', error);
      // Return default windows if API fails
      return [
        { start: "08:00", end: "12:00", label: "8:00 AM - 12:00 PM" },
        { start: "12:00", end: "16:00", label: "12:00 PM - 4:00 PM" },
        { start: "16:00", end: "20:00", label: "4:00 PM - 8:00 PM" }
      ];
    }
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(appointmentId: number, newStart: string, newEnd: string): Promise<any> {
    try {
      const jpmUrl = `https://api.servicetitan.io/jpm/v2/tenant/${this.config.tenantId}/appointments/${appointmentId}`;
      
      const payload = {
        start: newStart,
        end: newEnd,
        arrivalWindowStart: newStart,
        arrivalWindowEnd: newEnd,
      };

      console.log(`[ServiceTitan] Rescheduling appointment ${appointmentId} to ${newStart}`);
      
      const result = await this.request<{ data: any }>(jpmUrl, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }, true);

      console.log('[ServiceTitan] Appointment rescheduled successfully');
      return result.data;
    } catch (error) {
      console.error('[ServiceTitan] Reschedule appointment error:', error);
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

  /**
   * Get customer memberships (VIP status, active memberships)
   */
  async getCustomerMemberships(customerId: number): Promise<any[]> {
    try {
      // ServiceTitan memberships API endpoint 
      // Using the correct /memberships endpoint with customerIds parameter
      const membershipsUrl = `https://api.servicetitan.io/memberships/v2/tenant/${this.config.tenantId}/memberships?customerIds=${customerId}&active=Any&pageSize=50`;
      const result = await this.request<{ data: any[] }>(membershipsUrl, {}, true);
      
      console.log('[ServiceTitan] Memberships API response:', {
        totalCount: result.data?.length || 0,
        memberships: result.data?.map((m: any) => ({
          id: m.id,
          status: m.status,
          name: m.name,
          duration: m.duration,
          billingFrequency: m.billingFrequency,
          createdOn: m.createdOn,
          modifiedOn: m.modifiedOn,
          active: m.active
        })) || []
      });
      
      // Map memberships to display format
      const memberships = result.data || [];
      
      // Filter OUT deleted memberships (but keep expired/suspended ones to show history)
      const displayableMemberships = memberships.filter((m: any) => {
        // Skip if missing required fields
        if (!m.name && !m.id) return false;
        
        // Skip deleted memberships
        const status = (m.status || '').toLowerCase();
        if (status === 'deleted') return false;
        
        return true;
      });
      
      console.log('[ServiceTitan] Filtered memberships (excluding canceled):', {
        inputCount: memberships.length,
        displayableCount: displayableMemberships.length,
        memberships: displayableMemberships.map((m: any) => ({
          name: m.membershipName,
          status: m.status,
          expiresOn: m.to || m.expirationDate,
          canceledOn: m.canceledOn
        }))
      });
      
      // Group by membership to avoid duplicates
      const uniqueMemberships = new Map();
      displayableMemberships.forEach((membership: any) => {
        const key = membership.id;
        
        // Map membership status - using the actual API status values
        // Values from API docs: Active, Suspended, Expired, Canceled, Deleted
        const status = membership.status || 'Unknown';
        const isActive = status === 'Active';
        const isExpired = status === 'Expired';
        
        // Use duration to determine if it has an expiration
        // duration = null means ongoing/no expiration
        const hasExpiration = membership.duration !== null && membership.duration !== undefined;
        
        uniqueMemberships.set(key, {
          id: membership.id,
          membershipType: membership.name || 'VIP Membership',
          status: status,
          isExpired: isExpired || status === 'Canceled',
          startDate: membership.createdOn,
          expirationDate: hasExpiration ? membership.expirationDate : null,
          renewalDate: membership.renewalDate,
          balance: 0, // These fields may not exist in the new API
          totalValue: 0,
          description: membership.description || '',
          rawStatus: membership.status,
          billingFrequency: membership.billingFrequency,
          duration: membership.duration,
          active: membership.active
        });
      });
      
      return Array.from(uniqueMemberships.values());
    } catch (error) {
      console.error('[ServiceTitan] Get customer memberships error:', error);
      // Return empty array on error rather than throwing
      return [];
    }
  }

  /**
   * Get customer estimates (open quotes/proposals) with full pricebook item details
   */
  async getCustomerEstimates(customerId: number): Promise<any[]> {
    try {
      // ServiceTitan Sales & Estimates API endpoint
      const salesUrl = `https://api.servicetitan.io/sales/v2/tenant/${this.config.tenantId}/estimates?customerId=${customerId}&pageSize=50`;
      const result = await this.request<{ data: any[] }>(salesUrl, {}, true);
      
      console.log('[ServiceTitan] Estimates API response received:', {
        totalCount: result.data?.length || 0,
        statuses: result.data?.map((e: any) => ({ id: e.id, status: e.status, soldOn: e.soldOn })) || []
      });
      
      // Map estimates to display format
      const estimates = result.data || [];
      
      // Filter for UNSOLD estimates only (where soldOn is null/empty)
      const unsoldEstimates = estimates.filter((e: any) => !e.soldOn);
      console.log(`[ServiceTitan] Filtered to ${unsoldEstimates.length} unsold estimates from ${estimates.length} total`);
      
      // Create memoization cache for pricebook items to avoid duplicate API calls
      const pricebookCache = new Map<string, any>();
      
      // Enhance each estimate with pricebook item details
      const enhancedEstimates = await Promise.all(
        unsoldEstimates.map(async (estimate: any) => {
          const items = estimate.items || [];
          
          // Fetch pricebook details for each item
          const enhancedItems = await Promise.all(
            items.map(async (item: any) => {
              let pricebookDetails = null;
              
              try {
                // Determine item type and fetch details (with memoization)
                // ServiceTitan estimates typically have serviceId, materialId, or equipmentId
                let cacheKey = '';
                
                if (item.serviceId || item.skuId) {
                  const id = item.serviceId || item.skuId;
                  cacheKey = `service-${id}`;
                  
                  if (!pricebookCache.has(cacheKey)) {
                    const details = await this.getPricebookService(id);
                    pricebookCache.set(cacheKey, details);
                  }
                  pricebookDetails = pricebookCache.get(cacheKey);
                  
                } else if (item.materialId) {
                  cacheKey = `material-${item.materialId}`;
                  
                  if (!pricebookCache.has(cacheKey)) {
                    const details = await this.getPricebookMaterial(item.materialId);
                    pricebookCache.set(cacheKey, details);
                  }
                  pricebookDetails = pricebookCache.get(cacheKey);
                  
                } else if (item.equipmentId) {
                  cacheKey = `equipment-${item.equipmentId}`;
                  
                  if (!pricebookCache.has(cacheKey)) {
                    const details = await this.getPricebookEquipment(item.equipmentId);
                    pricebookCache.set(cacheKey, details);
                  }
                  pricebookDetails = pricebookCache.get(cacheKey);
                }
              } catch (error) {
                // Log but don't fail - missing pricebook details shouldn't break the estimate
                console.error('[ServiceTitan] Error fetching pricebook details for item:', item, error);
                pricebookDetails = null;
              }
              
              return {
                ...item,
                quantity: item.qty || 1,
                unitRate: item.unitRate || 0,
                total: item.total || 0,
                description: item.description || '',
                pricebookDetails, // Add full pricebook data (name, description, imageUrl, etc.) or null if failed
              };
            })
          );
          
          // Calculate expiration status
          const createdDate = new Date(estimate.createdOn || estimate.createdDate);
          const expiresDate = estimate.expiresOn || estimate.expirationDate 
            ? new Date(estimate.expiresOn || estimate.expirationDate)
            : new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from creation
          
          const now = new Date();
          const daysUntilExpiration = Math.ceil((expiresDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          
          let expirationStatus = 'valid';
          if (daysUntilExpiration < 0) {
            expirationStatus = 'expired';
          } else if (daysUntilExpiration <= 7) {
            expirationStatus = 'expiring_soon';
          }
          
          return {
            id: estimate.id,
            estimateNumber: estimate.number || estimate.estimateNumber || estimate.id?.toString(),
            total: parseFloat(estimate.total || estimate.subtotal || '0'),
            // Status is an object with { id, name } - extract the name string
            status: typeof estimate.status === 'object' && estimate.status?.name 
              ? estimate.status.name 
              : (estimate.status || 'Open'),
            createdOn: estimate.createdOn || estimate.createdDate,
            expiresOn: expiresDate.toISOString(),
            expirationStatus,
            daysUntilExpiration,
            jobId: estimate.jobId,
            jobNumber: estimate.job?.jobNumber || null,
            summary: estimate.name || estimate.summary || `Estimate #${estimate.number || estimate.id}`,
            items: enhancedItems,
          };
        })
      );
      
      return enhancedEstimates;
    } catch (error) {
      console.error('[ServiceTitan] Get customer estimates error:', error);
      // Return empty array on error rather than throwing
      return [];
    }
  }

  /**
   * Get pricebook service details by ID
   */
  async getPricebookService(serviceId: number): Promise<any> {
    try {
      const serviceUrl = `https://api.servicetitan.io/pricebook/v2/tenant/${this.config.tenantId}/services/${serviceId}`;
      const result = await this.request<any>(serviceUrl, {}, true);
      
      return {
        id: result.id,
        name: result.name || result.displayName,
        description: result.description,
        price: parseFloat(result.price || '0'),
        imageUrl: result.imageUrl || result.image || null,
        category: result.category || result.categoryName,
        type: 'service',
      };
    } catch (error) {
      console.error(`[ServiceTitan] Error fetching pricebook service ${serviceId}:`, error);
      return null;
    }
  }

  /**
   * Get pricebook material details by ID
   */
  async getPricebookMaterial(materialId: number): Promise<any> {
    try {
      const materialUrl = `https://api.servicetitan.io/pricebook/v2/tenant/${this.config.tenantId}/materials/${materialId}`;
      const result = await this.request<any>(materialUrl, {}, true);
      
      return {
        id: result.id,
        name: result.name || result.displayName,
        description: result.description,
        price: parseFloat(result.price || result.cost || '0'),
        imageUrl: result.imageUrl || result.image || null,
        category: result.category || result.categoryName,
        type: 'material',
      };
    } catch (error) {
      console.error(`[ServiceTitan] Error fetching pricebook material ${materialId}:`, error);
      return null;
    }
  }

  /**
   * Get pricebook equipment details by ID
   */
  async getPricebookEquipment(equipmentId: number): Promise<any> {
    try {
      const equipmentUrl = `https://api.servicetitan.io/pricebook/v2/tenant/${this.config.tenantId}/equipment/${equipmentId}`;
      const result = await this.request<any>(equipmentUrl, {}, true);
      
      return {
        id: result.id,
        name: result.name || result.displayName,
        description: result.description,
        price: parseFloat(result.price || result.cost || '0'),
        imageUrl: result.imageUrl || result.image || null,
        category: result.category || result.categoryName,
        type: 'equipment',
      };
    } catch (error) {
      console.error(`[ServiceTitan] Error fetching pricebook equipment ${equipmentId}:`, error);
      return null;
    }
  }

  /**
   * Get pricebook item image URL
   */
  async getPricebookItemImage(imagePath: string): Promise<string | null> {
    try {
      if (!imagePath) return null;
      
      // ServiceTitan pricebook images endpoint
      const imageUrl = `https://api.servicetitan.io/pricebook/v2/tenant/${this.config.tenantId}/images?path=${encodeURIComponent(imagePath)}`;
      
      // Return the full URL - frontend can fetch the image directly with auth headers
      return imageUrl;
    } catch (error) {
      console.error(`[ServiceTitan] Error getting pricebook image ${imagePath}:`, error);
      return null;
    }
  }

  /**
   * Sync all customers from ServiceTitan to local database
   * Paginates through all customers and stores them with normalized contacts
   */
  async syncAllCustomers(): Promise<{ customersCount: number; contactsCount: number; duration: number }> {
    const startTime = Date.now();
    console.log('[ServiceTitan Sync] Starting full customer sync...');
    
    try {
      const { serviceTitanCustomers, serviceTitanContacts } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      let page = 1;
      let hasMore = true;
      let totalCustomers = 0;
      let totalContacts = 0;
      let customersWithJobs = 0;
      const pageSize = 200; // Increased from 50 to reduce API calls

      // Use upsert strategy - no deletion, just update existing records
      console.log('[ServiceTitan Sync] Using upsert strategy for zero-downtime sync...');
      console.log('[ServiceTitan Sync] Will also fetch job counts for each customer...');

      while (hasMore) {
        console.log(`[ServiceTitan Sync] Fetching page ${page}...`);
        
        // Fetch customers page (use relative endpoint, request() will prepend baseUrl)
        const result = await this.request<{ data: any[]; hasMore: boolean }>(`/customers?page=${page}&pageSize=${pageSize}`);
        
        const customers = result.data || [];
        hasMore = result.hasMore || false;
        
        if (customers.length === 0) {
          break;
        }

        // Process each customer
        let customersWithJobs = 0;
        let totalJobsProcessed = 0;
        let highValueCustomers: { id: number; name: string; jobCount: number }[] = [];
        let skippedInactive = 0;
        
        for (let idx = 0; idx < customers.length; idx++) {
          const customer = customers[idx];
          
          // SKIP INACTIVE/DEACTIVATED CUSTOMERS - only sync active customers
          if (customer.active === false) {
            skippedInactive++;
            continue;
          }
          
          // Show progress every 10 customers
          if ((idx + 1) % 10 === 0) {
            console.log(`[ServiceTitan Sync] Processing customer ${idx + 1}/${customers.length}...`);
          }
          
          try {
            // Fetch ALL jobs for this customer to get accurate count
            let jobCount = 0;
            try {
              // Jobs API uses different base path (jpm/v2 instead of crm/v2)
              const jobsBaseUrl = `https://api.servicetitan.io/jpm/v2/tenant/${this.config.tenantId}`;
              let page = 1;
              let hasMore = true;
              const pageSize = 100; // ServiceTitan max page size
              
              while (hasMore) {
                const response = await fetch(
                  `${jobsBaseUrl}/jobs?customerId=${customer.id}&jobStatus=Completed&page=${page}&pageSize=${pageSize}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${this.accessToken}`,
                      'ST-App-Key': this.config.appKey,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                
                if (response.ok) {
                  const jobsResult = await response.json();
                  
                  if (jobsResult.data && jobsResult.data.length > 0) {
                    jobCount += jobsResult.data.length;
                  }
                  
                  // Continue pagination if there are more pages
                  hasMore = jobsResult.hasMore || false;
                  page++;
                  
                  // Safety check to prevent infinite loops
                  if (page > 50) { // Max 5000 jobs per customer (50 pages * 100)
                    console.log(`[ServiceTitan Sync] ⚠️ Customer ${customer.id} has over 5000 jobs, stopping pagination`);
                    break;
                  }
                } else {
                  // Stop on any error
                  hasMore = false;
                }
              }
              
              // Track statistics
              if (jobCount > 0) {
                customersWithJobs++;
                totalJobsProcessed += jobCount;
              }
              
              // Log progress for customers with many jobs
              if (jobCount > 100) {
                console.log(`[ServiceTitan Sync] 🌟 High-value customer: ${customer.name} (ID: ${customer.id}) - ${jobCount} completed jobs`);
                highValueCustomers.push({ id: customer.id, name: customer.name || 'Unknown', jobCount });
              }
              
            } catch (jobError) {
              // Silently continue with jobCount = 0 - don't log to avoid flooding logs
              // Jobs API might not have data for all customers
            }

            // Insert customer with job count
            await db.insert(serviceTitanCustomers).values({
              id: customer.id,
              name: customer.name || 'Unknown',
              type: customer.type || 'Residential',
              street: customer.address?.street || null,
              city: customer.address?.city || null,
              state: customer.address?.state || null,
              zip: customer.address?.zip || null,
              active: customer.active ?? true,
              balance: customer.balance?.toString() || '0.00',
              jobCount: jobCount,
            }).onConflictDoUpdate({
              target: serviceTitanCustomers.id,
              set: {
                name: customer.name || 'Unknown',
                type: customer.type || 'Residential',
                street: customer.address?.street || null,
                city: customer.address?.city || null,
                state: customer.address?.state || null,
                zip: customer.address?.zip || null,
                active: customer.active ?? true,
                balance: customer.balance?.toString() || '0.00',
                jobCount: jobCount,
                lastSyncedAt: new Date(),
              },
            });
            
            totalCustomers++;
            if (jobCount > 0) {
              customersWithJobs++;
            }

            // Clean up old contacts for this customer before syncing new ones
            // This ensures we don't have stale contacts if they were removed in ServiceTitan
            await db.delete(serviceTitanContacts).where(eq(serviceTitanContacts.customerId, customer.id));

            // Fetch and store customer contacts
            const contacts = await this.getCustomerContacts(customer.id);
            
            for (const contact of contacts) {
              const contactType = contact.type || 'Unknown';
              const value = contact.value || contact.phoneNumber || contact.email || '';
              
              if (!value) continue;

              // Normalize based on type
              let normalizedValue = '';
              if (contactType.toLowerCase().includes('phone') || contactType.toLowerCase().includes('mobile')) {
                normalizedValue = normalizePhone(value);
              } else if (contactType.toLowerCase().includes('email')) {
                normalizedValue = normalizeEmail(value);
              } else {
                normalizedValue = value.toLowerCase().trim();
              }

              if (normalizedValue) {
                await db.insert(serviceTitanContacts).values({
                  customerId: customer.id,
                  contactType,
                  value,
                  normalizedValue,
                  isPrimary: false, // ServiceTitan doesn't expose primary flag clearly
                }).onConflictDoNothing();
                
                totalContacts++;
              }
            }
          } catch (error) {
            console.error(`[ServiceTitan Sync] Error processing customer ${customer.id}:`, error);
            // Continue with next customer
          }
        }

        // Log page summary if we found high-value customers or skipped inactive
        if (highValueCustomers.length > 0 || skippedInactive > 0) {
          console.log(`[ServiceTitan Sync] Page ${page - 1} Summary:`);
          console.log(`  - Customers with jobs: ${customersWithJobs}/${customers.length}`);
          console.log(`  - Total jobs counted: ${totalJobsProcessed}`);
          console.log(`  - High-value customers (100+ jobs): ${highValueCustomers.length}`);
          if (skippedInactive > 0) {
            console.log(`  - Skipped inactive/deactivated: ${skippedInactive}`);
          }
          
          // Show top 3 high-value customers from this page
          const topCustomers = highValueCustomers.slice(0, 3);
          topCustomers.forEach(c => {
            console.log(`    • ${c.name}: ${c.jobCount} jobs`);
          });
        }
        
        page++;
        
        // Update heartbeat to prevent stale lock detection
        const { updateSyncHeartbeat } = await import('./serviceTitanSync');
        updateSyncHeartbeat();
        
        // Log progress every 10 pages
        if (page % 10 === 0) {
          console.log(`[ServiceTitan Sync] Progress: ${totalCustomers} customers, ${totalContacts} contacts, ${customersWithJobs} with jobs`);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[ServiceTitan Sync] ✅ Completed! ${totalCustomers} customers, ${totalContacts} contacts in ${(duration / 1000).toFixed(1)}s`);
      console.log(`[ServiceTitan Sync] 📊 ${customersWithJobs} customers have completed jobs`);
      
      return { customersCount: totalCustomers, contactsCount: totalContacts, duration };
    } catch (error) {
      console.error('[ServiceTitan Sync] Failed:', error);
      throw error;
    }
  }

  /**
   * Search for ALL customer IDs by phone or email in local cache
   * Returns array of customer IDs (supports multiple accounts per email/phone)
   */
  async searchLocalCustomer(phoneOrEmail: string): Promise<number[]> {
    try {
      const { serviceTitanContacts } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Normalize input
      const normalized = phoneOrEmail.includes('@') 
        ? normalizeEmail(phoneOrEmail)
        : normalizePhone(phoneOrEmail);
      
      if (!normalized) return [];

      // Search in contacts - get ALL matching customer IDs
      const results = await db
        .select({ customerId: serviceTitanContacts.customerId })
        .from(serviceTitanContacts)
        .where(eq(serviceTitanContacts.normalizedValue, normalized));

      // Return unique customer IDs
      const uniqueCustomerIds = Array.from(new Set(results.map(r => r.customerId)));
      return uniqueCustomerIds;
    } catch (error) {
      console.error('[ServiceTitan] Local search error:', error);
      return [];
    }
  }

  /**
   * Search for ALL customers matching phone or email (for multi-account support)
   * Returns array of customer IDs with full customer details
   */
  async searchAllMatchingCustomers(phoneOrEmail: string): Promise<Array<{
    id: number;
    name: string;
    type: string;
    email?: string;
    phone?: string;
    mobilePhone?: string;
    address?: string;
  }>> {
    try {
      const { serviceTitanContacts, serviceTitanCustomers } = await import('@shared/schema');
      const { eq, inArray } = await import('drizzle-orm');
      
      // Normalize input
      const normalized = phoneOrEmail.includes('@') 
        ? normalizeEmail(phoneOrEmail)
        : normalizePhone(phoneOrEmail);
      
      if (!normalized) return [];

      // Find all matching contact records
      const contactResults = await db
        .select({ customerId: serviceTitanContacts.customerId })
        .from(serviceTitanContacts)
        .where(eq(serviceTitanContacts.normalizedValue, normalized));

      if (contactResults.length === 0) {
        console.log('[ServiceTitan] No matching customers in cache');
        return [];
      }

      // Get unique customer IDs
      const customerIds = Array.from(new Set(contactResults.map(c => c.customerId)));
      console.log(`[ServiceTitan] Found ${customerIds.length} matching customer(s) in cache`);

      // Fetch full customer details
      const customers = await db
        .select()
        .from(serviceTitanCustomers)
        .where(inArray(serviceTitanCustomers.id, customerIds));

      return customers.map(c => ({
        id: c.id,
        name: c.name || 'Unknown',
        type: c.type || 'Residential',
        email: c.email || undefined,
        phone: c.phone || undefined,
        mobilePhone: c.mobilePhone || undefined,
        address: [c.street, c.city, c.state, c.zip].filter(Boolean).join(', ')
      }));
    } catch (error) {
      console.error('[ServiceTitan] Search all matching customers error:', error);
      return [];
    }
  }

  /**
   * Search with fallback: Try local cache first, then live API
   * Caches result on-demand if found via live API
   * Returns first matching customer ID (for backwards compatibility)
   */
  async searchCustomerWithFallback(phoneOrEmail: string): Promise<number | null> {
    // Try local cache first (instant)
    const cachedCustomerIds = await this.searchLocalCustomer(phoneOrEmail);
    if (cachedCustomerIds.length > 0) {
      console.log(`[ServiceTitan] ✅ Found ${cachedCustomerIds.length} customer(s) in local cache, returning first`);
      return cachedCustomerIds[0];
    }

    // Fallback to live API search (slower)
    console.log('[ServiceTitan] 🔄 Not in cache, searching live API...');
    
    // Detect if input is email or phone and pass correct parameters
    const isEmail = phoneOrEmail.includes('@');
    const email = isEmail ? phoneOrEmail : '';
    const phone = isEmail ? '' : phoneOrEmail;
    
    console.log(`[ServiceTitan] Searching with ${isEmail ? 'email' : 'phone'}: "${phoneOrEmail}"`);
    const liveCustomer = await this.searchCustomer(email, phone);
    
    if (liveCustomer) {
      console.log(`[ServiceTitan] ✅ Found customer ${liveCustomer.id} via live API, caching...`);
      
      // Cache on-demand
      try {
        const { serviceTitanCustomers, serviceTitanContacts } = await import('@shared/schema');
        
        // Store customer WITH email and phone from the customer record
        await db.insert(serviceTitanCustomers).values({
          id: liveCustomer.id,
          name: liveCustomer.name || 'Unknown',
          type: (liveCustomer as any).type || 'Residential',
          email: liveCustomer.email || null,
          phone: liveCustomer.phoneNumber || null,
          street: liveCustomer.address?.street || null,
          city: liveCustomer.address?.city || null,
          state: liveCustomer.address?.state || null,
          zip: liveCustomer.address?.zip || null,
          active: true,
          balance: '0.00',
        }).onConflictDoUpdate({
          target: serviceTitanCustomers.id,
          set: { 
            email: liveCustomer.email || null,
            phone: liveCustomer.phoneNumber || null,
            lastSyncedAt: new Date() 
          },
        });

        // Store contacts from ServiceTitan contacts API
        const contacts = await this.getCustomerContacts(liveCustomer.id);
        for (const contact of contacts) {
          const contactType = contact.type || 'Unknown';
          const value = contact.value || contact.phoneNumber || contact.email || '';
          
          if (!value) continue;

          let normalizedValue = '';
          if (contactType.toLowerCase().includes('phone') || contactType.toLowerCase().includes('mobile')) {
            normalizedValue = normalizePhone(value);
          } else if (contactType.toLowerCase().includes('email')) {
            normalizedValue = normalizeEmail(value);
          } else {
            normalizedValue = value.toLowerCase().trim();
          }

          if (normalizedValue) {
            await db.insert(serviceTitanContacts).values({
              customerId: liveCustomer.id,
              contactType,
              value,
              normalizedValue,
              isPrimary: false,
            }).onConflictDoNothing();
          }
        }
        
        // ALSO store email/phone from customer record as contacts for searchability
        // This handles customers who have email/phone on the customer record but no contacts list
        if (liveCustomer.email) {
          const emailNormalized = normalizeEmail(liveCustomer.email);
          if (emailNormalized) {
            await db.insert(serviceTitanContacts).values({
              customerId: liveCustomer.id,
              contactType: 'Email',
              value: liveCustomer.email,
              normalizedValue: emailNormalized,
              isPrimary: true,
            }).onConflictDoNothing();
          }
        }
        
        if (liveCustomer.phoneNumber) {
          const phoneNormalized = normalizePhone(liveCustomer.phoneNumber);
          if (phoneNormalized) {
            await db.insert(serviceTitanContacts).values({
              customerId: liveCustomer.id,
              contactType: 'Phone',
              value: liveCustomer.phoneNumber,
              normalizedValue: phoneNormalized,
              isPrimary: true,
            }).onConflictDoNothing();
          }
        }
        
        console.log(`[ServiceTitan] ✅ Cached customer ${liveCustomer.id} with ${contacts.length} contacts from API + customer record email/phone`);
      } catch (error) {
        console.error('[ServiceTitan] Failed to cache customer:', error);
        // Non-fatal, customer was still found
      }
      
      return liveCustomer.id;
    }

    console.log('[ServiceTitan] ❌ Customer not found in cache or live API');
    return null;
  }

  /**
   * Search for completed jobs for a customer after a specific date
   * Used to detect when a referred customer has their first qualifying job
   */
  async getCustomerJobs(customerId: number, completedAfter?: Date): Promise<{
    id: number;
    jobNumber: string;
    customerId: number;
    completedOn: string | null;
    total: number;
    status: string;
  }[]> {
    try {
      // ServiceTitan Jobs API uses a different base URL
      const jobsBaseUrl = `https://api.servicetitan.io/jpm/v2/tenant/${this.config.tenantId}`;
      
      let endpoint = `${jobsBaseUrl}/jobs?customerId=${customerId}`;
      
      // Add date filter if provided
      if (completedAfter) {
        const dateStr = completedAfter.toISOString().split('T')[0]; // YYYY-MM-DD format
        endpoint += `&completedOnOrAfter=${dateStr}`;
      }

      console.log('[ServiceTitan] Fetching jobs for customer', customerId, 'after', completedAfter);
      
      const response = await this.request<{
        data: Array<{
          id: number;
          jobNumber: string;
          customerId: number;
          completedOn?: string;
          total: number;
          jobStatus: string;
        }>;
      }>(endpoint, {}, true);

      return response.data.map(job => ({
        id: job.id,
        jobNumber: job.jobNumber,
        customerId: job.customerId,
        completedOn: job.completedOn || null,
        total: job.total,
        status: job.jobStatus
      }));
    } catch (error) {
      console.error('[ServiceTitan] Error fetching customer jobs:', error);
      throw error;
    }
  }

  /**
   * Create a customer credit adjustment (for referral rewards)
   * Uses ServiceTitan Accounting API to issue credit to customer account
   */
  async createCustomerCredit(customerId: number, amount: number, memo: string): Promise<{
    id: number;
    customerId: number;
    amount: number;
    memo: string;
  }> {
    try {
      // ServiceTitan Accounting API uses a different base URL
      const accountingBaseUrl = `https://api.servicetitan.io/accounting/v2/tenant/${this.config.tenantId}`;
      const endpoint = `${accountingBaseUrl}/customer-adjustments`;

      console.log('[ServiceTitan] Creating customer credit:', {
        customerId,
        amount,
        memo
      });

      const response = await this.request<{
        id: number;
        customerId: number;
        amount: number;
        memo: string;
      }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          amount: amount, // Amount in cents (2500 = $25.00)
          type: 'Credit',
          memo,
          date: new Date().toISOString()
        })
      }, true);

      console.log('[ServiceTitan] ✅ Credit created successfully:', response.id);
      return response;
    } catch (error) {
      console.error('[ServiceTitan] Error creating customer credit:', error);
      throw error;
    }
  }

  /**
   * Fetch jobs with incremental sync support using modifiedOnOrAfter watermark
   * Returns jobs in batches for efficient processing
   */
  async fetchJobsIncremental(modifiedOnOrAfter?: Date, batchSize: number = 250): Promise<{
    jobs: any[];
    hasMore: boolean;
    highestModifiedOn: Date | null;
  }> {
    try {
      const jobsBaseUrl = `https://api.servicetitan.io/jpm/v2/tenant/${this.config.tenantId}`;
      let endpoint = `${jobsBaseUrl}/jobs?pageSize=${batchSize}`;
      
      // Add incremental sync filter
      if (modifiedOnOrAfter) {
        const dateStr = modifiedOnOrAfter.toISOString();
        endpoint += `&modifiedOnOrAfter=${dateStr}`;
        console.log('[ServiceTitan Jobs Sync] 📥 Fetching jobs modified after:', dateStr);
      } else {
        console.log('[ServiceTitan Jobs Sync] 📥 Fetching ALL jobs (initial sync)');
      }

      const response = await this.request<{
        data: Array<{
          id: number;
          jobNumber: string;
          customerId: number;
          jobType?: string;
          businessUnitId?: number;
          jobStatus: string;
          completedOn?: string;
          total: number;
          invoice?: number;
          createdOn: string;
          modifiedOn: string;
        }>;
        hasMore: boolean;
      }>(endpoint, {}, true);

      // Track highest modifiedOn for next watermark
      let highestModifiedOn: Date | null = null;
      if (response.data && response.data.length > 0) {
        const modifiedDates = response.data.map(j => new Date(j.modifiedOn));
        highestModifiedOn = new Date(Math.max(...modifiedDates.map(d => d.getTime())));
      }

      console.log('[ServiceTitan Jobs Sync] ✅ Fetched', response.data?.length || 0, 'jobs');
      
      return {
        jobs: response.data || [],
        hasMore: response.hasMore || false,
        highestModifiedOn
      };
    } catch (error) {
      console.error('[ServiceTitan Jobs Sync] ❌ Error fetching jobs:', error);
      throw error;
    }
  }

  /**
   * Sync all jobs to database with staging → normalized table pattern
   * Uses watermarks for incremental sync
   */
  async syncAllJobs(): Promise<{
    jobsCount: number;
    customersUpdated: number;
    duration: number;
  }> {
    const startTime = Date.now();
    const { serviceTitanJobsStaging, serviceTitanJobs, serviceTitanCustomers, syncWatermarks } = await import('@shared/schema');
    const { eq, sql } = await import('drizzle-orm');

    try {
      console.log('[ServiceTitan Jobs Sync] 🚀 Starting incremental job sync...');

      // Get last watermark
      const watermark = await db
        .select()
        .from(syncWatermarks)
        .where(eq(syncWatermarks.syncType, 'jobs'))
        .limit(1);

      const lastModifiedOn = watermark[0]?.lastModifiedOnFetched || null;
      let totalJobsFetched = 0;
      let hasMore = true;
      let currentWatermark = lastModifiedOn;

      // Fetch jobs in batches
      while (hasMore) {
        const { jobs, hasMore: more, highestModifiedOn } = await this.fetchJobsIncremental(
          currentWatermark || undefined,
          250
        );

        if (jobs.length === 0) {
          break;
        }

        // Stage raw jobs (idempotent - upsert based on jobId)
        for (const job of jobs) {
          await db
            .insert(serviceTitanJobsStaging)
            .values({
              jobId: job.id,
              rawData: job,
              fetchedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: serviceTitanJobsStaging.jobId,
              set: {
                rawData: job,
                fetchedAt: new Date(),
              },
            });
        }

        // Normalize staged jobs to serviceTitanJobs table
        const stagedJobs = await db
          .select()
          .from(serviceTitanJobsStaging)
          .where(eq(serviceTitanJobsStaging.processedAt, null as any));

        for (const staged of stagedJobs) {
          try {
            const job = staged.rawData as any;
            
            // Upsert to normalized jobs table
            await db
              .insert(serviceTitanJobs)
              .values({
                id: job.id,
                jobNumber: job.jobNumber,
                customerId: job.customerId,
                jobType: job.jobType || null,
                businessUnitId: job.businessUnitId || null,
                jobStatus: job.jobStatus,
                completedOn: job.completedOn ? new Date(job.completedOn) : null,
                total: Math.round((job.total || 0) * 100), // Convert to cents
                invoice: Math.round((job.invoice || 0) * 100),
                createdOn: new Date(job.createdOn),
                modifiedOn: new Date(job.modifiedOn),
                lastSyncedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: serviceTitanJobs.id,
                set: {
                  jobNumber: job.jobNumber,
                  jobType: job.jobType || null,
                  jobStatus: job.jobStatus,
                  completedOn: job.completedOn ? new Date(job.completedOn) : null,
                  total: Math.round((job.total || 0) * 100),
                  invoice: Math.round((job.invoice || 0) * 100),
                  modifiedOn: new Date(job.modifiedOn),
                  lastSyncedAt: new Date(),
                },
              });

            // Mark as processed
            await db
              .update(serviceTitanJobsStaging)
              .set({ processedAt: new Date() })
              .where(eq(serviceTitanJobsStaging.id, staged.id));

          } catch (error) {
            console.error('[ServiceTitan Jobs Sync] ❌ Error processing job:', error);
            // Mark error but continue
            await db
              .update(serviceTitanJobsStaging)
              .set({ processingError: (error as Error).message })
              .where(eq(serviceTitanJobsStaging.id, staged.id));
          }
        }

        totalJobsFetched += jobs.length;
        
        // Update watermark for next batch
        if (highestModifiedOn) {
          currentWatermark = highestModifiedOn;
        }

        hasMore = more;
      }

      // Update customer job counts (aggregate from completed jobs)
      console.log('[ServiceTitan Jobs Sync] 📊 Updating customer job counts...');
      await db.execute(sql`
        UPDATE service_titan_customers c
        SET job_count = (
          SELECT COUNT(*)
          FROM service_titan_jobs j
          WHERE j.customer_id = c.id
            AND j.job_status = 'Completed'
            AND j.completed_on IS NOT NULL
        )
      `);

      const customersUpdatedResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM service_titan_customers 
        WHERE job_count > 0
      `);
      const customersUpdated = customersUpdatedResult.rows[0]?.count || 0;

      // Update watermark
      await db
        .update(syncWatermarks)
        .set({
          lastSuccessfulSyncAt: new Date(),
          lastModifiedOnFetched: currentWatermark,
          recordsProcessed: totalJobsFetched,
          syncDuration: Date.now() - startTime,
          updatedAt: new Date(),
        })
        .where(eq(syncWatermarks.syncType, 'jobs'));

      const duration = Date.now() - startTime;
      console.log('[ServiceTitan Jobs Sync] ✅ Sync complete!');
      console.log(`  - Jobs synced: ${totalJobsFetched}`);
      console.log(`  - Customers with jobs: ${customersUpdated}`);
      console.log(`  - Duration: ${(duration / 1000).toFixed(1)}s`);

      return {
        jobsCount: totalJobsFetched,
        customersUpdated: Number(customersUpdated),
        duration,
      };
    } catch (error) {
      const { eq } = await import('drizzle-orm');
      
      // Log error to watermark
      await db
        .update(syncWatermarks)
        .set({
          lastError: (error as Error).message,
          lastErrorAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(syncWatermarks.syncType, 'jobs'));

      throw error;
    }
  }

  /**
   * Fetch job forms for a specific job
   * Uses Forms API: GET /forms/v2/tenant/{tenantId}/jobs/{jobId}/forms
   */
  async getJobForms(jobId: number): Promise<any[]> {
    try {
      const formsUrl = `https://api.servicetitan.io/forms/v2/tenant/${this.config.tenantId}/jobs/${jobId}/forms`;
      
      const response = await this.request<{ data: any[] }>(
        formsUrl,
        {},
        true // Use full URL
      );

      return response.data || [];
    } catch (error) {
      console.error(`[ServiceTitan Forms] Error fetching forms for job ${jobId}:`, error);
      return [];
    }
  }

  /**
   * Sync job forms for recently modified jobs
   * Extracts technician notes, customer concerns, and recommendations
   */
  async syncJobForms(options: {
    sinceDate?: Date;
    jobIds?: number[];
    batchSize?: number;
  } = {}): Promise<{
    formsCount: number;
    jobsProcessed: number;
    duration: number;
  }> {
    const startTime = Date.now();
    const { serviceTitanJobForms, serviceTitanJobs } = await import('@shared/schema');
    const { eq, sql, inArray } = await import('drizzle-orm');
    
    try {
      console.log('[ServiceTitan Forms Sync] 🔄 Starting forms sync...');
      
      let jobsToSync: any[] = [];
      
      // Strategy 1: Sync specific job IDs (if provided)
      if (options.jobIds && options.jobIds.length > 0) {
        console.log(`[ServiceTitan Forms Sync] Syncing ${options.jobIds.length} specific jobs`);
        jobsToSync = await db
          .select()
          .from(serviceTitanJobs)
          .where(inArray(serviceTitanJobs.id, options.jobIds))
          .limit(options.batchSize || 100);
      }
      // Strategy 2: Sync recently modified jobs (default: last 30 days)
      else {
        const sinceDate = options.sinceDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        console.log(`[ServiceTitan Forms Sync] Syncing jobs modified since ${sinceDate.toISOString()}`);
        
        jobsToSync = await db
          .select()
          .from(serviceTitanJobs)
          .where(sql`${serviceTitanJobs.modifiedOn} >= ${sinceDate}`)
          .orderBy(sql`${serviceTitanJobs.modifiedOn} DESC`)
          .limit(options.batchSize || 100);
      }

      console.log(`[ServiceTitan Forms Sync] 📊 Processing ${jobsToSync.length} jobs...`);
      
      let totalFormsSynced = 0;
      let jobsProcessed = 0;

      // Process jobs in batches of 10 to avoid rate limiting
      const BATCH_SIZE = 10;
      for (let i = 0; i < jobsToSync.length; i += BATCH_SIZE) {
        const batch = jobsToSync.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (job) => {
          try {
            const forms = await this.getJobForms(job.id);
            
            if (forms.length === 0) {
              return;
            }

            // Process each form
            for (const form of forms) {
              try {
                // Parse form data to extract key fields
                const parsedFields = this.parseFormFields(form);
                const technicianNotes = this.extractTechnicianNotes(parsedFields);
                const customerConcerns = this.extractCustomerConcerns(parsedFields);
                const recommendationsMade = this.extractRecommendations(parsedFields);
                const equipmentCondition = this.extractEquipmentCondition(parsedFields);

                // Upsert to database
                await db
                  .insert(serviceTitanJobForms)
                  .values({
                    formId: form.id,
                    jobId: job.id,
                    customerId: job.customerId,
                    formTemplateId: form.formTemplate?.id || null,
                    formTemplateName: form.formTemplate?.name || null,
                    rawFormData: form,
                    parsedFields,
                    technicianNotes,
                    customerConcerns,
                    recommendationsMade,
                    equipmentCondition,
                    submittedOn: form.submittedOn ? new Date(form.submittedOn) : new Date(),
                    submittedBy: form.submittedBy?.name || null,
                    lastSyncedAt: new Date(),
                  })
                  .onConflictDoUpdate({
                    target: serviceTitanJobForms.formId,
                    set: {
                      rawFormData: form,
                      parsedFields,
                      technicianNotes,
                      customerConcerns,
                      recommendationsMade,
                      equipmentCondition,
                      lastSyncedAt: new Date(),
                    },
                  });

                totalFormsSynced++;
              } catch (error) {
                console.error(`[ServiceTitan Forms Sync] Error processing form ${form.id}:`, error);
              }
            }

            jobsProcessed++;
            
            if (jobsProcessed % 20 === 0) {
              console.log(`[ServiceTitan Forms Sync] Progress: ${jobsProcessed}/${jobsToSync.length} jobs processed`);
            }
          } catch (error) {
            console.error(`[ServiceTitan Forms Sync] Error syncing forms for job ${job.id}:`, error);
          }
        }));
      }

      const duration = Date.now() - startTime;
      console.log('[ServiceTitan Forms Sync] ✅ Sync complete!');
      console.log(`  - Jobs processed: ${jobsProcessed}`);
      console.log(`  - Forms synced: ${totalFormsSynced}`);
      console.log(`  - Duration: ${(duration / 1000).toFixed(1)}s`);

      return {
        formsCount: totalFormsSynced,
        jobsProcessed,
        duration,
      };
    } catch (error) {
      console.error('[ServiceTitan Forms Sync] ❌ Sync failed:', error);
      throw error;
    }
  }

  /**
   * Parse form fields into key-value pairs
   */
  private parseFormFields(form: any): Record<string, any> {
    const parsed: Record<string, any> = {};
    
    if (!form.fields || !Array.isArray(form.fields)) {
      return parsed;
    }

    for (const field of form.fields) {
      const key = field.name || field.label || `field_${field.id}`;
      parsed[key] = field.value || field.text || field.selectedOption || null;
    }

    return parsed;
  }

  /**
   * Extract technician notes from form fields
   */
  private extractTechnicianNotes(fields: Record<string, any>): string | null {
    // Common field names for technician notes
    const noteFields = [
      'technician_notes',
      'notes',
      'tech_notes',
      'comments',
      'observations',
      'findings',
      'service_notes',
      'job_notes',
    ];

    const notes: string[] = [];
    
    for (const [key, value] of Object.entries(fields)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z]/g, '');
      
      if (noteFields.some(f => lowerKey.includes(f.replace(/_/g, ''))) && value) {
        notes.push(String(value));
      }
    }

    return notes.length > 0 ? notes.join('\n\n') : null;
  }

  /**
   * Extract customer concerns from form fields
   */
  private extractCustomerConcerns(fields: Record<string, any>): string[] {
    const concerns: string[] = [];
    const concernKeywords = [
      'concern',
      'issue',
      'problem',
      'complaint',
      'worry',
    ];

    for (const [key, value] of Object.entries(fields)) {
      const lowerKey = key.toLowerCase();
      
      if (concernKeywords.some(k => lowerKey.includes(k)) && value) {
        concerns.push(String(value));
      }
    }

    return concerns;
  }

  /**
   * Extract recommendations from form fields
   */
  private extractRecommendations(fields: Record<string, any>): string[] {
    const recommendations: string[] = [];
    const recommendationKeywords = [
      'recommend',
      'suggestion',
      'should replace',
      'needs replacement',
      'should consider',
      'advise',
    ];

    for (const [key, value] of Object.entries(fields)) {
      const lowerKey = key.toLowerCase();
      const lowerValue = String(value || '').toLowerCase();
      
      if (recommendationKeywords.some(k => lowerKey.includes(k) || lowerValue.includes(k)) && value) {
        recommendations.push(String(value));
      }
    }

    return recommendations;
  }

  /**
   * Extract equipment condition assessment
   */
  private extractEquipmentCondition(fields: Record<string, any>): string | null {
    const conditionKeywords = [
      'condition',
      'status',
      'quality',
      'state',
    ];

    for (const [key, value] of Object.entries(fields)) {
      const lowerKey = key.toLowerCase();
      
      if (conditionKeywords.some(k => lowerKey.includes(k)) && value) {
        const lowerValue = String(value).toLowerCase();
        
        // Match common condition values
        if (lowerValue.includes('critical') || lowerValue.includes('failure')) return 'Critical';
        if (lowerValue.includes('poor') || lowerValue.includes('bad')) return 'Poor';
        if (lowerValue.includes('fair') || lowerValue.includes('okay')) return 'Fair';
        if (lowerValue.includes('good')) return 'Good';
        if (lowerValue.includes('excellent') || lowerValue.includes('great')) return 'Excellent';
        
        return String(value);
      }
    }

    return null;
  }

  /**
   * Marketing API Methods
   * NOTE: These methods use inferred API schemas based on ServiceTitan documentation patterns.
   * Adjust request/response structures as needed once exact schemas are confirmed.
   */

  /**
   * Get all marketing campaigns
   */
  async getCampaigns(): Promise<any[]> {
    try {
      const marketingUrl = `https://api.servicetitan.io/marketing/v2/tenant/${this.config.tenantId}/campaigns`;
      
      const response = await this.request<any>(marketingUrl, {}, true);
      
      // ServiceTitan typically returns { data: [...] }
      return response.data || response || [];
    } catch (error) {
      console.error('[ServiceTitan] Get campaigns error:', error);
      throw error;
    }
  }

  /**
   * Get a specific marketing campaign by ID
   */
  async getCampaign(campaignId: number): Promise<any> {
    try {
      const marketingUrl = `https://api.servicetitan.io/marketing/v2/tenant/${this.config.tenantId}/campaigns/${campaignId}`;
      
      return await this.request<any>(marketingUrl, {}, true);
    } catch (error) {
      console.error('[ServiceTitan] Get campaign error:', error);
      throw error;
    }
  }

  /**
   * Create a new marketing campaign in ServiceTitan
   * @param campaignData - Campaign creation data
   * @returns The created campaign with ServiceTitan ID
   */
  async createCampaign(campaignData: {
    name: string;
    categoryId?: number;
    active?: boolean;
    businessUnitId?: number;
    phoneNumber?: string;
  }): Promise<{ id: number; name: string }> {
    try {
      const marketingUrl = `https://api.servicetitan.io/marketing/v2/tenant/${this.config.tenantId}/campaigns`;
      
      // Build request body based on ServiceTitan patterns
      const requestBody = {
        name: campaignData.name,
        active: campaignData.active ?? true,
        ...(campaignData.categoryId && { categoryId: campaignData.categoryId }),
        ...(campaignData.businessUnitId && { businessUnitId: campaignData.businessUnitId }),
        ...(campaignData.phoneNumber && { phoneNumber: campaignData.phoneNumber }),
      };

      console.log('[ServiceTitan] Creating campaign:', requestBody);

      const response = await this.request<any>(marketingUrl, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }, true);

      console.log('[ServiceTitan] Campaign created:', response);

      return {
        id: response.id || response.data?.id,
        name: response.name || response.data?.name || campaignData.name,
      };
    } catch (error) {
      console.error('[ServiceTitan] Create campaign error:', error);
      throw error;
    }
  }

  /**
   * Get campaign categories for organizing campaigns
   */
  async getCampaignCategories(): Promise<any[]> {
    try {
      const marketingUrl = `https://api.servicetitan.io/marketing/v2/tenant/${this.config.tenantId}/campaign-categories`;
      
      const response = await this.request<any>(marketingUrl, {}, true);
      
      return response.data || response || [];
    } catch (error) {
      console.error('[ServiceTitan] Get campaign categories error:', error);
      throw error;
    }
  }

  /**
   * Update campaign costs for ROI tracking
   */
  async updateCampaignCost(campaignId: number, cost: {
    month: string; // Format: "YYYY-MM"
    amount: number;
  }): Promise<void> {
    try {
      const marketingUrl = `https://api.servicetitan.io/marketing/v2/tenant/${this.config.tenantId}/campaigns/${campaignId}/costs`;
      
      await this.request<any>(marketingUrl, {
        method: 'POST',
        body: JSON.stringify(cost),
      }, true);

      console.log('[ServiceTitan] Campaign cost updated');
    } catch (error) {
      console.error('[ServiceTitan] Update campaign cost error:', error);
      throw error;
    }
  }

  /**
   * Get all customers in bulk (for creating lookup maps)
   * Returns customer ID -> customer name mapping
   */
  async getAllCustomersMap(): Promise<Map<number, string>> {
    try {
      console.log('[ServiceTitan] Fetching all customers for lookup map...');
      
      const customerMap = new Map<number, string>();
      const PAGE_SIZE = 500;
      let page = 1;
      let hasMore = true;

      while (hasMore && page < 100) { // Max 50,000 customers
        const customersUrl = `https://api.servicetitan.io/crm/v2/tenant/${this.config.tenantId}/customers?page=${page}&pageSize=${PAGE_SIZE}`;
        const result = await this.request<{ data: any[]; hasMore: boolean }>(customersUrl, {}, true);
        
        const customers = result.data || [];
        console.log(`[ServiceTitan] Page ${page}: Fetched ${customers.length} customers`);
        
        // Add to map
        customers.forEach((customer: any) => {
          const name = customer.name || customer.companyName || `Customer #${customer.id}`;
          customerMap.set(customer.id, name);
        });
        
        hasMore = result.hasMore || false;
        page++;
        
        // Stop if we got less than a full page
        if (customers.length < PAGE_SIZE) {
          break;
        }
      }

      console.log(`[ServiceTitan] Created customer lookup map with ${customerMap.size} customers`);
      return customerMap;
    } catch (error) {
      console.error('[ServiceTitan] Error fetching customer map:', error);
      // Return empty map on error rather than failing
      return new Map();
    }
  }

  /**
   * Get all customer memberships from ServiceTitan
   * Returns all recurring service events (memberships) for all customers
   */
  async getAllMemberships(): Promise<any[]> {
    try {
      console.log('[ServiceTitan Memberships] Fetching all customer memberships...');
      
      // First, fetch all customers to create a lookup map
      const customerMap = await this.getAllCustomersMap();
      
      const membershipsUrl = `https://api.servicetitan.io/memberships/v2/tenant/${this.config.tenantId}/recurring-service-events?pageSize=500`;
      const result = await this.request<{ data: any[]; hasMore: boolean }>(membershipsUrl, {}, true);
      
      let allMemberships = result.data || [];
      let page = 1;
      let hasMore = result.hasMore || false;

      while (hasMore && page < 10) {
        page++;
        const nextPageUrl = `${membershipsUrl}&page=${page}`;
        const nextResult = await this.request<{ data: any[]; hasMore: boolean }>(nextPageUrl, {}, true);
        allMemberships = [...allMemberships, ...(nextResult.data || [])];
        hasMore = nextResult.hasMore || false;
      }

      console.log(`[ServiceTitan Memberships] Fetched ${allMemberships.length} total memberships`);
      
      return allMemberships.map((m: any) => ({
        id: m.id,
        customerId: m.customerId,
        customerName: customerMap.get(m.customerId) || m.customerName || 'Unknown Customer',
        membershipId: m.membershipId,
        membershipName: m.membershipName || m.locationRecurringServiceName || 'VIP Membership',
        status: m.status || 'Unknown',
        startDate: m.from || m.createdOn,
        expirationDate: m.to || m.expirationDate,
        renewalDate: m.date || m.nextScheduledDate,
        balance: parseFloat(m.balance || '0'),
        totalValue: parseFloat(m.total || '0'),
        description: m.memo || m.description || '',
        createdOn: m.createdOn,
        modifiedOn: m.modifiedOn,
        rawData: m,
      }));
    } catch (error) {
      console.error('[ServiceTitan Memberships] Error fetching all memberships:', error);
      throw error;
    }
  }

  /**
   * Update a customer membership status (expire/cancel/suspend)
   * Uses PATCH endpoint to edit customer membership
   */
  async updateMembershipStatus(membershipId: number, updates: {
    status?: string;
    expirationDate?: string;
    cancellationDate?: string;
  }): Promise<any> {
    try {
      console.log(`[ServiceTitan Memberships] Updating membership ${membershipId}:`, updates);
      
      const membershipsUrl = `https://api.servicetitan.io/memberships/v2/tenant/${this.config.tenantId}/customer-memberships/${membershipId}`;
      
      const requestBody: any = {};
      
      if (updates.status) {
        requestBody.status = updates.status;
      }
      
      if (updates.expirationDate) {
        requestBody.to = updates.expirationDate;
      }
      
      if (updates.cancellationDate) {
        requestBody.cancellationDate = updates.cancellationDate;
      }

      const response = await this.request<any>(membershipsUrl, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      }, true);

      console.log(`[ServiceTitan Memberships] Membership ${membershipId} updated successfully`);
      
      return response;
    } catch (error) {
      console.error(`[ServiceTitan Memberships] Error updating membership ${membershipId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update multiple memberships (for expiring old memberships)
   */
  async bulkUpdateMemberships(updates: Array<{
    membershipId: number;
    status?: string;
    expirationDate?: string;
    cancellationDate?: string;
  }>): Promise<{ success: number; failed: number; errors: any[] }> {
    console.log(`[ServiceTitan Memberships] Bulk updating ${updates.length} memberships...`);
    
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const update of updates) {
      try {
        await this.updateMembershipStatus(update.membershipId, {
          status: update.status,
          expirationDate: update.expirationDate,
          cancellationDate: update.cancellationDate,
        });
        success++;
      } catch (error) {
        failed++;
        errors.push({
          membershipId: update.membershipId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`[ServiceTitan Memberships] Bulk update complete: ${success} succeeded, ${failed} failed`);
    
    return { success, failed, errors };
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
 * Normalize phone number to digits only (strip formatting, country code, extensions)
 * (512) 555-1234 → 5125551234
 * +1-512-555-1234 → 5125551234
 * 512-555-1234 x123 → 5125551234
 * 512-555-1234 ext 123 → 5125551234
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove common extension markers before processing
  // Match: x123, ext 123, ext. 123, extension 123, #123
  const withoutExtension = phone.replace(/\s*(x|ext\.?|extension|#)\s*\d+/gi, '');
  
  // Remove all non-digits
  const digitsOnly = withoutExtension.replace(/\D/g, '');
  
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
