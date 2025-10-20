import type { InsertServiceTitanMembership, InsertServiceTitanCustomer, InsertServiceTitanContact } from "@shared/schema";
import { db } from "../db";

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
      
      // ServiceTitan returns contacts with type 'Email', 'Phone', 'MobilePhone', etc.
      // Each contact has a 'value' field with the actual data
      const emailContact = contacts.find((c: any) => c.type === 'Email');
      const phoneContact = contacts.find((c: any) => c.type === 'Phone' || c.type === 'MobilePhone') || contacts.find((c: any) => c.phoneSettings);
      
      return {
        ...customerData,
        email: emailContact?.value || '',
        phoneNumber: phoneContact?.value || phoneContact?.phoneSettings?.phoneNumber || '',
      };
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
      // ServiceTitan memberships API endpoint (recurring service events)
      const membershipsUrl = `https://api.servicetitan.io/memberships/v2/tenant/${this.config.tenantId}/recurring-service-events?customerId=${customerId}&pageSize=50`;
      const result = await this.request<{ data: any[] }>(membershipsUrl, {}, true);
      
      console.log('[ServiceTitan] Memberships response:', JSON.stringify(result, null, 2).substring(0, 500));
      
      // Map memberships to display format
      const memberships = result.data || [];
      
      // Filter for active/won memberships and get unique membership types
      const activeMemberships = memberships.filter((m: any) => 
        m.status === 'Won' || m.status === 'Completed' || m.membershipName
      );
      
      // Group by membership to avoid duplicates
      const uniqueMemberships = new Map();
      activeMemberships.forEach((membership: any) => {
        const key = membership.membershipId || membership.membershipName;
        if (!uniqueMemberships.has(key) || new Date(membership.createdOn) > new Date(uniqueMemberships.get(key).startDate)) {
          uniqueMemberships.set(key, {
            id: membership.membershipId || membership.id,
            membershipType: membership.membershipName || membership.locationRecurringServiceName || 'VIP Membership',
            status: 'Active Member', // Show friendly status instead of raw API status
            startDate: membership.createdOn,
            expirationDate: membership.to || membership.expirationDate,
            renewalDate: membership.date || membership.nextScheduledDate,
            balance: parseFloat(membership.balance || '0'),
            totalValue: parseFloat(membership.total || '0'),
            description: membership.memo || membership.description || '',
            rawStatus: membership.status, // Keep original for reference
          });
        }
      });
      
      return Array.from(uniqueMemberships.values());
    } catch (error) {
      console.error('[ServiceTitan] Get customer memberships error:', error);
      // Return empty array on error rather than throwing
      return [];
    }
  }

  /**
   * Get customer estimates (open quotes/proposals)
   */
  async getCustomerEstimates(customerId: number): Promise<any[]> {
    try {
      // ServiceTitan Sales & Estimates API endpoint
      const salesUrl = `https://api.servicetitan.io/sales/v2/tenant/${this.config.tenantId}/estimates?customerId=${customerId}&pageSize=50`;
      const result = await this.request<{ data: any[] }>(salesUrl, {}, true);
      
      console.log('[ServiceTitan] Estimates response:', JSON.stringify(result, null, 2).substring(0, 500));
      
      // Map estimates to display format
      const estimates = result.data || [];
      
      // Filter for open/pending estimates
      const openEstimates = estimates.filter((est: any) => 
        est.status === 'Open' || est.status === 'Pending' || (!est.status && !est.soldOn)
      );
      
      return openEstimates.map((estimate: any) => ({
        id: estimate.id,
        estimateNumber: estimate.number || estimate.estimateNumber || estimate.id?.toString(),
        total: parseFloat(estimate.total || estimate.subtotal || '0'),
        status: estimate.status || 'Open',
        createdOn: estimate.createdOn || estimate.createdDate,
        expiresOn: estimate.expiresOn || estimate.expirationDate,
        jobId: estimate.jobId,
        jobNumber: estimate.job?.jobNumber || null,
        summary: estimate.name || estimate.summary || `Estimate #${estimate.number || estimate.id}`,
        items: estimate.items || [],
      }));
    } catch (error) {
      console.error('[ServiceTitan] Get customer estimates error:', error);
      // Return empty array on error rather than throwing
      return [];
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
      const pageSize = 200; // Increased from 50 to reduce API calls

      // Use upsert strategy - no deletion, just update existing records
      console.log('[ServiceTitan Sync] Using upsert strategy for zero-downtime sync...');

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
        for (const customer of customers) {
          try {
            // Insert customer
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
                lastSyncedAt: new Date(),
              },
            });
            
            totalCustomers++;

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

        page++;
        
        // Update heartbeat to prevent stale lock detection
        const { updateSyncHeartbeat } = await import('./serviceTitanSync');
        updateSyncHeartbeat();
        
        // Log progress every 10 pages
        if (page % 10 === 0) {
          console.log(`[ServiceTitan Sync] Progress: ${totalCustomers} customers, ${totalContacts} contacts`);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[ServiceTitan Sync] ✅ Completed! ${totalCustomers} customers, ${totalContacts} contacts in ${(duration / 1000).toFixed(1)}s`);
      
      return { customersCount: totalCustomers, contactsCount: totalContacts, duration };
    } catch (error) {
      console.error('[ServiceTitan Sync] Failed:', error);
      throw error;
    }
  }

  /**
   * Search for customer by phone or email in local cache
   * Returns customer ID if found
   */
  async searchLocalCustomer(phoneOrEmail: string): Promise<number | null> {
    try {
      const { serviceTitanContacts } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Normalize input
      const normalized = phoneOrEmail.includes('@') 
        ? normalizeEmail(phoneOrEmail)
        : normalizePhone(phoneOrEmail);
      
      if (!normalized) return null;

      // Search in contacts
      const results = await db
        .select({ customerId: serviceTitanContacts.customerId })
        .from(serviceTitanContacts)
        .where(eq(serviceTitanContacts.normalizedValue, normalized))
        .limit(1);

      return results.length > 0 ? results[0].customerId : null;
    } catch (error) {
      console.error('[ServiceTitan] Local search error:', error);
      return null;
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
   */
  async searchCustomerWithFallback(phoneOrEmail: string): Promise<number | null> {
    // Try local cache first (instant)
    const cachedCustomerId = await this.searchLocalCustomer(phoneOrEmail);
    if (cachedCustomerId) {
      console.log(`[ServiceTitan] ✅ Found customer ${cachedCustomerId} in local cache`);
      return cachedCustomerId;
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
        
        // Store customer
        await db.insert(serviceTitanCustomers).values({
          id: liveCustomer.id,
          name: liveCustomer.name || 'Unknown',
          type: (liveCustomer as any).type || 'Residential',
          street: liveCustomer.address?.street || null,
          city: liveCustomer.address?.city || null,
          state: liveCustomer.address?.state || null,
          zip: liveCustomer.address?.zip || null,
          active: true,
          balance: '0.00',
        }).onConflictDoUpdate({
          target: serviceTitanCustomers.id,
          set: { lastSyncedAt: new Date() },
        });

        // Store contacts
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
        
        console.log(`[ServiceTitan] ✅ Cached customer ${liveCustomer.id} for future searches`);
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
