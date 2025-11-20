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
  customerType?: 'Residential' | 'Commercial';
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  };
  serviceLocation?: {
    name: string;
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface CreateLocationData {
  customerId: number;
  name?: string;
  address: {
    street: string;
    unit?: string; // CRITICAL: Unit field for apartments/suites
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  email?: string;
}

interface UpdateCustomerData {
  name?: string;
  address?: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface UpdateLocationData {
  name: string;
}

interface ServiceTitanContact {
  id: string; // GUID
  referenceId?: string;
  name?: string;
  title?: string;
  isArchived: boolean;
  createdOn: string;
  createdBy: number;
  modifiedOn: string;
  modifiedBy: number;
}

interface ServiceTitanContactMethod {
  id: string; // GUID
  contactId: string; // GUID
  referenceId?: string;
  type: 'MobilePhone' | 'Phone' | 'Email' | 'Fax';
  value: string;
  memo?: string;
  createdOn: string;
  createdBy: number;
  modifiedOn: string;
  modifiedBy: number;
}

interface CreateContactData {
  name?: string;
  title?: string;
  referenceId?: string;
}

interface UpdateContactData {
  name?: string;
  title?: string;
  isArchived?: boolean;
}

interface CreateContactMethodData {
  type: 'MobilePhone' | 'Phone' | 'Email' | 'Fax';
  value: string;
  memo?: string;
  referenceId?: string;
}

interface UpdateContactMethodData {
  value?: string;
  memo?: string;
}

export class ServiceTitanCRM {
  private readonly tenantId: string;

  constructor() {
    this.tenantId = serviceTitanAuth.getTenantId();
  }

  /**
   * Get customer by ID from ServiceTitan
   */
  async getCustomer(customerId: number): Promise<ServiceTitanCustomer | null> {
    try {
      const response = await serviceTitanAuth.makeRequest<ServiceTitanCustomer>(
        `crm/v2/tenant/${this.tenantId}/customers/${customerId}`,
        {
          method: 'GET',
        }
      );

      return response;
    } catch (error: any) {
      // If 404, customer doesn't exist
      if (error.response?.status === 404) {
        console.log(`[ServiceTitan CRM] Customer ${customerId} not found`);
        return null;
      }

      console.error('[ServiceTitan CRM] Error fetching customer:', error);
      throw error;
    }
  }

  /**
   * Get location by ID from ServiceTitan
   */
  async getLocation(locationId: number): Promise<ServiceTitanLocation | null> {
    try {
      const response = await serviceTitanAuth.makeRequest<ServiceTitanLocation>(
        `crm/v2/tenant/${this.tenantId}/locations/${locationId}`,
        {
          method: 'GET',
        }
      );

      return response;
    } catch (error: any) {
      // If 404, location doesn't exist
      if (error.response?.status === 404) {
        console.log(`[ServiceTitan CRM] Location ${locationId} not found`);
        return null;
      }

      console.error('[ServiceTitan CRM] Error fetching location:', error);
      throw error;
    }
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
   * Create new customer in ServiceTitan (v2 - WITHOUT embedded contacts)
   * After creating customer, use createCompleteContact() to add contacts via v2 workflow
   */
  async createCustomer(data: CreateCustomerData): Promise<ServiceTitanCustomer> {
    try {
      // Use service location if provided, otherwise use billing address
      const locationAddress = data.serviceLocation || data.address;
      // Use address for location name instead of appending "- Primary" to customer name
      const locationName = data.serviceLocation?.name || `${locationAddress.street}, ${locationAddress.city}`;

      const payload = {
        name: data.name,
        type: data.customerType || 'Residential',
        address: {
          street: data.address.street,
          unit: data.address.unit || undefined,
          city: data.address.city,
          state: data.address.state,
          zip: data.address.zip,
          country: 'USA',
        },
        locations: [
          {
            name: locationName,
            address: {
              street: locationAddress.street,
              unit: locationAddress.unit || undefined,
              city: locationAddress.city,
              state: locationAddress.state,
              zip: locationAddress.zip,
              country: 'USA',
            },
          },
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
      
      // Add contact methods using v2 API to both customer AND default location
      // Track errors to ensure we know when contacts fail
      const contactErrors: string[] = [];
      
      if (data.phone || data.email) {
        // Fetch the default location ID
        const locations = await this.getCustomerLocations(response.id);
        const defaultLocationId = locations.length > 0 ? locations[0].id : undefined;
        
        // Add phone contact
        if (data.phone) {
          try {
            await this.createCustomerContact(response.id, {
              type: 'MobilePhone',
              value: data.phone,
              memo: 'Primary contact',
            });
            console.log(`[ServiceTitan CRM] ✓ Added phone contact to customer ${response.id}: ${data.phone}`);
            
            // Also add to default location
            if (defaultLocationId) {
              await this.createLocationContact(defaultLocationId, {
                type: 'MobilePhone',
                value: data.phone,
                memo: 'Primary contact',
              });
              console.log(`[ServiceTitan CRM] ✓ Added phone contact to location ${defaultLocationId}: ${data.phone}`);
            }
          } catch (error: any) {
            const errorMsg = `Failed to add phone contact for customer ${response.id} (${data.name}): phone=${data.phone}, error=${error.message}`;
            console.error(`[ServiceTitan CRM] ❌ ${errorMsg}`);
            contactErrors.push(`Phone: ${error.message}`);
          }
        }
        
        // Add email contact
        if (data.email) {
          try {
            const firstEmail = data.email.split(',')[0].trim();
            await this.createCustomerContact(response.id, {
              type: 'Email',
              value: firstEmail,
              memo: 'Primary email',
            });
            console.log(`[ServiceTitan CRM] ✓ Added email contact to customer ${response.id}: ${firstEmail}`);
            
            // Also add to default location
            if (defaultLocationId) {
              await this.createLocationContact(defaultLocationId, {
                type: 'Email',
                value: firstEmail,
                memo: 'Primary email',
              });
              console.log(`[ServiceTitan CRM] ✓ Added email contact to location ${defaultLocationId}: ${firstEmail}`);
            }
          } catch (error: any) {
            const errorMsg = `Failed to add email contact for customer ${response.id} (${data.name}): email=${data.email}, error=${error.message}`;
            console.error(`[ServiceTitan CRM] ❌ ${errorMsg}`);
            contactErrors.push(`Email: ${error.message}`);
          }
        }
        
        // If contact creation failed, throw error with details
        if (contactErrors.length > 0) {
          const errorMessage = `Customer ${response.id} created but contact creation failed: ${contactErrors.join(', ')}`;
          console.error(`[ServiceTitan CRM] ⚠️  WARNING: ${errorMessage}`);
          throw new Error(errorMessage);
        }
      }

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
   * Get all locations for a customer from ServiceTitan
   */
  async getCustomerLocations(customerId: number): Promise<ServiceTitanLocation[]> {
    try {
      console.log(`[ServiceTitan CRM] Fetching all locations for customer ${customerId}`);
      
      const response = await serviceTitanAuth.makeRequest<{ data: ServiceTitanLocation[] }>(
        `crm/v2/tenant/${this.tenantId}/locations?customerId=${customerId}&active=true`
      );

      const locations = response.data || [];
      console.log(`[ServiceTitan CRM] Found ${locations.length} locations for customer ${customerId}`);
      
      return locations;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error fetching locations for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Get all contacts for a customer
   * NOTE: Customer contacts API returns contact method objects directly (same as locations)
   * Response structure: { id, type, value, memo, phoneSettings, modifiedOn, createdOn, preferences }
   */
  async getCustomerContacts(customerId: number): Promise<Array<{
    id: number;
    type: string;
    value: string;
    memo?: string;
    phoneSettings?: {
      phoneNumber: string;
      doNotText: boolean;
    };
    modifiedOn: string;
    createdOn: string;
    preferences?: {
      jobRemindersEnabled: boolean;
      marketingUpdatesEnabled: boolean;
      invoiceStatementNotification: boolean;
    };
  }>> {
    try {
      console.log(`[ServiceTitan CRM] Fetching all contacts for customer ${customerId}`);
      
      // Get customer contacts - returns contact method objects directly
      const response = await serviceTitanAuth.makeRequest<{ 
        data: Array<{
          id: number;
          type: string;
          value: string;
          memo?: string;
          phoneSettings?: {
            phoneNumber: string;
            doNotText: boolean;
          };
          modifiedOn: string;
          createdOn: string;
          preferences?: {
            jobRemindersEnabled: boolean;
            marketingUpdatesEnabled: boolean;
            invoiceStatementNotification: boolean;
          };
        }> 
      }>(
        `crm/v2/tenant/${this.tenantId}/customers/${customerId}/contacts`
      );

      const contacts = response.data || [];
      console.log(`[ServiceTitan CRM] Found ${contacts.length} contacts for customer ${customerId}`);
      
      return contacts;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error fetching contacts for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Create a contact on a customer
   * Uses ServiceTitan's documented POST /customers/{id}/contacts endpoint
   */
  async createCustomerContact(
    customerId: number,
    contactData: {
      type: 'MobilePhone' | 'Phone' | 'Email' | 'Fax';
      value: string;
      memo?: string;
    }
  ): Promise<{
    id: number;
    type: string;
    value: string;
    memo?: string;
    phoneSettings?: {
      phoneNumber: string;
      doNotText: boolean;
    };
    modifiedOn: string;
    createdOn: string;
    preferences?: {
      jobRemindersEnabled: boolean;
      marketingUpdatesEnabled: boolean;
      invoiceStatementNotification: boolean;
    };
  }> {
    try {
      const payload = {
        type: contactData.type,
        value: contactData.value,
        memo: contactData.memo || undefined,
      };

      const response = await serviceTitanAuth.makeRequest<{
        id: number;
        type: string;
        value: string;
        memo?: string;
        phoneSettings?: {
          phoneNumber: string;
          doNotText: boolean;
        };
        modifiedOn: string;
        createdOn: string;
        preferences?: {
          jobRemindersEnabled: boolean;
          marketingUpdatesEnabled: boolean;
          invoiceStatementNotification: boolean;
        };
      }>(
        `crm/v2/tenant/${this.tenantId}/customers/${customerId}/contacts`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Created ${contactData.type} contact on customer ${customerId}: ${response.id}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error creating contact on customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Update a contact on a customer
   * Uses ServiceTitan's documented PATCH /customers/{id}/contacts/{contactId} endpoint
   */
  async updateCustomerContact(
    customerId: number,
    contactId: number,
    updateData: {
      type?: 'MobilePhone' | 'Phone' | 'Email' | 'Fax';
      value?: string;
      memo?: string;
      preferences?: {
        jobRemindersEnabled?: boolean;
        marketingUpdatesEnabled?: boolean;
        invoiceStatementNotification?: boolean;
      };
    }
  ): Promise<{
    id: number;
    type: string;
    value: string;
    memo?: string;
    phoneSettings?: {
      phoneNumber: string;
      doNotText: boolean;
    };
    modifiedOn: string;
    createdOn: string;
    preferences?: {
      jobRemindersEnabled: boolean;
      marketingUpdatesEnabled: boolean;
      invoiceStatementNotification: boolean;
    };
  }> {
    try {
      const payload: any = {};
      
      if (updateData.type !== undefined) {
        payload.type = updateData.type;
      }
      if (updateData.value !== undefined) {
        payload.value = updateData.value;
      }
      if (updateData.memo !== undefined) {
        payload.memo = updateData.memo;
      }
      if (updateData.preferences !== undefined) {
        payload.preferences = updateData.preferences;
      }

      const response = await serviceTitanAuth.makeRequest<{
        id: number;
        type: string;
        value: string;
        memo?: string;
        phoneSettings?: {
          phoneNumber: string;
          doNotText: boolean;
        };
        modifiedOn: string;
        createdOn: string;
        preferences?: {
          jobRemindersEnabled: boolean;
          marketingUpdatesEnabled: boolean;
          invoiceStatementNotification: boolean;
        };
      }>(
        `crm/v2/tenant/${this.tenantId}/customers/${customerId}/contacts/${contactId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Updated contact ${contactId} on customer ${customerId}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error updating contact ${contactId} on customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a contact from a customer
   * Uses ServiceTitan's documented DELETE /customers/{id}/contacts/{contactId} endpoint
   */
  async deleteCustomerContact(customerId: number, contactId: number): Promise<void> {
    try {
      await serviceTitanAuth.makeRequest(
        `crm/v2/tenant/${this.tenantId}/customers/${customerId}/contacts/${contactId}`,
        {
          method: 'DELETE',
        }
      );

      console.log(`[ServiceTitan CRM] Deleted contact ${contactId} from customer ${customerId}`);
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error deleting contact ${contactId} from customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Get all contacts linked to a specific location
   * NOTE: Location contacts API returns contact method objects directly (not contact person IDs)
   * Response structure: { id, type, value, memo, phoneSettings, modifiedOn, createdOn, preferences }
   */
  async getLocationContacts(locationId: number): Promise<Array<{
    id: number;
    type: string;
    value: string;
    memo?: string;
    phoneSettings?: {
      phoneNumber: string;
      doNotText: boolean;
    };
    modifiedOn: string;
    createdOn: string;
    preferences?: {
      jobRemindersEnabled: boolean;
      marketingUpdatesEnabled: boolean;
      invoiceStatementNotification: boolean;
    };
  }>> {
    try {
      console.log(`[ServiceTitan CRM] Fetching all contacts for location ${locationId}`);
      
      // Get location contacts - returns contact method objects directly
      const response = await serviceTitanAuth.makeRequest<{ 
        data: Array<{
          id: number;
          type: string;
          value: string;
          memo?: string;
          phoneSettings?: {
            phoneNumber: string;
            doNotText: boolean;
          };
          modifiedOn: string;
          createdOn: string;
          preferences?: {
            jobRemindersEnabled: boolean;
            marketingUpdatesEnabled: boolean;
            invoiceStatementNotification: boolean;
          };
        }> 
      }>(
        `crm/v2/tenant/${this.tenantId}/locations/${locationId}/contacts`
      );

      const contacts = response.data || [];
      console.log(`[ServiceTitan CRM] Found ${contacts.length} contacts for location ${locationId}`);
      
      return contacts;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error fetching contacts for location ${locationId}:`, error);
      throw error;
    }
  }

  /**
   * Create a contact on a location
   * Uses ServiceTitan's documented POST /locations/{id}/contacts endpoint
   */
  async createLocationContact(
    locationId: number,
    contactData: {
      type: 'MobilePhone' | 'Phone' | 'Email' | 'Fax';
      value: string;
      memo?: string;
    }
  ): Promise<{
    id: number;
    type: string;
    value: string;
    memo?: string;
    phoneSettings?: {
      phoneNumber: string;
      doNotText: boolean;
    };
    modifiedOn: string;
    createdOn: string;
    preferences?: {
      jobRemindersEnabled: boolean;
      marketingUpdatesEnabled: boolean;
      invoiceStatementNotification: boolean;
    };
  }> {
    try {
      const payload = {
        type: contactData.type,
        value: contactData.value,
        memo: contactData.memo || undefined,
      };

      const response = await serviceTitanAuth.makeRequest<{
        id: number;
        type: string;
        value: string;
        memo?: string;
        phoneSettings?: {
          phoneNumber: string;
          doNotText: boolean;
        };
        modifiedOn: string;
        createdOn: string;
        preferences?: {
          jobRemindersEnabled: boolean;
          marketingUpdatesEnabled: boolean;
          invoiceStatementNotification: boolean;
        };
      }>(
        `crm/v2/tenant/${this.tenantId}/locations/${locationId}/contacts`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Created ${contactData.type} contact on location ${locationId}: ${response.id}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error creating contact on location ${locationId}:`, error);
      throw error;
    }
  }

  /**
   * Update a contact on a location
   * Uses ServiceTitan's documented PATCH /locations/{id}/contacts/{contactId} endpoint
   */
  async updateLocationContact(
    locationId: number,
    contactId: number,
    updateData: {
      type?: 'MobilePhone' | 'Phone' | 'Email' | 'Fax';
      value?: string;
      memo?: string;
      preferences?: {
        jobRemindersEnabled?: boolean;
        marketingUpdatesEnabled?: boolean;
        invoiceStatementNotification?: boolean;
      };
    }
  ): Promise<{
    id: number;
    type: string;
    value: string;
    memo?: string;
    phoneSettings?: {
      phoneNumber: string;
      doNotText: boolean;
    };
    modifiedOn: string;
    createdOn: string;
    preferences?: {
      jobRemindersEnabled: boolean;
      marketingUpdatesEnabled: boolean;
      invoiceStatementNotification: boolean;
    };
  }> {
    try {
      const payload: any = {};
      
      if (updateData.type !== undefined) {
        payload.type = updateData.type;
      }
      if (updateData.value !== undefined) {
        payload.value = updateData.value;
      }
      if (updateData.memo !== undefined) {
        payload.memo = updateData.memo;
      }
      if (updateData.preferences !== undefined) {
        payload.preferences = updateData.preferences;
      }

      const response = await serviceTitanAuth.makeRequest<{
        id: number;
        type: string;
        value: string;
        memo?: string;
        phoneSettings?: {
          phoneNumber: string;
          doNotText: boolean;
        };
        modifiedOn: string;
        createdOn: string;
        preferences?: {
          jobRemindersEnabled: boolean;
          marketingUpdatesEnabled: boolean;
          invoiceStatementNotification: boolean;
        };
      }>(
        `crm/v2/tenant/${this.tenantId}/locations/${locationId}/contacts/${contactId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Updated contact ${contactId} on location ${locationId}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error updating contact ${contactId} on location ${locationId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a contact from a location
   * Uses ServiceTitan's documented DELETE /locations/{id}/contacts/{contactId} endpoint
   */
  async deleteLocationContact(locationId: number, contactId: number): Promise<void> {
    try {
      await serviceTitanAuth.makeRequest(
        `crm/v2/tenant/${this.tenantId}/locations/${locationId}/contacts/${contactId}`,
        {
          method: 'DELETE',
        }
      );

      console.log(`[ServiceTitan CRM] Deleted contact ${contactId} from location ${locationId}`);
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error deleting contact ${contactId} from location ${locationId}:`, error);
      throw error;
    }
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
   * Create new location for customer (v2 - WITHOUT embedded contacts)
   * After creating location, use createCompleteContact() to add contacts via v2 workflow
   */
  async createLocation(data: CreateLocationData): Promise<ServiceTitanLocation> {
    try {
      // Generate location name from address if not provided
      const locationName = data.name || `${data.address.street}, ${data.address.city}`;
      
      const payload = {
        customerId: data.customerId,
        name: locationName,
        body: `Service location: ${locationName}`,
        address: {
          street: data.address.street,
          unit: data.address.unit || undefined, // CRITICAL: Include unit for apartments/suites
          city: data.address.city,
          state: data.address.state,
          zip: data.address.zip,
          country: 'USA',
        },
      };

      const response = await serviceTitanAuth.makeRequest<ServiceTitanLocation>(
        `crm/v2/tenant/${this.tenantId}/locations`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Created new location: ${response.id}`);
      
      // Add contact methods to location using v2 API
      if (data.phone) {
        try {
          // Create phone contact on location
          await this.createLocationContact(response.id, {
            type: 'MobilePhone',
            value: data.phone,
            memo: 'Primary contact',
          });
          console.log(`[ServiceTitan CRM] Added phone contact to location ${response.id}`);
        } catch (error: any) {
          // Log but don't fail location creation if contact fails
          console.error(`[ServiceTitan CRM] Failed to add phone contact to location: ${error.message}`);
        }
      }
      
      if (data.email) {
        try {
          // Create email contact on location
          const firstEmail = data.email.split(',')[0].trim();
          await this.createLocationContact(response.id, {
            type: 'Email',
            value: firstEmail,
            memo: 'Primary email',
          });
          console.log(`[ServiceTitan CRM] Added email contact to location ${response.id}`);
        } catch (error: any) {
          // Log but don't fail location creation if contact fails
          console.error(`[ServiceTitan CRM] Failed to add email contact to location: ${error.message}`);
        }
      }

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

  /**
   * Update location active status (deactivate/reactivate)
   */
  async updateLocationStatus(locationId: number, active: boolean): Promise<void> {
    try {
      await serviceTitanAuth.makeRequest(
        `crm/v2/tenant/${this.tenantId}/locations/${locationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ active }),
        }
      );

      console.log(`[ServiceTitan CRM] ${active ? 'Activated' : 'Deactivated'} location ${locationId}`);
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error updating location ${locationId}:`, error);
      throw error;
    }
  }

  /**
   * Update customer (billing address and name only)
   * SELF-SERVICE: Customers can edit name and billing address
   */
  async updateCustomer(customerId: number, data: UpdateCustomerData): Promise<ServiceTitanCustomer> {
    try {
      const payload: any = {};
      
      if (data.name !== undefined) {
        payload.name = data.name;
      }
      
      if (data.address) {
        payload.address = {
          street: data.address.street,
          unit: data.address.unit || undefined,
          city: data.address.city,
          state: data.address.state,
          zip: data.address.zip,
          country: 'USA',
        };
      }

      const response = await serviceTitanAuth.makeRequest<ServiceTitanCustomer>(
        `crm/v2/tenant/${this.tenantId}/customers/${customerId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Updated customer ${customerId}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error updating customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Update location (name only - address is OFFICE MANAGED)
   * SELF-SERVICE: Customers can rename locations but CANNOT edit service addresses
   */
  async updateLocation(locationId: number, data: UpdateLocationData): Promise<ServiceTitanLocation> {
    try {
      const response = await serviceTitanAuth.makeRequest<ServiceTitanLocation>(
        `crm/v2/tenant/${this.tenantId}/locations/${locationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ name: data.name }),
        }
      );

      console.log(`[ServiceTitan CRM] Updated location ${locationId} name to "${data.name}"`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error updating location ${locationId}:`, error);
      throw error;
    }
  }

  /**
   * Create contact person entity (Step 1 of contact creation workflow)
   * Returns GUID contactId for use in subsequent steps
   */
  async createContactPerson(data: CreateContactData): Promise<ServiceTitanContact> {
    try {
      const payload = {
        name: data.name || undefined,
        title: data.title || undefined,
        referenceId: data.referenceId || undefined,
      };

      const response = await serviceTitanAuth.makeRequest<ServiceTitanContact>(
        `crm/v2/tenant/${this.tenantId}/contacts`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Created contact person: ${response.id}`);
      return response;
    } catch (error) {
      console.error('[ServiceTitan CRM] Error creating contact person:', error);
      throw error;
    }
  }

  /**
   * Add contact method to contact person (Step 2 of contact creation workflow)
   * Must be called separately for each method (phone, email)
   */
  async createContactMethod(contactId: string, data: CreateContactMethodData): Promise<ServiceTitanContactMethod> {
    try {
      const payload = {
        type: data.type,
        value: data.value,
        memo: data.memo || undefined,
        referenceId: data.referenceId || undefined,
      };

      const response = await serviceTitanAuth.makeRequest<ServiceTitanContactMethod>(
        `crm/v2/tenant/${this.tenantId}/contacts/${contactId}/contact-methods`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Added ${data.type} contact method to contact ${contactId}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error creating contact method for ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * @deprecated Use createCustomerContact() instead - this workflow is incompatible with v2 API
   * The v2 API expects { type, value, memo } not { contactId }
   */
  async linkContactToCustomer(customerId: number, contactId: string): Promise<void> {
    console.warn('[ServiceTitan CRM] DEPRECATED: linkContactToCustomer uses incompatible v2 workflow. Use createCustomerContact() instead.');
    throw new Error('linkContactToCustomer is deprecated - use createCustomerContact() with { type, value, memo } payload');
  }

  /**
   * @deprecated Use createLocationContact() instead - this workflow is incompatible with v2 API
   * The v2 API expects { type, value, memo } not { contactId }
   */
  async linkContactToLocation(locationId: number, contactId: string): Promise<void> {
    console.warn('[ServiceTitan CRM] DEPRECATED: linkContactToLocation uses incompatible v2 workflow. Use createLocationContact() instead.');
    throw new Error('linkContactToLocation is deprecated - use createLocationContact() with { type, value, memo } payload');
  }

  /**
   * @deprecated Use createCustomerContact()/createLocationContact() directly - simpler v2 API
   * Complete contact creation workflow (all steps combined)
   * 
   * REFACTORED: Now uses the simpler v2 contact methods API instead of complex person workflow
   */
  async createCompleteContact(
    customerId: number,
    contactData: {
      name?: string;
      title?: string;
      phone: string;
      email?: string;
      phoneMemo?: string;
      emailMemo?: string;
    },
    locationId?: number
  ): Promise<any> {
    try {
      console.log(`[ServiceTitan CRM] Creating contact for customer ${customerId} using v2 API`);
      
      const createdContacts: any[] = [];
      
      // Create phone contact on customer
      const phoneContact = await this.createCustomerContact(customerId, {
        type: 'MobilePhone',
        value: contactData.phone,
        memo: contactData.phoneMemo || 'Primary contact',
      });
      createdContacts.push(phoneContact);
      
      // Create email contact on customer (if provided)
      if (contactData.email) {
        const emailContact = await this.createCustomerContact(customerId, {
          type: 'Email',
          value: contactData.email,
          memo: contactData.emailMemo || 'Primary email',
        });
        createdContacts.push(emailContact);
      }
      
      // Also create on location if provided
      if (locationId) {
        await this.createLocationContact(locationId, {
          type: 'MobilePhone',
          value: contactData.phone,
          memo: contactData.phoneMemo || 'Primary contact',
        });
        
        if (contactData.email) {
          await this.createLocationContact(locationId, {
            type: 'Email',
            value: contactData.email,
            memo: contactData.emailMemo || 'Primary email',
          });
        }
      }
      
      console.log(`[ServiceTitan CRM] Created ${createdContacts.length} contact methods for customer ${customerId}`);
      return phoneContact; // Return first contact for backwards compat
    } catch (error) {
      console.error('[ServiceTitan CRM] Error in contact creation:', error);
      throw error;
    }
  }

  /**
   * Find or create contact with deduplication (PREVENTS DUPLICATE CONTACTS)
   * 
   * Searches for existing contact with matching phone/email BEFORE creating new one.
   * This prevents the duplicate contact bug where every login/booking creates new contacts.
   * 
   * @param customerId - Customer to link contact to
   * @param contactData - Contact phone/email to search for
   * @param locationId - Optional location to link contact to
   * @returns Existing contact if found, new contact if not
   */
  /**
   * Normalize phone number to canonical 10-digit format for deduplication
   * Handles U.S. phone numbers with various formats:
   * - (512) 755-5037 → 5127555037
   * - +1-512-755-5037 → 5127555037
   * - 15127555037 → 5127555037
   */
  private normalizePhoneForDedup(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');
    
    // If 11 digits starting with '1' (U.S. country code), remove leading '1'
    if (normalized.length === 11 && normalized.startsWith('1')) {
      normalized = normalized.substring(1);
    }
    
    return normalized;
  }

  async findOrCreateCompleteContact(
    customerId: number,
    contactData: {
      name?: string;
      title?: string;
      phone: string;
      email?: string;
      phoneMemo?: string;
      emailMemo?: string;
    },
    locationId?: number
  ): Promise<any> {
    try {
      // Normalize phone (remove non-digits and handle country code)
      const normalizedPhone = this.normalizePhoneForDedup(contactData.phone);
      const normalizedEmail = contactData.email?.toLowerCase().trim();

      // Validate phone is 10 digits after normalization
      if (normalizedPhone.length !== 10) {
        console.warn(`[ServiceTitan CRM] Warning: Normalized phone ${normalizedPhone} is not 10 digits - proceeding anyway`);
      }

      console.log(`[ServiceTitan CRM] Searching for existing contact - Phone: ${normalizedPhone}, Email: ${normalizedEmail || 'none'}`);

      // Get all contact methods for this customer (v2 API returns contact methods directly)
      const existingContacts = await this.getCustomerContacts(customerId);

      // Search for matching contact method by phone or email
      for (const contactMethod of existingContacts) {
        // Match phone (normalize both sides with canonical format)
        if (contactMethod.type === 'MobilePhone' || contactMethod.type === 'Phone') {
          const existingNormalizedPhone = this.normalizePhoneForDedup(contactMethod.value);
          if (existingNormalizedPhone === normalizedPhone) {
            console.log(`[ServiceTitan CRM] ✅ Found existing contact method ${contactMethod.id} with matching phone`);
            
            // If locationId provided, also create on location if it doesn't exist
            if (locationId) {
              try {
                // Check if location already has this contact
                const locationContacts = await this.getLocationContacts(locationId);
                const phoneExistsOnLocation = locationContacts.some(lc => {
                  if (lc.type === 'MobilePhone' || lc.type === 'Phone') {
                    return this.normalizePhoneForDedup(lc.value) === normalizedPhone;
                  }
                  return false;
                });
                
                if (!phoneExistsOnLocation) {
                  await this.createLocationContact(locationId, {
                    type: 'MobilePhone',
                    value: contactData.phone,
                    memo: contactData.phoneMemo || 'Primary contact',
                  });
                  console.log(`[ServiceTitan CRM] Added phone contact to location ${locationId}`);
                }
              } catch (error: any) {
                console.error(`[ServiceTitan CRM] Failed to add contact to location: ${error.message}`);
              }
            }
            
            return contactMethod;
          }
        }

        // Match email (case-insensitive)
        if (normalizedEmail && contactMethod.type === 'Email') {
          const existingNormalizedEmail = contactMethod.value.toLowerCase().trim();
          if (existingNormalizedEmail === normalizedEmail) {
            console.log(`[ServiceTitan CRM] ✅ Found existing contact method ${contactMethod.id} with matching email`);
            
            // If locationId provided, also create on location if it doesn't exist
            if (locationId && contactData.email) {
              try {
                const locationContacts = await this.getLocationContacts(locationId);
                const emailExistsOnLocation = locationContacts.some(lc => 
                  lc.type === 'Email' && lc.value.toLowerCase().trim() === normalizedEmail
                );
                
                if (!emailExistsOnLocation) {
                  await this.createLocationContact(locationId, {
                    type: 'Email',
                    value: contactData.email,
                    memo: contactData.emailMemo || 'Primary email',
                  });
                  console.log(`[ServiceTitan CRM] Added email contact to location ${locationId}`);
                }
              } catch (error: any) {
                console.error(`[ServiceTitan CRM] Failed to add email to location: ${error.message}`);
              }
            }
            
            return contactMethod;
          }
        }
      }

      // No match found - create new contact using v2 API
      console.log(`[ServiceTitan CRM] ❌ No existing contact found - creating new one`);
      return await this.createCompleteContact(customerId, contactData, locationId);
    } catch (error) {
      console.error('[ServiceTitan CRM] Error in find or create contact:', error);
      throw error;
    }
  }

  /**
   * Update contact person (name/title only)
   * SELF-SERVICE: Customers can edit contact name and title
   */
  async updateContactPerson(contactId: string, data: UpdateContactData): Promise<ServiceTitanContact> {
    try {
      const payload: any = {};
      
      if (data.name !== undefined) {
        payload.name = data.name;
      }
      if (data.title !== undefined) {
        payload.title = data.title;
      }
      if (data.isArchived !== undefined) {
        payload.isArchived = data.isArchived;
      }

      const response = await serviceTitanAuth.makeRequest<ServiceTitanContact>(
        `crm/v2/tenant/${this.tenantId}/contacts/${contactId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Updated contact person ${contactId}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error updating contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Update contact method (phone/email value or memo)
   * SELF-SERVICE: Customers can update phone numbers and email addresses
   */
  async updateContactMethod(
    contactId: string,
    contactMethodId: string,
    data: UpdateContactMethodData
  ): Promise<ServiceTitanContactMethod> {
    try {
      const payload: any = {};
      
      if (data.value !== undefined) {
        payload.value = data.value;
      }
      if (data.memo !== undefined) {
        payload.memo = data.memo;
      }

      const response = await serviceTitanAuth.makeRequest<ServiceTitanContactMethod>(
        `crm/v2/tenant/${this.tenantId}/contacts/${contactId}/contact-methods/${contactMethodId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan CRM] Updated contact method ${contactMethodId} for contact ${contactId}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error updating contact method ${contactMethodId}:`, error);
      throw error;
    }
  }

  /**
   * Delete contact (hard delete - removes contact person and all methods)
   * WARNING: Enforce minimum 1 contact rule before calling this
   */
  async deleteContact(contactId: string): Promise<void> {
    try {
      await serviceTitanAuth.makeRequest(
        `crm/v2/tenant/${this.tenantId}/contacts/${contactId}`,
        {
          method: 'DELETE',
        }
      );

      console.log(`[ServiceTitan CRM] Deleted contact ${contactId}`);
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error deleting contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Unlink contact from customer (soft delete - keeps contact but removes link)
   */
  async unlinkContactFromCustomer(customerId: number, contactId: string): Promise<void> {
    try {
      await serviceTitanAuth.makeRequest(
        `crm/v2/tenant/${this.tenantId}/customers/${customerId}/contacts/${contactId}`,
        {
          method: 'DELETE',
        }
      );

      console.log(`[ServiceTitan CRM] Unlinked contact ${contactId} from customer ${customerId}`);
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error unlinking contact ${contactId} from customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Delete contact method (removes phone/email from contact)
   */
  async deleteContactMethod(contactId: string, contactMethodId: string): Promise<void> {
    try {
      await serviceTitanAuth.makeRequest(
        `crm/v2/tenant/${this.tenantId}/contacts/${contactId}/contact-methods/${contactMethodId}`,
        {
          method: 'DELETE',
        }
      );

      console.log(`[ServiceTitan CRM] Deleted contact method ${contactMethodId} from contact ${contactId}`);
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error deleting contact method ${contactMethodId}:`, error);
      throw error;
    }
  }
}

export const serviceTitanCRM = new ServiceTitanCRM();
