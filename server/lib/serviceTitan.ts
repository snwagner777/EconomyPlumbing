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
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.authenticate();

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'ST-App-Key': this.config.appKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ServiceTitan API error: ${response.status} - ${errorText}`);
      }

      // Handle empty responses (204 No Content, etc.)
      const contentLength = response.headers.get('content-length');
      if (!contentLength || contentLength === '0') {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('[ServiceTitan] API request error:', error);
      throw error;
    }
  }

  /**
   * Search for customer by email or phone
   */
  async searchCustomer(email: string, phone: string): Promise<ServiceTitanCustomer | null> {
    try {
      // Search by email first
      const emailResults = await this.request<{ data: ServiceTitanCustomer[] }>(
        `/customers?email=${encodeURIComponent(email)}`
      );

      if (emailResults.data && emailResults.data.length > 0) {
        return emailResults.data[0];
      }

      // If not found by email, search by phone
      const phoneResults = await this.request<{ data: ServiceTitanCustomer[] }>(
        `/customers?phoneNumber=${encodeURIComponent(phone)}`
      );

      if (phoneResults.data && phoneResults.data.length > 0) {
        return phoneResults.data[0];
      }

      return null;
    } catch (error) {
      console.error('[ServiceTitan] Search customer error:', error);
      return null;
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
    const customerData = data.type === 'residential' 
      ? {
          name: data.name,
          email: data.email,
          phoneNumber: data.phone,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            zip: data.zip,
          },
          type: 'Residential',
        }
      : {
          name: data.companyName,
          email: data.email,
          phoneNumber: data.phone,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            zip: data.zip,
          },
          type: 'Commercial',
          contacts: [{
            name: data.contactName,
            email: data.email,
            phoneNumber: data.phone,
          }],
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
   * Create membership for customer
   */
  async createMembership(customerId: number, membershipTypeId: number): Promise<ServiceTitanMembership> {
    try {
      const membershipData = {
        customerId,
        membershipTypeId,
        // Add other required fields based on your membership setup
      };

      const result = await this.request<{ data: ServiceTitanMembership }>(
        '/memberships',
        {
          method: 'POST',
          body: JSON.stringify(membershipData),
        }
      );

      return result.data;
    } catch (error) {
      console.error('[ServiceTitan] Create membership error:', error);
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
   * 3. Create membership
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

      // Step 3: Create membership
      console.log('[ServiceTitan] Creating membership...');
      const membership = await this.createMembership(customer.id, membershipTypeId);
      console.log(`[ServiceTitan] Created membership with ID: ${membership.id}`);

      // Step 4: Get invoice ID and mark as paid
      // TODO: IMPORTANT - Update this based on your ServiceTitan API response
      // The actual invoice ID should come from:
      // 1. The membership creation response (if it includes invoiceId)
      // 2. A separate query to get the invoice (e.g., GET /invoices?customerId=X&membershipId=Y)
      // 3. The ServiceTitan webhook when the invoice is created
      // 
      // For now, we'll use the membership ID as a placeholder, but this MUST be updated
      // with the real invoice ID retrieval logic before production use.
      const invoiceId = membership.id; // PLACEHOLDER - replace with actual invoice ID
      
      console.log('[ServiceTitan] Marking invoice as paid...');
      await this.markInvoicePaid(invoiceId, purchaseData.amount / 100); // Convert cents to dollars
      console.log('[ServiceTitan] Invoice marked as paid');

      return {
        customerId: customer.id,
        membershipId: membership.id,
        invoiceId,
      };
    } catch (error) {
      console.error('[ServiceTitan] Process membership purchase error:', error);
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
