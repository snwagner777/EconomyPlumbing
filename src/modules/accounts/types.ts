/**
 * Account Module Types
 * 
 * Frontend types for account (customer) creation and management.
 * Aligned with ServiceTitan CRM API requirements.
 */

import type { ServiceTitanCustomer } from '@shared/types/servicetitan';

/**
 * Account form data structure.
 * Maps to CreateCustomerData in server/lib/servicetitan/crm.ts
 */
export interface AccountFormData {
  // Customer Info
  name: string;
  phone: string;
  email?: string;
  customerType: 'Residential' | 'Commercial';
  
  // Billing Address
  billingStreet: string;
  billingUnit?: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  
  // Service Location (optional - creates second location if different from billing)
  hasSeparateServiceLocation: boolean;
  serviceLocationName?: string;
  serviceStreet?: string;
  serviceUnit?: string;
  serviceCity?: string;
  serviceState?: string;
  serviceZip?: string;
}

/**
 * Account creation result from API
 */
export interface AccountCreationResult {
  customer: ServiceTitanCustomer;
  primaryLocationId: number;
}

/**
 * Account creation error types
 */
export type AccountCreationError =
  | { type: 'duplicate'; existingCustomerId: number }
  | { type: 'validation'; field: string; message: string }
  | { type: 'api_error'; message: string }
  | { type: 'network_error' };
