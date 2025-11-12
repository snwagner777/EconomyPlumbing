/**
 * ServiceTitan Memberships API - VIP Membership Management
 * 
 * MODULAR ARCHITECTURE - Use from customer portal, scheduler, chatbot, or any context
 * All functions are pure business logic with no authentication/context dependencies
 */

import { serviceTitanAuth } from './auth';

// Membership Types
export interface MembershipType {
  id: number;
  name: string;
  displayName: string;
  active: boolean;
  discountMode: string;
  from: string; // ISO date
  to: string | null; // ISO date, null for ongoing
  duration: number | null; // In months, null for ongoing
  billingFrequency: 'OneTime' | 'Monthly' | 'EveryOtherMonth' | 'Quarterly' | 'BiAnnual' | 'Annual';
  deferredRevenue: boolean;
  createdOn: string;
  modifiedOn: string;
}

// Customer Memberships
export interface CustomerMembership {
  id: number;
  membershipTypeId: number;
  membershipTypeName: string;
  customerId: number;
  locationId: number | null;
  status: 'Active' | 'Suspended' | 'Expired' | 'Canceled' | 'Deleted';
  from: string; // ISO date
  to: string | null; // ISO date, null for ongoing
  duration: number | null; // In months
  billingFrequency: string;
  recurringServiceEventIds: number[];
  soldBy: number | null;
  followUpInvoiceId: number | null;
  cancellationDate: string | null;
  createdOn: string;
  modifiedOn: string;
}

// Membership Discounts
export interface MembershipDiscount {
  id: number;
  targetId: number; // Business Unit ID, Job Type ID, or SKU ID
  discount: number; // Percentage (e.g., 15 for 15%)
  createdOn: string;
  createdById: number;
}

// Recurring Service Items
export interface RecurringServiceItem {
  id: number;
  membershipTypeId: number;
  recurringServiceTypeId: number;
  offset: number; // Days from membership start
  offsetType: 'Days' | 'Months';
  allocation: number; // Number of services included
  importId: string | null;
  createdOn: string;
  createdById: number;
}

// Duration/Billing Options
export interface DurationBillingItem {
  id: number;
  membershipTypeId: number;
  duration: number | null; // Months, null for ongoing
  billingFrequency: 'OneTime' | 'Monthly' | 'EveryOtherMonth' | 'Quarterly' | 'BiAnnual' | 'Annual';
  initialBillingDelay: number; // Days
  price: number;
  createdOn: string;
  modifiedOn: string;
}

// Membership Sale Request
export interface CreateMembershipSaleRequest {
  customerId: number;
  businessUnitId: number;
  saleTaskId: number; // Task ID that creates the membership
  durationBillingId: number; // Which duration/billing option to use
  locationId?: number; // Discount location (null = all locations)
  recurringServiceAction?: 'All' | 'Single' | 'None'; // How to add recurring services
  recurringLocationId?: number; // Location for recurring services
}

// Membership Sale Response
export interface MembershipSaleResponse {
  invoiceId: number;
  customerMembershipId: number;
}

export class ServiceTitanMemberships {
  private readonly tenantId: string;
  private membershipTypesCache: { data: MembershipType[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.tenantId = serviceTitanAuth.getTenantId();
  }

  /**
   * Get all active membership types
   * MODULAR - Use to display available membership plans anywhere
   */
  async getMembershipTypes(options?: {
    active?: boolean;
    duration?: number; // Filter by duration in months
    billingFrequency?: 'OneTime' | 'Monthly' | 'EveryOtherMonth' | 'Quarterly' | 'BiAnnual' | 'Annual';
  }): Promise<MembershipType[]> {
    // Check cache first
    if (!options && this.membershipTypesCache && Date.now() - this.membershipTypesCache.timestamp < this.CACHE_TTL) {
      return this.membershipTypesCache.data;
    }

    try {
      const params = new URLSearchParams();
      if (options?.active !== undefined) params.append('active', options.active ? 'True' : 'False');
      if (options?.duration !== undefined) params.append('duration', options.duration.toString());
      if (options?.billingFrequency) params.append('billingFrequency', options.billingFrequency);
      params.append('includeDurationBilling', 'true');

      const queryString = params.toString();
      const url = `memberships/v2/tenant/${this.tenantId}/membership-types${queryString ? `?${queryString}` : ''}`;

      const response = await serviceTitanAuth.makeRequest<{ data: MembershipType[] }>(url);

      // Cache only if no filters applied
      if (!options) {
        this.membershipTypesCache = {
          data: response.data || [],
          timestamp: Date.now(),
        };
      }

      console.log(`[ServiceTitan Memberships] Fetched ${response.data?.length || 0} membership types`);
      return response.data || [];
    } catch (error) {
      console.error('[ServiceTitan Memberships] Error fetching membership types:', error);
      throw error;
    }
  }

  /**
   * Get memberships for a specific customer
   * MODULAR - Use in customer portal, chatbot, or any customer context
   */
  async getCustomerMemberships(
    customerId: number,
    options?: {
      status?: 'Active' | 'Suspended' | 'Expired' | 'Canceled' | 'Deleted';
      active?: boolean; // Shortcut for active memberships only
    }
  ): Promise<CustomerMembership[]> {
    try {
      const params = new URLSearchParams();
      params.append('customerIds', customerId.toString());
      if (options?.status) params.append('status', options.status);
      if (options?.active !== undefined) params.append('active', options.active ? 'True' : 'False');

      const response = await serviceTitanAuth.makeRequest<{ data: CustomerMembership[] }>(
        `memberships/v2/tenant/${this.tenantId}/memberships?${params.toString()}`
      );

      console.log(`[ServiceTitan Memberships] Fetched ${response.data?.length || 0} memberships for customer ${customerId}`);
      return response.data || [];
    } catch (error) {
      console.error(`[ServiceTitan Memberships] Error fetching memberships for customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Get discounts for a membership type
   * MODULAR - Use to show membership benefits
   */
  async getMembershipDiscounts(membershipTypeId: number): Promise<MembershipDiscount[]> {
    try {
      const response = await serviceTitanAuth.makeRequest<MembershipDiscount[]>(
        `memberships/v2/tenant/${this.tenantId}/membership-types/${membershipTypeId}/discounts`
      );

      console.log(`[ServiceTitan Memberships] Fetched ${response.length} discounts for membership type ${membershipTypeId}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan Memberships] Error fetching discounts for type ${membershipTypeId}:`, error);
      throw error;
    }
  }

  /**
   * Get recurring services included in a membership
   * MODULAR - Use to show membership benefits
   */
  async getRecurringServices(membershipTypeId: number): Promise<RecurringServiceItem[]> {
    try {
      const response = await serviceTitanAuth.makeRequest<RecurringServiceItem[]>(
        `memberships/v2/tenant/${this.tenantId}/membership-types/${membershipTypeId}/recurring-service-items`
      );

      console.log(`[ServiceTitan Memberships] Fetched ${response.length} recurring services for membership type ${membershipTypeId}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan Memberships] Error fetching recurring services for type ${membershipTypeId}:`, error);
      throw error;
    }
  }

  /**
   * Get duration/billing options for a membership type
   * MODULAR - Use to show pricing options
   */
  async getDurationBillingOptions(membershipTypeId: number): Promise<DurationBillingItem[]> {
    try {
      const response = await serviceTitanAuth.makeRequest<DurationBillingItem[]>(
        `memberships/v2/tenant/${this.tenantId}/membership-types/${membershipTypeId}/duration-billing-items`
      );

      console.log(`[ServiceTitan Memberships] Fetched ${response.length} billing options for membership type ${membershipTypeId}`);
      return response;
    } catch (error) {
      console.error(`[ServiceTitan Memberships] Error fetching billing options for type ${membershipTypeId}:`, error);
      throw error;
    }
  }

  /**
   * Create a membership sale invoice
   * MODULAR - Use from scheduler, customer portal, or any sales context
   * 
   * This creates the actual membership sale and invoice in ServiceTitan.
   * Use this instead of creating a generic job for membership purchases.
   */
  async createMembershipSale(request: CreateMembershipSaleRequest): Promise<MembershipSaleResponse> {
    try {
      const payload = {
        customerId: request.customerId,
        businessUnitId: request.businessUnitId,
        saleTaskId: request.saleTaskId,
        durationBillingId: request.durationBillingId,
        locationId: request.locationId || null,
        recurringServiceAction: request.recurringServiceAction || 'All',
        recurringLocationId: request.recurringLocationId || null,
      };

      const response = await serviceTitanAuth.makeRequest<MembershipSaleResponse>(
        `memberships/v2/tenant/${this.tenantId}/memberships/sale`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      console.log(`[ServiceTitan Memberships] Created membership sale - Invoice: ${response.invoiceId}, Membership: ${response.customerMembershipId}`);
      return response;
    } catch (error) {
      console.error('[ServiceTitan Memberships] Error creating membership sale:', error);
      throw error;
    }
  }

  /**
   * Clear cached membership types
   */
  clearCache(): void {
    this.membershipTypesCache = null;
  }
}

export const serviceTitanMemberships = new ServiceTitanMemberships();
