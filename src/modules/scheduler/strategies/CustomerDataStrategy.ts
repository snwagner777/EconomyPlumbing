/**
 * CustomerDataStrategy - Strategy Pattern for Customer Data Collection
 * 
 * Enables SchedulerBridge to support both:
 * - Public users (need to collect customer info)
 * - Authenticated users (already have customer data)
 * 
 * ARCHITECTURE:
 * - Strategy switches based on customerId presence
 * - PublicCustomerStrategy: Adds customer info step before service selection
 * - AuthenticatedCustomerStrategy: Skips customer step, uses existing data
 */

import type { CustomerInfo } from '@shared/types/scheduler';

/**
 * Strategy interface for customer data collection.
 */
export interface CustomerDataStrategy {
  /**
   * Whether this strategy requires collecting customer info upfront.
   */
  requiresCustomerStep: boolean;

  /**
   * Get the customer info for booking.
   * - Public: returns collected form data
   * - Authenticated: fetches from ServiceTitan API
   */
  getCustomerInfo(): Promise<CustomerInfo | null>;

  /**
   * Get the customer ID for booking.
   * - Public: created after form submission
   * - Authenticated: provided upfront
   */
  getCustomerId(): number | null;

  /**
   * Get the location ID for booking.
   * - Public: created with customer
   * - Authenticated: selected from customer's locations
   */
  getLocationId(): number | null;
}

/**
 * Public Customer Strategy
 * Collects customer information via form before service selection.
 */
export class PublicCustomerStrategy implements CustomerDataStrategy {
  requiresCustomerStep = true;
  
  private collectedInfo: CustomerInfo | null = null;
  private createdCustomerId: number | null = null;
  private createdLocationId: number | null = null;

  /**
   * Set the collected customer info from the form.
   */
  setCollectedInfo(info: CustomerInfo, customerId: number, locationId: number): void {
    this.collectedInfo = info;
    this.createdCustomerId = customerId;
    this.createdLocationId = locationId;
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    return this.collectedInfo;
  }

  getCustomerId(): number | null {
    return this.createdCustomerId;
  }

  getLocationId(): number | null {
    return this.createdLocationId;
  }

  /**
   * Reset strategy state (called when dialog closes).
   */
  reset(): void {
    this.collectedInfo = null;
    this.createdCustomerId = null;
    this.createdLocationId = null;
  }
}

/**
 * Authenticated Customer Strategy
 * Uses existing customer data from ServiceTitan.
 */
export class AuthenticatedCustomerStrategy implements CustomerDataStrategy {
  requiresCustomerStep = false;

  constructor(
    private customerId: number,
    private locationId: number | null = null
  ) {}

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    // Customer info already exists in ServiceTitan
    // No need to collect again - booking API will use customerId
    return null;
  }

  getCustomerId(): number | null {
    return this.customerId;
  }

  getLocationId(): number | null {
    return this.locationId;
  }

  /**
   * Set the selected location ID (when customer has multiple locations).
   */
  setLocationId(locationId: number): void {
    this.locationId = locationId;
  }
}
