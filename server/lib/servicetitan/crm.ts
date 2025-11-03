/**
 * ServiceTitan CRM API - Customers and Locations
 * 
 * Handles customer and location creation/lookup with duplicate detection.
 */

import { serviceTitanAuth } from './auth';

interface ServiceTitanCustomer {
  id: number;
  name: string;
  type: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  contacts: Array<{
    id: number;
    type: string;
    value: string;
  }>;
}

interface ServiceTitanLocation {
  id: number;
  customerId: number;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  contacts: Array<{
    id: number;
    type: string;
    value: string;
  }>;
}

interface CreateCustomerData {
  name: string;
  phone: string;
  email?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface CreateLocationData {
  customerId: number;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  email?: string;
}

export class ServiceTitanCRM {
  private readonly tenantId: string;

  constructor() {
    this.tenantId = serviceTitanAuth.getTenantId();
  }

  /**
   * Find customer by phone or email (duplicate check)
   */
  async findCustomer(phone: string, email?: string): Promise<ServiceTitanCustomer | null> {
    try {
      // Search by phone first (most reliable)
      const phoneSearch = await serviceTitanAuth.makeRequest<{ data: ServiceTitanCustomer[] }>(
        `crm/v2/tenant/${this.tenantId}/customers?phone=${encodeURIComponent(phone)}&active=true`
      );

      if (phoneSearch.data && phoneSearch.data.length > 0) {
        console.log(`[ServiceTitan CRM] Found existing customer by phone: ${phoneSearch.data[0].id}`);
        return phoneSearch.data[0];
      }

      // Try email if provided
      if (email) {
        const emailSearch = await serviceTitanAuth.makeRequest<{ data: ServiceTitanCustomer[] }>(
          `crm/v2/tenant/${this.tenantId}/customers?email=${encodeURIComponent(email)}&active=true`
        );

        if (emailSearch.data && emailSearch.data.length > 0) {
          console.log(`[ServiceTitan CRM] Found existing customer by email: ${emailSearch.data[0].id}`);
          return emailSearch.data[0];
        }
      }

      return null;
    } catch (error) {
      console.error('[ServiceTitan CRM] Error finding customer:', error);
      throw error;
    }
  }

  /**
   * Create new customer in ServiceTitan
   */
  async createCustomer(data: CreateCustomerData): Promise<ServiceTitanCustomer> {
    try {
      const payload = {
        name: data.name,
        type: 'Residential', // Default to residential
        address: {
          street: data.address.street,
          city: data.address.city,
          state: data.address.state,
          zip: data.address.zip,
          country: 'USA',
        },
        contacts: [
          {
            type: 'MobilePhone',
            value: data.phone,
          },
          ...(data.email ? [{
            type: 'Email',
            value: data.email,
          }] : []),
        ],
      };

      const response = await serviceTitanAuth.makeRequest<ServiceTitanCustomer>(
        `crm/v2/tenant/${this.tenantId}/customers`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Created new customer: ${response.id}`);
      return response;
    } catch (error) {
      console.error('[ServiceTitan CRM] Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Find or create customer
   */
  async ensureCustomer(data: CreateCustomerData): Promise<ServiceTitanCustomer> {
    // Check for existing customer
    const existing = await this.findCustomer(data.phone, data.email);
    if (existing) {
      return existing;
    }

    // Create new customer
    return await this.createCustomer(data);
  }

  /**
   * Find location for customer by address
   */
  async findLocation(customerId: number, address: string): Promise<ServiceTitanLocation | null> {
    try {
      const response = await serviceTitanAuth.makeRequest<{ data: ServiceTitanLocation[] }>(
        `crm/v2/tenant/${this.tenantId}/locations?customerId=${customerId}&active=true`
      );

      if (!response.data || response.data.length === 0) {
        return null;
      }

      // Find matching address (fuzzy match on street)
      const normalizedSearch = address.toLowerCase().replace(/[^\w\s]/g, '');
      const match = response.data.find(loc => {
        const locStreet = loc.address.street.toLowerCase().replace(/[^\w\s]/g, '');
        return locStreet.includes(normalizedSearch) || normalizedSearch.includes(locStreet);
      });

      if (match) {
        console.log(`[ServiceTitan CRM] Found existing location: ${match.id}`);
      }

      return match || null;
    } catch (error) {
      console.error('[ServiceTitan CRM] Error finding location:', error);
      throw error;
    }
  }

  /**
   * Create new location for customer
   */
  async createLocation(data: CreateLocationData): Promise<ServiceTitanLocation> {
    try {
      const payload = {
        customerId: data.customerId,
        address: {
          street: data.address.street,
          city: data.address.city,
          state: data.address.state,
          zip: data.address.zip,
          country: 'USA',
        },
        contacts: [
          {
            type: 'MobilePhone',
            value: data.phone,
          },
          ...(data.email ? [{
            type: 'Email',
            value: data.email,
          }] : []),
        ],
      };

      const response = await serviceTitanAuth.makeRequest<ServiceTitanLocation>(
        `crm/v2/tenant/${this.tenantId}/locations`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Created new location: ${response.id}`);
      return response;
    } catch (error) {
      console.error('[ServiceTitan CRM] Error creating location:', error);
      throw error;
    }
  }

  /**
   * Find or create location for customer
   */
  async ensureLocation(customerId: number, data: CreateLocationData): Promise<ServiceTitanLocation> {
    // Check for existing location
    const existing = await this.findLocation(customerId, data.address.street);
    if (existing) {
      return existing;
    }

    // Create new location
    return await this.createLocation({ ...data, customerId });
  }

  /**
   * Create a pinned note on a location (e.g., gate code)
   */
  async createLocationNote(locationId: number, text: string, pinned: boolean = true): Promise<{ id: number }> {
    try {
      const payload = {
        text,
        pinned,
      };

      const response = await serviceTitanAuth.makeRequest<{ id: number }>(
        `crm/v2/tenant/${this.tenantId}/locations/${locationId}/notes`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Created ${pinned ? 'pinned ' : ''}note on location ${locationId}: ${response.id}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error creating note on location ${locationId}:`, error);
      throw error;
    }
  }
}

export const serviceTitanCRM = new ServiceTitanCRM();
