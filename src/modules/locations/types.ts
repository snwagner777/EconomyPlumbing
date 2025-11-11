/**
 * Location Module Types
 * 
 * Frontend types for location (service address) creation and management.
 * Aligned with ServiceTitan CRM API requirements.
 */

import type { ServiceTitanLocation } from '@shared/types/servicetitan';

/**
 * Location form data structure.
 * Maps to CreateLocationData in server/lib/servicetitan/crm.ts
 */
export interface LocationFormData {
  // Customer association
  customerId: number;
  
  // Location details
  name?: string; // Optional - defaults to street address if not provided
  
  // Address
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  
  // Contact info
  phone: string;
  email?: string;
}

/**
 * Location creation result from API
 */
export interface LocationCreationResult {
  location: ServiceTitanLocation;
}

/**
 * Location creation error types
 */
export type LocationCreationError =
  | { type: 'duplicate'; existingLocationId: number }
  | { type: 'validation'; field: string; message: string }
  | { type: 'api_error'; message: string }
  | { type: 'network_error' };
