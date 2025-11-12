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
      const locationName = data.serviceLocation?.name || `${data.name} - Primary`;

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
      
      // Add contact using v2 workflow - link to both customer AND default location
      if (data.phone) {
        // Fetch the newly created location ID
        const locations = await this.getCustomerLocations(response.id);
        const defaultLocationId = locations.length > 0 ? locations[0].id : undefined;
        
        await this.createCompleteContact(response.id, {
          phone: data.phone,
          email: data.email ? data.email.split(',')[0].trim() : undefined, // Only use first email
        }, defaultLocationId); // Link to default location
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
      
      // Add contact using v2 workflow (link to location)
      if (data.phone) {
        await this.createCompleteContact(data.customerId, {
          phone: data.phone,
          email: data.email ? data.email.split(',')[0].trim() : undefined, // Only use first email
        }, response.id); // Pass locationId to link contact to location
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
   * Link contact to customer (Step 3 of contact creation workflow)
   */
  async linkContactToCustomer(customerId: number, contactId: string): Promise<void> {
    try {
      await serviceTitanAuth.makeRequest(
        `crm/v2/tenant/${this.tenantId}/customers/${customerId}/contacts`,
        {
          method: 'POST',
          body: JSON.stringify({ contactId }),
        }
      );

      console.log(`[ServiceTitan CRM] Linked contact ${contactId} to customer ${customerId}`);
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error linking contact ${contactId} to customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Link contact to location (Optional step 4 of contact creation workflow)
   */
  async linkContactToLocation(locationId: number, contactId: string): Promise<void> {
    try {
      await serviceTitanAuth.makeRequest(
        `crm/v2/tenant/${this.tenantId}/locations/${locationId}/contacts`,
        {
          method: 'POST',
          body: JSON.stringify({ contactId }),
        }
      );

      console.log(`[ServiceTitan CRM] Linked contact ${contactId} to location ${locationId}`);
    } catch (error) {
      console.error(`[ServiceTitan CRM] Error linking contact ${contactId} to location ${locationId}:`, error);
      throw error;
    }
  }

  /**
   * Complete contact creation workflow (all steps combined)
   * Creates person → adds phone → adds email → links to customer
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
  ): Promise<ServiceTitanContact> {
    try {
      // Step 1: Create contact person
      const contact = await this.createContactPerson({
        name: contactData.name,
        title: contactData.title,
      });

      // Step 2: Add phone contact method
      await this.createContactMethod(contact.id, {
        type: 'MobilePhone',
        value: contactData.phone,
        memo: contactData.phoneMemo || 'Primary contact',
      });

      // Step 3: Add email contact method (if provided)
      if (contactData.email) {
        await this.createContactMethod(contact.id, {
          type: 'Email',
          value: contactData.email,
          memo: contactData.emailMemo || 'Primary email',
        });
      }

      // Step 4: Link to customer
      await this.linkContactToCustomer(customerId, contact.id);

      // Step 5: Link to location (if provided)
      if (locationId) {
        await this.linkContactToLocation(locationId, contact.id);
      }

      console.log(`[ServiceTitan CRM] Created complete contact ${contact.id} for customer ${customerId}`);
      return contact;
    } catch (error) {
      console.error('[ServiceTitan CRM] Error in complete contact creation workflow:', error);
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
